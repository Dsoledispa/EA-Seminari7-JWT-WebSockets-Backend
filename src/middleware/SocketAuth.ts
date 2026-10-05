import jwt from 'jsonwebtoken';

import { config } from '../config/config';
import Logging from '../library/Logging';
import type { AccessTokenPayload } from '../types/auth';
import type { ChatSocket } from '../types/chat';

// Middleware de socket.io: se ejecuta una vez, cuando un cliente intenta conectarse.
// Es el equivalente a VerifyToken para el chat. El cliente envía el access token en el handshake:
//
//     io(url, { auth: { token } })
//
// Si el token no es válido (falta, es falso, ha caducado o es un refresh token), la conexión se
// rechaza y el cliente recibe un connect_error con el mensaje 'Authentication error'.
// El token solo se comprueba al conectar: un socket ya abierto sigue funcionando aunque el token
// caduque después.
export const VerifySocketToken = (socket: ChatSocket, next: (error?: Error) => void): void => {
    const token = socket.handshake.auth?.token;

    if (typeof token !== 'string' || token.length === 0) {
        Logging.warning('Socket authentication failed: missing token.');
        next(new Error('Authentication error'));
        return;
    }

    try {
        const payload = jwt.verify(token, config.jwt.secret) as AccessTokenPayload;

        if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
            Logging.warning('Socket authentication failed: invalid token payload.');
            next(new Error('Authentication error'));
            return;
        }

        // Guardamos quién es el usuario: a partir de aquí el chat lo lee de socket.data.user
        socket.data.user = { id: payload.sub };
        next();
    } catch {
        Logging.warning('Socket authentication failed: invalid or expired token.');
        next(new Error('Authentication error'));
    }
};

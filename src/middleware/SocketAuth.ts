import jwt from 'jsonwebtoken';
import type { Socket } from 'socket.io';

import { config } from '../config/config';
import Logging from '../library/Logging';
import type { AccessTokenPayload } from '../types/auth';

export const VerifySocketToken = (socket: Socket, next: (error?: Error) => void): void => {
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

        socket.data.user = { id: payload.sub };
        next();
    } catch {
        Logging.warning('Socket authentication failed: invalid or expired token.');
        next(new Error('Authentication error'));
    }
};
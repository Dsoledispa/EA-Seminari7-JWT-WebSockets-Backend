import type { DefaultEventsMap, Server, Socket } from 'socket.io';

// Datos que el cliente envía para entrar a una sala de chat.
export interface ChatJoinPayload {
    room: string;
}

// Datos que el cliente envía para mandar un mensaje a una sala.
export interface ChatMessagePayload {
    room: string;
    text: string;
}

// Un mensaje tal como lo envía el servidor, en chat:message y dentro de chat:history.
// El usuario llega con su nombre para que el frontend pueda mostrarlo.
export interface ChatMessage {
    _id: string;
    room: string;
    user: { _id: string; name: string };
    text: string;
    timestamp: Date;
}

// Aviso que el servidor envía a un solo cliente cuando algo no se puede hacer.
export interface ChatError {
    message: string;
}

// Eventos que el cliente puede enviar al servidor (socket.emit en el frontend, socket.on aquí).
export interface ClientToServerEvents {
    'chat:join': (payload: ChatJoinPayload) => void;
    'chat:message': (payload: ChatMessagePayload) => void;
}

// Eventos que el servidor envía al cliente (socket.emit aquí, socket.on en el frontend).
export interface ServerToClientEvents {
    'chat:history': (messages: ChatMessage[]) => void;
    'chat:message': (message: ChatMessage) => void;
    'chat:error': (error: ChatError) => void;
    // Lista de ids de los usuarios con el chat abierto; se envía a todos cada vez que alguien entra o sale
    'users:online': (userIds: string[]) => void;
}

// Lo que el middleware SocketAuth guarda en cada conexión (socket.data).
export interface SocketData {
    user: { id: string };
}

// Con estos tipos, TypeScript avisa si se emite un evento que no existe o con datos que no tocan.
export type ChatServer = Server<ClientToServerEvents, ServerToClientEvents, DefaultEventsMap, SocketData>;
export type ChatSocket = Socket<ClientToServerEvents, ServerToClientEvents, DefaultEventsMap, SocketData>;

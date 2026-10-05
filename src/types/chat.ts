// Datos que el cliente envía para entrar a una sala de chat.
export interface ChatJoinPayload {
    room: string;
}

// Datos que el cliente envía para mandar un mensaje a una sala.
export interface ChatMessagePayload {
    room: string;
    text: string;
}
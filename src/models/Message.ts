import mongoose, { Document, Schema, Types } from 'mongoose';

// Estos son los datos que guardaremos de cada mensaje.
export interface IMessage {
    room: string;
    user: Types.ObjectId;
    text: string;
    timestamp: Date;
}

// Esta interfaz añade a los datos de un mensaje las propiedades del documento de MongoDB.
export interface IMessageModel extends IMessage, Document {}

// Este esquema explica a Mongoose cómo guardar y validar cada mensaje.
const MessageSchema: Schema = new Schema(
    {
        // Sala a la que pertenece el mensaje, por ejemplo "general" o un identificador de chat directo.
        room: { type: String, required: true, trim: true },

        // Identificador del usuario que escribió. "ref" indica que apunta al modelo User.
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },

        // Contenido escrito por el usuario.
        text: { type: String, required: true, trim: true },

        // Fecha y hora de creación. Mongoose la establece automáticamente al guardar el mensaje.
        timestamp: { type: Date, default: Date.now }
    },
    {
        // Evita que Mongoose añada su propio campo __v a cada mensaje.
        versionKey: false
    }
);

// Exporta el modelo para poder crear y consultar mensajes desde el código del chat.
export default mongoose.model<IMessageModel>('Message', MessageSchema);
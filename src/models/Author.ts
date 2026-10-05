import mongoose, { Document, Schema } from 'mongoose';

// Definimos los datos que puede tener un autor.
// Un autor es un dato del backoffice, como un libro: no inicia sesion, asi que no tiene
// contraseña ni rol. La autenticacion vive en el modelo User.
export interface IAuthor {

    name: string;

    email: string;

    birthDate?: Date;

    nationality?: string;

    biography?: string;

    website?: string;

    photoUrl?: string;

    active?: boolean;

    // Marca si el autor esta borrado. Los autores borrados no se eliminan fisicamente de la base de datos
    deleted: boolean;

    deletedAt?: Date;

}

// Esta interfaz junta los datos del autor con las propiedades de un documento de MongoDB
export interface IAuthorModel extends IAuthor, Document {}

// Definimos el esquema que van a seguir los autores en la base de datos
const AuthorSchema: Schema = new Schema(

    {
        // El nombre es obligatorio y quitamos los espacios del principio y del final
        name: { type: String, required: true, trim: true },

        // El email identifica al autor y por eso no puede repetirse
        // Tambien lo guardamos siempre en minusculas para evitar duplicados por mayusculas
        // La unicidad se define mas abajo como indice parcial (solo para autores no borrados)
        email: { type: String, required: true, lowercase: true, trim: true },

        // La fecha de nacimiento es opcional
        birthDate: { type: Date },

        // La nacionalidad es opcional y eliminamos los espacios sobrantes
        nationality: { type: String, trim: true },

        // La biografia puede tener como maximo 1000 caracteres
        biography: { type: String, maxlength: 1000 },

        // La pagina web y la foto son opcionales
        website: { type: String, trim: true },
        photoUrl: { type: String, trim: true },

        // Por defecto un autor esta activo
        active: { type: Boolean, default: true },

        deleted: { type: Boolean, default: false },

        deletedAt: { type: Date }
    },

    {
        // Mongoose crea automaticamente las fechas de creacion y actualizacion
        timestamps: true,

        // Quitamos el campo que usa Mongoose para controlar las versiones
        versionKey: false

    }

);

// Indice unico parcial del email: solo tiene que ser unico entre los autores no borrados.
// Asi un autor borrado logicamente libera su email para que otro autor nuevo lo pueda usar.
// Es importante definirlo con schema.index(): Mongoose ignora partialFilterExpression
// cuando se pone como opcion del campo.
AuthorSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { deleted: false } });

// Creamos y exportamos el modelo Author a partir del esquema
export default mongoose.model<IAuthorModel>('Author', AuthorSchema);


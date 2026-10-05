import path from 'node:path';
import swaggerJsdoc from 'swagger-jsdoc';
import j2s from 'joi-to-swagger';
import { Schemas } from '../middleware/Joi';
import { config } from './config';

// La documentación de cada endpoint está escrita en un comentario /** @openapi */
// encima de su ruta, en src/routes/. Aquí solo se montan las piezas comunes.

// Los esquemas del body salen de los mismos esquemas de Joi que validan las
// peticiones, así que no se pueden quedar desfasados.
const { swagger: authorInput } = j2s(Schemas.author.create);
const { swagger: bookInput } = j2s(Schemas.book.create);

// Lo que devuelve la API no es igual a lo que se envía: lleva el _id y las fechas que
// pone MongoDB, el autor nunca devuelve la contraseña, y el libro trae sus autores enteros.
const storedFields = {
    _id: { type: 'string', example: '6ab3f2fe9c500204a7d5f80b' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
};

const authorSchema = { type: 'object', properties: { ...storedFields, ...authorInput.properties } };

const bookSchema = {
    type: 'object',
    properties: {
        ...storedFields,
        ...bookInput.properties,
        authors: { type: 'array', items: authorSchema }
    }
};

// Ejemplos que se ven en la página de Swagger, sacados de los datos de npm run seed
const authorExample = {
    _id: '6ab3f2fe9c500204a7d5f801',
    name: 'Ursula K. Le Guin',
    email: 'leguin@example.com',
    birthDate: '1929-10-21T00:00:00.000Z',
    nationality: 'Estados Unidos',
    biography: 'Escritora de ciencia ficción y fantasía conocida por Terramar.',
    website: 'https://example.com/leguin',
    photoUrl: 'https://example.com/fotos/leguin.jpg',
    active: true,
    createdAt: '2026-09-23T10:00:00.000Z',
    updatedAt: '2026-09-23T10:00:00.000Z'
};

const bookExample = {
    _id: '6ab3f2fe9c500204a7d5f80b',
    title: 'A Wizard of Earthsea',
    authors: [authorExample],
    isbn: '9788400000008',
    edition: 1,
    publisher: 'Editorial Ejemplo',
    publishedYear: 1968,
    pages: 183,
    language: 'en',
    tags: ['fantasia'],
    price: 16,
    createdAt: '2026-09-23T10:00:00.000Z',
    updatedAt: '2026-09-23T10:00:00.000Z'
};

// Una respuesta correcta: el esquema de lo que se devuelve y un ejemplo con datos de verdad
const okResponse = (description: string, schema: object, example: object) => ({
    description,
    content: { 'application/json': { schema, example } }
});

// Una respuesta de error: siempre un message, con un ejemplo del mensaje real
const errorResponse = (description: string, message: string) => ({
    description,
    content: {
        'application/json': {
            schema: {
                type: 'object',
                properties: { message: { type: 'string' } }
            },
            example: { message }
        }
    }
});

const swaggerPath = (filePath: string) => filePath.replace(/\\/g, '/');

const swaggerDocument = swaggerJsdoc({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Library API',
            version: '1.0.0',
            description: 'API de autores y libros del Seminari 7 (Node.js, Express, TypeScript y MongoDB).'
        },
        servers: [{ url: `http://localhost:${config.server.port}` }],
        tags: [
            { name: 'Health', description: 'Comprobar que la API responde' },
            { name: 'Authors', description: 'Autores' },
            { name: 'Books', description: 'Libros' }
        ],
        components: {
            schemas: {
                AuthorInput: authorInput,
                BookInput: bookInput,
                Author: authorSchema,
                Book: bookSchema
            },
            responses: {
                AuthorOne: okResponse('Un autor', { type: 'object', properties: { author: authorSchema } }, { author: authorExample }),
                AuthorList: okResponse(
                    'Una página de autores y los datos de paginación',
                    {
                        type: 'object',
                        properties: {
                            authors: { type: 'array', items: authorSchema },
                            total: { type: 'integer', example: 12 },
                            page: { type: 'integer', example: 1 },
                            pages: { type: 'integer', example: 3 }
                        }
                    },
                    { authors: [authorExample], total: 12, page: 1, pages: 3 }
                ),
                BookOne: okResponse('Un libro, con los datos de sus autores', { type: 'object', properties: { book: bookSchema } }, { book: bookExample }),
                BookList: okResponse(
                    'Una página de libros y los datos de paginación',
                    {
                        type: 'object',
                        properties: {
                            books: { type: 'array', items: bookSchema },
                            total: { type: 'integer', example: 12 },
                            page: { type: 'integer', example: 1 },
                            pages: { type: 'integer', example: 3 }
                        }
                    },
                    { books: [bookExample], total: 12, page: 1, pages: 3 }
                ),
                BadRequest: errorResponse('El id de la URL no tiene forma de id de MongoDB', 'authorId no es un id válido'),
                InvalidPagination: errorResponse('Los parámetros de paginación o búsqueda no son válidos', '"page" must be greater than or equal to 1'),
                NotFound: errorResponse('No existe ningún recurso con ese id', 'not found'),
                Conflict: errorResponse('Ya existe otro recurso con ese email o ese ISBN', 'email ya existe'),
                Unprocessable: errorResponse('El body no cumple el esquema', '"email" is required'),
                ServerError: errorResponse('Error inesperado del servidor', 'Internal server error')
            }
        }
    },
    // __dirname es src/config con npm run dev y build/config con npm start:
    // en los dos casos se leen las rutas, porque al compilar se conservan los comentarios
    apis: [
        swaggerPath(path.join(__dirname, '../routes/*.ts')),
        swaggerPath(path.join(__dirname, '../routes/*.js')),
        swaggerPath(path.join(__dirname, '../server.ts')),
        swaggerPath(path.join(__dirname, '../server.js'))
    ]
});

export default swaggerDocument;

import mongoose from 'mongoose';
import { config } from './config/config';
import Logging from './library/Logging';

// Este script quita los campos password y role de los autores que ya estan guardados.
//
// Hasta el Seminario 6 los autores tenian contraseña y rol. En el Seminario 7 la autenticacion
// pasa al modelo User y esos campos desaparecen del esquema de Author. Pero quitar un campo del
// esquema no lo borra de los documentos que ya hay en MongoDB, y como el esquema ya no dice
// select: false, la contraseña cifrada volveria a salir en GET /authors.
//
// Hay que ejecutarlo una vez sobre las bases de datos que ya tenian autores:
//
//     npm run migrate-authors
//
// Si ningun autor tiene esos campos, no hace nada. (npm run seed -- --reset tambien lo
// soluciona, pero borra todos los datos.)

const migrateAuthors = async () => {
    await mongoose.connect(config.mongo.url, { retryWrites: true, w: 'majority' });
    Logging.info(`Conectado a ${config.mongo.url}`);

    // Usamos la coleccion directamente y no el modelo Author: el modelo ya no conoce estos
    // campos y Mongoose ignoraria el $unset
    const authors = mongoose.connection.collection('authors');

    const result = await authors.updateMany(
        { $or: [{ password: { $exists: true } }, { role: { $exists: true } }] },
        { $unset: { password: '', role: '' } }
    );

    Logging.info(`Autores actualizados: ${result.modifiedCount}`);
};

migrateAuthors()
    .catch((error) => {
        Logging.error(error);
        process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());

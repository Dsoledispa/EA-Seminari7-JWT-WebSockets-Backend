import { NextFunction, Request, Response } from 'express';
import User from '../models/User';

// Devuelve los datos básicos de los usuarios para que el frontend
// pueda mostrarlos y usarlos al iniciar un chat directo.
const listUsers = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        // Pedimos únicamente el ID y el nombre para no exponer otros datos personales.
        const users = await User.find().select('_id name').sort({ name: 1 }).lean();

        // Devolvemos la lista dentro de la propiedad "users".
        res.status(200).json({ users });
    } catch (error) {
        // El middleware de errores de Express se encarga de responder ante fallos.
        next(error);
    }
};

export default { listUsers };

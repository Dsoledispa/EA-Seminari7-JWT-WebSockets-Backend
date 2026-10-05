import express from 'express';
import controller from '../controllers/Users';

// Agrupa las rutas relacionadas con los usuarios.
const router = express.Router();

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: Lista los usuarios (para el chat directo)
 *     description: Cualquier usuario con sesión puede verla. Solo devuelve el id y el nombre, ordenados por nombre.
 *     responses:
 *       200:
 *         description: Los usuarios
 *         content:
 *           application/json:
 *             example: { users: [{ _id: 6ab3f2fe9c500204a7d5f8a1, name: Admin }, { _id: 6ab3f2fe9c500204a7d5f8a2, name: Usuario }] }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       500: { $ref: '#/components/responses/ServerError' }
 */

// Devuelve el listado de usuarios disponibles.
router.get('/', controller.listUsers);

export = router;

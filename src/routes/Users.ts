import express from 'express';
import controller from '../controllers/Users';

// Agrupa las rutas relacionadas con los usuarios.
const router = express.Router();

// Devuelve el listado de usuarios disponibles.
router.get('/', controller.listUsers);

export = router;
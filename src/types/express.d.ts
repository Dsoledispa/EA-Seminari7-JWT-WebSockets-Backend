import type { AuthUser } from './auth';

// Express no sabe que nosotros añadimos req.user en el middleware VerifyToken.
// Aquí ampliamos su tipo Request para que TypeScript conozca ese campo en todos los
// controladores. Es opcional (?) porque en las rutas públicas no hay usuario.
declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

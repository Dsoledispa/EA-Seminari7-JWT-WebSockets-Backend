# LOGS

Bitácora del backend del Seminario 7. Tiene dos partes:

- **Tareas**: lo que hay que hacer en este repositorio, por bloques. Quien coge una tarea la marca al cerrarla.
- **Bitácora**: lo que se ha hecho, las decisiones tomadas y qué prompts de IA se han usado.

Las tareas del frontend están en el LOGS.md de [EA-Seminari7-JWT-WebSockets-Frontend](https://github.com/Dsoledispa/EA-Seminari7-JWT-WebSockets-Frontend).

## Contrato

Lo que backend y frontend tienen que cumplir igual. Si algo de aquí cambia, se cambia en los dos LOGS.md.

- **Rutas públicas**: `POST /auth/register` y `POST /auth/login`. `POST /auth/refresh` se autentica con su propio refresh token. `GET /ping` y la documentación (`/api-docs`) también son públicas.
  Todo lo demás exige token.
- **Registro**: el cuerpo es `{ name, email, password }` (contraseña de 8 caracteres como mínimo; `role` no se acepta, todo usuario nuevo es `user`). Responde 201 con `{ user }` y **sin token**, 409
  si el email ya existe o 422 si el cuerpo no es válido. El frontend redirige entonces a la página de login.
- **Login**: el cuerpo es `{ email, password }`. Responde `{ token, refreshToken, user }` o 401. `user` es `{ _id, name, email, role, createdAt, updatedAt }`, sin contraseña.
- **Refresh**: el cuerpo es `{ refreshToken }`. Responde `{ token }` (un access token nuevo) o 401 si el refresh token ha caducado o no es válido. El refresh token no cambia.
- **Token**: se envía en la cabecera `Authorization: Bearer <token>`. Su payload lleva los claims `sub` (id del usuario), `role` y `exp`. El access token dura 15 minutos y el refresh token 7 días.
- **Errores de autenticación**: 401 si falta el token, ha caducado (`{ message: 'El token ha caducado' }`) o no es válido (`{ message: 'Token no válido' }`); 403 si hay sesión pero no el rol
  necesario.
- **Roles**: el CRUD del backoffice (autores y libros) es solo para `admin`. El chat es para todos los usuarios con sesión iniciada.
- **Modelos**: `users`, `authors` y `books`. La autenticación vive solo en `User` (`name`, `email`, `password`, `role`): los campos `password` y `role` que `Author` traía del Seminario 5 se
  eliminan, y enviarlos al crear o editar un autor da 422.
- **Paginación y búsqueda**: `GET /authors?page=&limit=&search=` y `GET /books?page=&limit=&search=`, por defecto `page=1` y `limit=5` (máximo 100). `search` es opcional y busca parcialmente sin
  distinguir mayúsculas: autores por nombre/email y libros por título/ISBN/descripción. Responden `{ authors, total, page, pages }` y `{ books, total, page, pages }` con metadatos calculados sobre los
  resultados filtrados.
- **Autores borrados**: un autor borrado (borrado lógico) sigue apareciendo dentro de sus libros.
- **Chat** (extra): por concretar al empezar el bloque B: los payloads de `chat:join` y `chat:message`, la forma del mensaje que emite el servidor (usuario, texto, fecha), cómo llega el historial al
  entrar y cómo se llama la sala de un chat directo.

## Tareas

### Estructura

- [x] `structure`: ramas `develop` y de objetivo, identidad del repositorio (nombre, README con el stack tecnológico, base de datos `seminari7`), CONTRIBUTING.md, este LOGS.md y linter

### Bloque A: autenticación JWT con el modelo `User`

- [x] Modelo `User` nuevo: nombre, email único, contraseña cifrada con el mismo hook de scrypt que ya tiene `Author`, `select: false` y `toJSON` sin contraseña, rol `user` o `admin`
- [x] Quitar de `Author` los campos `password` y `role` (sus hooks se mudan a `User`) y ajustar el seed, la validación de Joi y Swagger
- [x] `POST /auth/register` (pública): nombre, email y contraseña, validación con Joi, 409 si el email ya existe; responde 201 con el usuario y sin token
- [x] `POST /auth/login` (pública): comprueba la contraseña contra el hash (formato `scrypt:sal:clave`; ojo, `password` tiene `select: false` y hay que pedirla en la consulta) y devuelve
      `{ token, refreshToken, user }` o 401
- [x] `POST /auth/refresh`: con register, login y refresh, el router de auth queda en cuatro líneas
- [x] Servicio de auth: firmar el access token de vida corta (claims `sub`, `role`, `exp`) y el refresh token; `JWT_SECRET` y los tiempos de expiración en el `.env` y en el `.env.example`
- [x] Middleware `VerifyToken` en `middleware/`: saca el token de `Authorization: Bearer`, lo verifica y deja el usuario en `req.user`; `TokenExpiredError` y `JsonWebTokenError` se responden con 401
      desde el gestor de errores
- [x] Middleware de roles: 401 si no hay sesión, 403 si hay sesión pero no el rol necesario
- [x] Tipos: interfaz del payload del JWT y extensión del tipo `Request` de Express para `req.user`
- [x] Proteger las rutas según el contrato: todo salvo register y login, y el CRUD solo para `admin`
- [x] Seed: usuarios de ejemplo, al menos un `admin`, para la demo y las pruebas
- [x] Swagger: esquema `bearerAuth`, candado en las rutas protegidas y documentación de `/auth`

### Bloque B: WebSockets con mensajes guardados (extra)

Extra: el profesor lo marcó como no prioritario y seguramente no entra en la demo. Se mantiene simple: lo importante es poder explicar el flujo de un mensaje, desde que un usuario lo escribe hasta que
el servidor lo emite a los demás.

- [ ] Enganchar socket.io al `http.createServer(app)` que ya existe en `server.ts`
- [ ] Middleware de socket.io que valida el JWT del handshake (`auth: { token }`) antes de aceptar la conexión
- [ ] Chat a tres niveles con salas (rooms): sala general, salas de grupo y chat directo entre dos usuarios
- [ ] Eventos `connection`, `disconnect`, `chat:join` y `chat:message` (emisión a la sala), con los tipos de los eventos de cliente a servidor y de servidor a cliente
- [ ] Endpoint para listar usuarios, necesario para elegir con quién hablar en el chat directo
- [ ] Modelo `Message` en MongoDB (sala, usuario, texto, fecha): cada mensaje se guarda al recibirlo
- [ ] Historial: al entrar en una sala, el servidor envía los últimos mensajes guardados
- [ ] CORS del servidor de sockets y logger de conexiones, desconexiones y fallos de autenticación

### Bloque C: paginación en el servidor

- [x] `GET /authors` y `GET /books` con `?page=&limit=` (por defecto 1 y 5): `skip` y `limit` más `countDocuments`, y la respuesta con `total`, `page` y `pages`
- [x] Validar `page` y `limit` con Joi
- [x] Actualizar Swagger y, si hace falta más volumen para probar, ampliar el seed

### Extra opcional

- [ ] Que el rol `user` pueda ver la lista de libros (solo lectura), para que tenga algo más que el chat. Va después del bloque A y necesita su pareja en el frontend

## Bitácora

### 2026-10-03 · Punto de partida y `structure`

- El repositorio nace como copia del backend del Seminario 6 (que venía del S5). Del S6 trae la descripción de los libros y el borrado lógico (`deleted` y `deletedAt`, con índices únicos parciales
  para el email y el ISBN).
- Se crea `develop` como rama de integración; `main` queda para presentar.
- Identidad: el paquete pasa a llamarse `ea-seminari7-jwt-websockets-backend`, el README se pone al día con el stack tecnológico y la base de datos por defecto pasa a ser `seminari7`.
- El `.gitignore` heredado ignoraba todos los `.md` salvo el README (reglas de notas personales), y por eso se habían perdido CONTRIBUTING.md, EXERCISE.md y LOG.md. Se quita esa regla; CONTRIBUTING.md
  se recupera del S5 y la bitácora pasa a ser este LOGS.md.
- Linter: Oxlint (heredado del S5) pasa sin avisos con la configuración del proyecto (`.oxlintrc.json`). Por curiosidad se probó con las categorías `suspicious` y `pedantic`: salen 8 sugerencias de
  estilo (comentarios en línea, clase con solo métodos estáticos en `Logging.ts`, funciones largas, `async` sin `await`...) y ningún fallo. En el frontend se prueba angular-eslint para comparar las
  dos herramientas.

### 2026-10-04 · Paginación en el servidor (Bloque C)

- Se implementa la paginación de `GET /authors` y `GET /books`, con `page=1` y `limit=5` por defecto. Joi valida enteros, `page >= 1` y `1 <= limit <= 100`; los valores convertidos se guardan en
  `res.locals.query` y los inválidos responden 400.
- Las consultas usan `skip`, `limit` y orden estable por `_id`; `countDocuments` comparte el filtro `{ deleted: false }`. La respuesta incluye la lista correspondiente, `total`, `page` y `pages`. El
  `populate('authors')` de libros no filtra autores borrados lógicamente.
- Swagger documenta los parámetros, las respuestas paginadas y el error 400. El seed contiene 12 autores y 12 libros.
- Decisiones: mantener fuera del listado y del total los documentos borrados lógicamente; conservar los autores borrados en los libros relacionados.
- Validación ejecutada: `npm run build`, `npx oxlint` y comprobaciones de Joi, Swagger generado y cantidades/referencias del seed. No hay pruebas automatizadas ni script `test` en el paquete.

### 2026-10-04 · Búsqueda de autores y libros

- `GET /authors` admite `search` sobre nombre/email y `GET /books` sobre título/ISBN/descripción. La búsqueda literal, sin distinguir mayúsculas, se aplica antes de contar y paginar; Joi limita el
  término a 100 caracteres y Swagger documenta el parámetro.
- Validación ejecutada: `npm run build` y `npm run lint`.

### 2026-10-05 · Autenticación JWT (Bloque A)

- Nuevo modelo `User` (`name`, `email` único, `password`, `role` `user`/`admin`). La contraseña se cifra con scrypt en el hook `pre('save')`, tiene `select: false` y el `toJSON` la quita. El
  cifrado y la comprobación salen del modelo a `utils/password.ts` (`hashPassword` y `verifyPassword`); la comprobación usa `timingSafeEqual`.
- `Author` pierde `password`, `role`, el hook de cifrado y el log del email de bienvenida (pasa a `User`). Joi rechaza esos campos al crear o editar un autor, y el seed y Swagger se ajustan.
- Rutas `POST /auth/register`, `/auth/login` y `/auth/refresh`. El router de auth son cuatro líneas (las tres rutas y el `export`); su documentación de Swagger va debajo del código.
- Tokens con `jsonwebtoken` 9: access token de 15 minutos con `sub` y `role`, y refresh token de 7 días solo con `sub`. Se firman con **secretos distintos** (`JWT_SECRET` y `JWT_REFRESH_SECRET`)
  para que uno no sirva por el otro. Si falta un secreto, el servidor no arranca y dice cuál. Las cuatro variables nuevas están en `.env.example` y en el README.
- Middlewares `VerifyToken` (401) y `RequireRole` (403) en `middleware/`, aplicados en `server.ts`: `/authors` y `/books` son solo para `admin`. El `ErrorHandler` responde 401 a
  `TokenExpiredError` ("El token ha caducado") y al resto de `JsonWebTokenError` ("Token no válido"), con mensajes distintos para que el frontend sepa cuándo renovar.
- Tipos en `types/`: el payload de cada token y `req.user`, añadido al `Request` de Express.
- Seed: `admin@example.com` (admin) y `user@example.com` (user), los dos con la contraseña `seminari7`. El `--reset` borra también los usuarios.
- Swagger: esquema `bearerAuth` con seguridad global (candado en todas las rutas), `security: []` en `/auth/*` y `/ping`, y respuestas 401 y 403 en las rutas protegidas.
- Decisiones:
  - El registro no acepta `role`: los `admin` solo salen del seed, para que nadie pueda registrarse como administrador.
  - El login responde 401 con el mismo mensaje si el email no existe o si la contraseña está mal, para no revelar qué emails están registrados.
  - El refresh token va en el body y no se guarda en la base de datos: es lo más sencillo, a cambio de que no se pueda invalidar antes de que caduque (el logout es solo del cliente). Al
    renovar se relee el usuario, así que el token nuevo lleva su rol actual.
  - Cambios de contrato: `name` en el registro; el login añade `refreshToken`; se concreta el cuerpo y la respuesta de refresh y los mensajes de 401. Copiado al LOGS.md del frontend.
- Problema encontrado: al quitar `password` del esquema de `Author`, los autores que ya estaban en la base de datos devolvían su contraseña cifrada en `GET /authors` (el `select: false` ya no
  se aplica a un campo que el esquema no conoce). Se añade `npm run migrate-authors`, que quita `password` y `role` de los autores guardados sin borrar nada; `npm run seed -- --reset`
  también lo soluciona. **Quien se traiga estos cambios con una base de datos anterior tiene que ejecutar uno de los dos.**
- Aviso para el frontend: hasta que esté el bloque D, el frontend recibe 401 en todas las peticiones (no tiene login) y 422 al guardar un autor (sigue enviando `password` y `role`).
- Validación ejecutada: `npm run build` y `npm run lint` sin errores. Con la API arrancada contra MongoDB, 39 pruebas con curl, todas correctas: registro (201 sin token, 409 con email
  repetido aunque cambien las mayúsculas, 422 con `role`, sin nombre o con contraseña corta), login (200 con los dos tokens y sin contraseña; 401 igual con email inexistente o contraseña
  mala), 401 sin token, sin `Bearer`, con token mal formado, con firma falsa, con un refresh token en lugar del access y con un token caducado (instancia con `JWT_EXPIRES_IN=2s`), 403 como
  `user` en autores y libros, 200 como `admin` con la paginación y la búsqueda intactas y sin `password` ni `role` en los autores, 422 al crear un autor con `password`, refresh correcto
  (también tras caducar el access) y 401 si se le pasa un access token. Se comprueba también el documento de Swagger generado y que la API no arranca sin `JWT_SECRET`.

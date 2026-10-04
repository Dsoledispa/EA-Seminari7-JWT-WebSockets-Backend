# LOGS

Bitácora del backend del Seminario 7. Tiene dos partes:

- **Tareas**: lo que hay que hacer en este repositorio, por bloques. Quien coge una tarea la marca al cerrarla.
- **Bitácora**: lo que se ha hecho, las decisiones tomadas y qué prompts de IA se han usado.

Las tareas del frontend están en el LOGS.md de [EA-Seminari7-JWT-WebSockets-Frontend](https://github.com/Dsoledispa/EA-Seminari7-JWT-WebSockets-Frontend).

## Contrato

Lo que backend y frontend tienen que cumplir igual. Si algo de aquí cambia, se cambia en los dos LOGS.md.

- **Rutas públicas**: `POST /auth/register` y `POST /auth/login`. `POST /auth/refresh` se autentica con su propio refresh token. Todo lo demás exige token.
- **Registro**: responde 201 con el usuario y **sin token**. El frontend redirige entonces a la página de login.
- **Login**: el cuerpo es `{ email, password }`. Responde `{ token, user }` o 401.
- **Token**: se envía en la cabecera `Authorization: Bearer <token>`. Su payload lleva los claims `sub` (id del usuario), `role` y `exp`.
- **Roles**: el CRUD del backoffice (autores y libros) es solo para `admin`. El chat es para todos los usuarios con sesión iniciada.
- **Modelos**: `users`, `authors` y `books`. La autenticación vive solo en `User`: los campos `password` y `role` que `Author` traía del Seminario 5 se eliminan.
- **Paginación y búsqueda**: `GET /authors?page=&limit=&search=` y `GET /books?page=&limit=&search=`, por defecto `page=1` y `limit=5` (máximo 100). `search` es opcional y busca parcialmente sin
  distinguir mayúsculas: autores por nombre/email y libros por título/ISBN/descripción. Responden `{ authors, total, page, pages }` y `{ books, total, page, pages }` con metadatos calculados sobre los
  resultados filtrados.
- **Autores borrados**: un autor borrado (borrado lógico) sigue apareciendo dentro de sus libros.
- **Chat** (extra): por concretar al empezar el bloque B: los payloads de `chat:join` y `chat:message`, la forma del mensaje que emite el servidor (usuario, texto, fecha), cómo llega el historial al
  entrar y cómo se llama la sala de un chat directo.

## Tareas

### Estructura

- [ ] `structure`: ramas `develop` y de objetivo, identidad del repositorio (nombre, README con el stack tecnológico, base de datos `seminari7`), CONTRIBUTING.md, este LOGS.md y linter

### Bloque A: autenticación JWT con el modelo `User`

- [ ] Modelo `User` nuevo: email único, contraseña cifrada con el mismo hook de scrypt que ya tiene `Author`, `select: false` y `toJSON` sin contraseña, rol `user` o `admin`
- [ ] Quitar de `Author` los campos `password` y `role` (sus hooks se mudan a `User`) y ajustar el seed, la validación de Joi y Swagger
- [ ] `POST /auth/register` (pública): email y contraseña, validación con Joi, 409 si el email ya existe; responde 201 con el usuario y sin token
- [ ] `POST /auth/login` (pública): comprueba la contraseña contra el hash (formato `scrypt:sal:clave`; ojo, `password` tiene `select: false` y hay que pedirla en la consulta) y devuelve
      `{ token, user }` o 401
- [ ] `POST /auth/refresh`: con register, login y refresh, el router de auth queda en cuatro líneas
- [ ] Servicio de auth: firmar el access token de vida corta (claims `sub`, `role`, `exp`) y el refresh token; `JWT_SECRET` y los tiempos de expiración en el `.env` y en el `.env.example`
- [ ] Middleware `VerifyToken` en `middleware/`: saca el token de `Authorization: Bearer`, lo verifica y deja el usuario en `req.user`; `TokenExpiredError` y `JsonWebTokenError` se responden con 401
      desde el gestor de errores
- [ ] Middleware de roles: 401 si no hay sesión, 403 si hay sesión pero no el rol necesario
- [ ] Tipos: interfaz del payload del JWT y extensión del tipo `Request` de Express para `req.user`
- [ ] Proteger las rutas según el contrato: todo salvo register y login, y el CRUD solo para `admin`
- [ ] Seed: usuarios de ejemplo, al menos un `admin`, para la demo y las pruebas
- [ ] Swagger: esquema `bearerAuth`, candado en las rutas protegidas y documentación de `/auth`

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

- [ ] `GET /authors` y `GET /books` con `?page=&limit=` (por defecto 1 y 5): `skip` y `limit` más `countDocuments`, y la respuesta con `total`, `page` y `pages`
- [ ] Validar `page` y `limit` con Joi
- [ ] Actualizar Swagger y, si hace falta más volumen para probar, ampliar el seed

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

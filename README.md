# myAPIRest

Plataforma modular de servicios REST para autenticación, gestión de usuarios y capacidades compartidas entre las aplicaciones Pet, SonicPI y Health.

> Estado: API base ejecutable con autenticación, sesiones y recuperación de contraseña.

## Propósito

Este repositorio reúne capacidades que varias aplicaciones necesitan en común, empezando por identidad y acceso. No sustituye los dominios propios de cada aplicación: los mantiene separados y evita copiar lógica sensible de autenticación en cada proyecto.

## Alcance inicial

La primera versión expondrá una API versionada (`/api/v1`) con estos endpoints:

| Método | Ruta | Propósito |
| --- | --- | --- |
| `POST` | `/auth/register` | Crear una cuenta de usuario. |
| `POST` | `/auth/login` | Iniciar una sesión. |
| `POST` | `/auth/request-login-code` | Solicitar un OTP de inicio de sesión sin contraseña. |
| `POST` | `/auth/verify-login-code` | Confirmar OTP e iniciar una sesión. |
| `POST` | `/auth/logout` | Revocar la sesión actual. |
| `POST` | `/auth/forgot-password` | Solicitar un OTP de recuperación. |
| `POST` | `/auth/reset-password` | Confirmar OTP y cambiar contraseña. |
| `GET` | `/users/me` | Consultar el perfil del usuario autenticado. |
| `GET` | `/movies/now-playing`, `/movies/popular`, `/movies/top-rated`, `/movies/upcoming` | Consultar catálogo de películas. |
| `GET` | `/movies/:id` | Consultar detalle de una película. |
| `GET` | `/events?countryCode=MX&size=10&page=0` | Consultar eventos de Ticketmaster. |
| `GET` | `/events/classifications` | Consultar clasificaciones de Ticketmaster. |
| `POST` | `/purchases` | Crear una compra de boletos mediante la pasarela sandbox. |
| `GET` | `/purchases` | Consultar las compras confirmadas del usuario autenticado. |

## Límites por dominio

- **auth** y **users** serán módulos compartidos y propietarios de identidad, sesiones y perfil base.
- **pet**, **health** y futuros módulos conservarán sus datos y reglas propias.
- Los campos particulares de salud o mascotas no se añadirán al usuario base sin una necesidad compartida y explícita.

La arquitectura inicial será un **monolito modular**. Es más simple de desarrollar, probar y desplegar que microservicios para esta fase, y deja límites claros para una futura separación si el producto la necesita.

## Stack propuesto

- Node.js LTS y TypeScript
- NestJS
- PostgreSQL
- Prisma ORM y migraciones versionadas
- Docker Compose para el entorno local
- OpenAPI/Swagger para documentar el contrato HTTP
- Vitest para pruebas

La selección final se versionará junto con la implementación; no se instalarán dependencias sin revisar su mantenimiento, licencia y necesidad.

## Seguridad desde el inicio

- Contraseñas protegidas con Argon2id; nunca se almacenan ni registran en texto plano.
- Access tokens de corta duración y refresh tokens rotatorios, almacenados como hash y revocables al cerrar sesión.
- Validación de toda entrada HTTP, límites de tamaño de payload y respuestas de error sin datos internos.
- Rate limiting en endpoints sensibles como registro y login.
- CORS y cabeceras de seguridad se configurarán antes de habilitar clientes web o despliegues públicos.
- Secretos exclusivamente en variables de entorno; `.env` nunca se sube al repositorio. Se proporcionará `.env.example` sin secretos.
- Los datos de tarjeta y CVV usados por la pasarela sandbox se validan en memoria: nunca se guardan, devuelven ni registran.
- Migraciones, lockfile y configuración reproducible sí se guardan en Git.

## Desarrollo

Requiere Node.js 24.

```bash
npm install
npm run start:dev
```

Con el servidor en ejecución, el endpoint técnico `GET /api/v1/health` responde:

```json
{ "status": "ok" }
```

La documentación interactiva está disponible en `http://localhost:3000/api/docs` y su documento OpenAPI JSON en `http://localhost:3000/api/docs-json`. Swagger permite obtener los ejemplos de cada endpoint y usar **Authorize** con un access token Bearer para probar `GET /users/me`.

Antes de integrar cambios, verifica la base con:

```bash
npm run build
npm test
npm run test:e2e
npm audit
```

## Base de datos local

PostgreSQL se ejecuta en Docker y se expone solamente en `localhost:5432`; no es accesible desde otros dispositivos de la red.

```bash
docker compose up -d
docker compose ps
```

La primera ejecución crea un volumen Docker llamado `my-api-rest_postgres_data`, que conserva los datos al detener el contenedor. Para detener la base sin borrar datos:

```bash
docker compose down
```

`.env` contiene credenciales locales y está excluido de Git. Si otro desarrollador clona el repositorio, debe copiar `.env.example` como `.env` y reemplazar la contraseña de ejemplo antes de iniciar los contenedores.

## Prisma y migraciones

Prisma gestiona el esquema y las migraciones de PostgreSQL. El modelo compartido inicial es `User`; datos exclusivos de Pet o Health se modelarán en módulos separados.

Dentro de NestJS, `PrismaModule` expone `PrismaService` como la única puerta técnica a PostgreSQL. Los módulos de negocio deben depender de ese servicio, nunca abrir conexiones o ejecutar SQL por su cuenta.

## Módulo de usuarios

`users` concentra el modelo compartido de usuario y separa sus casos de uso del adaptador PostgreSQL. No expone rutas HTTP ni devuelve hashes de contraseña: esa responsabilidad se añadirá al módulo `auth`.

## Registro

`POST /api/v1/auth/register` crea un usuario con un correo y contraseña válidos. Las contraseñas se procesan con Argon2id y nunca se incluyen en las respuestas ni se almacenan en texto plano.

`POST /api/v1/auth/login` emite un access token JWT de corta duración y un refresh token opaco. Los refresh tokens se almacenan únicamente como hash en `refresh_sessions`, para que puedan revocarse o rotarse sin persistir secretos de sesión.

`POST /api/v1/auth/refresh` rota el refresh token: el anterior deja de ser válido al entregar el siguiente. `POST /api/v1/auth/logout` revoca la sesión asociada al refresh token y responde `200` con `{ "success": true }`.

`POST /api/v1/auth/forgot-password` siempre responde `202`, exista o no la cuenta, para no revelar correos registrados. Para una cuenta activa genera un OTP de seis dígitos, válido durante 15 minutos. `POST /api/v1/auth/reset-password` valida el OTP, permite un máximo de cinco intentos, cambia la contraseña y revoca todas las sesiones existentes.

## Compras y pasarela sandbox

`POST /api/v1/purchases` crea una compra confirmada para el usuario autenticado. El servicio valida que el horario y los asientos existan, recalcula el precio en el servidor, registra una fotografía histórica del boleto y evita la doble venta con una restricción única por horario y asiento. `GET /api/v1/purchases` devuelve el historial de compras del usuario actual.

La pasarela es **exclusivamente sandbox**: las tarjetas siguientes son datos de prueba, no representan tarjetas reales y no procesan cargos. Los números completos, fecha de expiración y CVV se usan solo para simular la decisión del banco y nunca se persisten, devuelven ni registran.

| Marca | Resultado sandbox | Número | Expira | CVV |
| --- | --- | --- | --- | --- |
| Visa | Aprobado | `4242 4242 4242 4242` | `10/30` | `111` |
| Mastercard | Aprobado | `5555 5555 5555 4444` | `10/30` | `222` |
| Amex | Aprobado | `3782 822463 10005` | `10/30` | `3333` |
| Visa | Rechazado por el banco | `4000 0000 0000 0002` | `10/30` | `111` |
| Mastercard | Rechazado por el banco | `5105 1051 0510 5100` | `10/30` | `222` |
| Amex | Rechazado por el banco | `3714 496353 98431` | `10/30` | `3333` |

Una tarjeta aprobada con fecha o CVV distinto devuelve `400 PAYMENT_INVALID_DETAILS`. Una tarjeta configurada como rechazada devuelve `402 PAYMENT_DECLINED`. Ninguno de los dos casos crea una compra ni marca asientos como vendidos.

## Contrato de errores

Todos los errores HTTP comparten este formato, para que los clientes no dependan de respuestas particulares de NestJS:

```json
{
  "statusCode": 401,
  "code": "AUTH_INVALID_CREDENTIALS",
  "message": "Correo o contraseña inválidos."
}
```

La aplicación cliente debe usar `code` para decidir el comportamiento y `message` para mostrar una explicación segura. Los errores internos se devuelven como `INTERNAL_ERROR`; nunca incluyen detalles de PostgreSQL, Prisma, Resend ni secretos.

## Movie catalog

`movies` is a protected integration module for TMDB. It keeps the TMDB read token on the API server and returns a TMDB-compatible response while TicketSeller migrates to the shared host. Collections are cached in-memory for five minutes per API process. Configure `TMDB_READ_ACCESS_TOKEN` only in `.env`; never include it in a mobile application. TMDB attribution remains required in TicketSeller.

`events` follows the same protected integration pattern for Ticketmaster Discovery. It keeps `TICKETMASTER_API_KEY` on the API server, preserves Ticketmaster-compatible responses, and caches each request for five minutes. The mobile client must never contain the key.

## Passwordless login OTP

Active users can request a six-digit login code with `POST /auth/request-login-code` and exchange it at `POST /auth/verify-login-code`. Codes are stored only as hashes, expire after 10 minutes, are single-use, and accept at most five verification attempts. The request endpoint always returns `202` so it does not reveal whether an email is registered.

Las rutas de autenticación permiten cinco intentos por IP en un minuto. El almacenamiento del rate limit es local en esta etapa; antes de desplegar varias réplicas se reemplazará por un almacenamiento compartido, como Redis.

```bash
npm run prisma:validate
npm run prisma:migrate -- --name describe-your-change
npm run prisma:generate
```

Las migraciones generadas en `prisma/migrations` se guardan en Git. El cliente generado en `src/generated/prisma` no se versiona: se vuelve a generar desde el esquema.

## Correo transaccional

El proyecto usa una abstracción `EmailService`. En local, `EMAIL_PROVIDER=console` es el valor predeterminado: el servidor registra el OTP y no entrega correo a Internet.

Para activar Resend, crea una API key y verifica el dominio del remitente en su panel. En tu `.env`, que nunca se versiona, configura:

```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...
EMAIL_FROM="MyAPIRest <noreply@tu-dominio-verificado.com>"
```

No pongas `RESEND_API_KEY` en clientes web o móviles, repositorios ni mensajes. Resend recibe la solicitud exclusivamente desde esta API. La integración usa el SDK oficial de Node.js; su guía requiere una API key y un remitente configurado. [Documentación de Resend](https://resend.com/nodejs)

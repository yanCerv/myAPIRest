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
| `POST` | `/auth/logout` | Revocar la sesión actual. |
| `POST` | `/auth/forgot-password` | Solicitar un OTP de recuperación. |
| `POST` | `/auth/reset-password` | Confirmar OTP y cambiar contraseña. |
| `GET` | `/users/me` | Consultar el perfil del usuario autenticado. |

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

`POST /api/v1/auth/refresh` rota el refresh token: el anterior deja de ser válido al entregar el siguiente. `POST /api/v1/auth/logout` revoca la sesión asociada al refresh token.

`POST /api/v1/auth/forgot-password` siempre responde `202`, exista o no la cuenta, para no revelar correos registrados. Para una cuenta activa genera un OTP de seis dígitos, válido durante 15 minutos. `POST /api/v1/auth/reset-password` valida el OTP, permite un máximo de cinco intentos, cambia la contraseña y revoca todas las sesiones existentes.

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

# myAPIRest

Plataforma modular de servicios REST para autenticación, gestión de usuarios y capacidades compartidas entre las aplicaciones Pet, SonicPI y Health.

> Estado: base ejecutable de NestJS. Autenticación y persistencia aún pendientes.

## Propósito

Este repositorio reúne capacidades que varias aplicaciones necesitan en común, empezando por identidad y acceso. No sustituye los dominios propios de cada aplicación: los mantiene separados y evita copiar lógica sensible de autenticación en cada proyecto.

## Alcance inicial

La primera versión expondrá una API versionada (`/api/v1`) con estos endpoints:

| Método | Ruta | Propósito |
| --- | --- | --- |
| `POST` | `/auth/register` | Crear una cuenta de usuario. |
| `POST` | `/auth/login` | Iniciar una sesión. |
| `POST` | `/auth/logout` | Revocar la sesión actual. |
| `GET` | `/users/me` | Consultar el perfil del usuario autenticado. |
| `DELETE` | `/users/me` | Eliminar la cuenta del usuario autenticado. |

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
- Jest para pruebas

La selección final se versionará junto con la implementación; no se instalarán dependencias sin revisar su mantenimiento, licencia y necesidad.

## Seguridad desde el inicio

- Contraseñas protegidas con Argon2id; nunca se almacenan ni registran en texto plano.
- Access tokens de corta duración y refresh tokens rotatorios, almacenados como hash y revocables al cerrar sesión.
- Validación de toda entrada HTTP, límites de tamaño de payload y respuestas de error sin datos internos.
- Rate limiting en endpoints sensibles como registro y login.
- CORS limitado a orígenes permitidos y cabeceras de seguridad.
- Secretos exclusivamente en variables de entorno; `.env` nunca se sube al repositorio. Se proporcionará `.env.example` sin secretos.
- Migraciones, lockfile y configuración reproducible sí se guardan en Git.

## Próximos pasos

1. Añadir `.gitignore` y configuración base para Node.js/TypeScript.
2. Inicializar NestJS y las herramientas de formato, lint y pruebas.
3. Crear Docker Compose con PostgreSQL y configurar Prisma.
4. Implementar el módulo `auth` con pruebas de seguridad antes de integrar aplicaciones consumidoras.

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

Antes de integrar cambios, verifica la base con:

```bash
npm run build
npm test
npm run test:e2e
npm audit
```

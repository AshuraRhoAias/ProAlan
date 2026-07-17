# MastrFlow API

API REST + SSE en Express.js (Node.js 20) que da servicio al frontend de [MastrFlow](../README.md). Gestiona autenticación, menú, mesas, órdenes y turnos sobre MySQL 8.0.

---

## Stack

| Capa | Tecnología |
|---|---|
| Runtime | Node.js 20 + TypeScript |
| Framework | Express.js |
| Base de datos | MySQL 8.0 (`mysql2`) |
| Auth | JWT (PIN de 4 dígitos) |
| Tiempo real | SSE (Server-Sent Events) en `/api/events` |

---

## Desarrollo local

Requiere una instancia de MySQL accesible (ver `docker-compose.yml` en la raíz del repo — `npm run setup` la levanta junto con el esquema).

```bash
cd server
npm install
cp .env.example .env   # ajusta los valores según tu entorno
npm run dev             # tsx watch — recarga en caliente en el puerto 4000
```

## Build de producción

```bash
npm run build   # compila TypeScript a dist/
npm start        # node dist/index.js
```

También hay un `Dockerfile` multi-stage listo para producción (usado por `docker-compose.yml` en la raíz).

---

## Variables de entorno

| Variable | Descripción | Default |
|---|---|---|
| `DB_HOST` | Host de MySQL | `localhost` |
| `DB_PORT` | Puerto de MySQL | `3306` |
| `DB_NAME` | Base de datos | `mastrflow` |
| `DB_USER` | Usuario de MySQL | `mastrflow` |
| `DB_PASS` | Password de MySQL | `mastrflow_pass` |
| `PORT` | Puerto en el que escucha la API | `4000` |
| `NODE_ENV` | Entorno de ejecución | `development` |
| `JWT_SECRET` | Clave para firmar tokens JWT — **cámbiala en producción** | — |
| `JWT_EXPIRES_IN` | Expiración del token | `8h` |
| `CORS_ORIGIN` | Origen permitido para CORS (el dominio del frontend) | `http://localhost:1420` |

Ver `.env.example` para la plantilla completa.

---

## Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/api/auth/login` | Login con `name` + `pin` |
| GET | `/api/auth/me` | Usuario autenticado |
| GET | `/api/menu` | Ítems del menú |
| GET | `/api/restaurant/tables` | Mesas |
| GET | `/api/orders` | Órdenes activas |
| POST | `/api/orders` | Crear orden |
| PATCH | `/api/orders/:id/status` | Cambiar estado (waiting/cooking/ready/closed) |
| POST | `/api/orders/:id/items` | Añadir ítems a una orden |
| PATCH | `/api/orders/:id/items/:itemId/cancel` | Cancelar un ítem |
| PATCH | `/api/orders/:id/close` | Cerrar con propina y método de pago |
| PATCH | `/api/orders/:id/cancel` | Cancelar orden completa |
| GET | `/api/events` | Stream SSE de eventos en tiempo real |

---

## Desplegar esta API

El frontend (`/`) se despliega en Vercel como sitio estático, pero **esta API no debe desplegarse en Vercel**: mantiene un pool de conexiones MySQL persistente y expone un stream SSE de larga duración en `/api/events`, y las funciones serverless de Vercel no están pensadas para conexiones de ese tipo (se reciclan por invocación y tienen límites de duración).

Despliega esta API como un servicio Node.js de larga duración — por ejemplo con el `Dockerfile` incluido en:
- Railway, Render, Fly.io o un VPS con Docker (reutilizando `docker-compose.yml` de la raíz)
- Cualquier proveedor con soporte para contenedores Node.js + MySQL gestionado

Pasos:

1. Provisiona MySQL 8.0 (gestionado o vía Docker) y aplica `docker/mysql/init.sql`.
2. Despliega esta carpeta (`server/`) como servicio Node.js — build: `npm run build`, start: `npm start`.
3. Configura las variables de entorno de la tabla anterior, apuntando `DB_HOST`/`DB_USER`/`DB_PASS` a tu MySQL y `CORS_ORIGIN` al dominio del frontend en Vercel (ej. `https://pro-alan.vercel.app`).
4. En el proyecto de Vercel, define `VITE_API_URL` con la URL pública de esta API (ej. `https://api.tudominio.com`) para que el frontend le apunte.

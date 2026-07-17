# MastrFlow

Sistema de gestión de pedidos y mesas para restaurantes. Interfaz de escritorio multiplataforma (Windows, macOS, Linux, Android, iOS) construida con React + Tauri, respaldada por una API Node.js y MySQL en Docker.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Desktop/Móvil | Tauri v2 |
| API | Express.js (Node.js 20) en puerto 4000 |
| Base de datos | MySQL 8.0 |
| Infraestructura | Docker Compose |
| Auth | JWT (PIN + usuario) |
| Tiempo real | SSE (Server-Sent Events) |

---

## Funcionalidades

- **Dashboard** — vista de mesas con estado en tiempo real (disponible / esperando / cocinando / lista)
- **Órdenes** — crear orden por mesa, añadir productos, quitar ítems, enviar a cocina, cobrar con propina, cancelar
- **Kitchen Display (KDS)** — panel de cocina con tabs Waiting / Cooking / Ready, timer por orden, checkboxes por ítem
- **Timers de cocina** — temporizadores con anillo SVG animado, pausa/reanudar/reiniciar
- **Actualizaciones en vivo** — SSE propaga cambios de estado a Dashboard y KDS sin recargar
- **Login** — autenticación por nombre de usuario + PIN de 4 dígitos

---

## Modo Demo (sin backend)

El frontend (`src/`) funciona hoy como una **demo 100% autocontenida**: no hace ninguna llamada de red. Todos los datos (mesas, menú, órdenes, sesión, tema) se generan en el navegador y se guardan en **cookies**, así que el estado persiste entre recargas de página sin necesidad de Docker, MySQL ni la API de `server/`.

Esto permite desplegar `src/` como sitio estático (por ejemplo en Vercel) sin configurar ninguna URL de backend.

PINs de demo (ver `src/services/demoStore.ts`):

| PIN | Usuario | Rol |
|---|---|---|
| `0000` | Admin | admin |
| `1234` | Manager | manager |
| `5678` | Chef | kitchen |
| `9999` | Mesero | waiter |

Para limpiar el estado de la demo, borra las cookies del sitio (o usa una ventana de incógnito).

> El backend real (`server/` + MySQL, ver `server/README.md`) sigue existiendo en el repo pero el frontend actual no está conectado a él.

---

## Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows / macOS / Linux)
- [Node.js 20+](https://nodejs.org/)
- [Rust](https://rustup.rs/) — solo si compilas la app de escritorio con Tauri

---

## Inicio rápido

### 1. Clonar el repositorio

```bash
git clone https://github.com/AshuraRhoAias/ProAlan.git
cd ProAlan
```

### 2. Levantar la base de datos y la API

```bash
npm run setup
# o equivalentemente:
npm run docker
```

Esto:
1. Verifica que Docker esté corriendo
2. Construye la imagen de la API
3. Levanta los contenedores (`db` + `api`)
4. Espera a que MySQL esté listo
5. Aplica `docker/mysql/init.sql` (idempotente — seguro de re-ejecutar)

### 3. Ejecutar el frontend en desarrollo

```bash
npm run dev
```

Abre `http://localhost:1420` en el navegador.

### 4. (Opcional) App de escritorio con Tauri

```bash
npm run tauri:dev
```

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Frontend en modo desarrollo (Vite HMR) |
| `npm run build` | Build de producción del frontend |
| `npm run setup` | Levanta Docker y aplica la base de datos |
| `npm run docker` | Alias de `setup` |
| `npm run docker:up` | `docker compose up -d --build` |
| `npm run docker:down` | Detiene los contenedores |
| `npm run docker:reset` | Destruye volúmenes y recrea todo |
| `npm run docker:logs` | Logs de todos los servicios |
| `npm run docker:logs:api` | Logs solo de la API |
| `npm run docker:logs:db` | Logs solo de MySQL |
| `npm run tauri:dev` | App de escritorio en desarrollo |
| `npm run tauri:build` | Compila el instalador de escritorio |
| `npm run tauri android dev` | App Android en desarrollo |
| `npm run tauri android build` | Compila APK/AAB |
| `npm run tauri ios dev` | App iOS en desarrollo |
| `npm run tauri ios build` | Compila IPA |

---

## Variables de entorno

Crea un `.env` en la raíz para sobreescribir los valores por defecto:

```env
MYSQL_ROOT_PASSWORD=root_secret
MYSQL_USER=mastrflow
MYSQL_PASSWORD=mastrflow_pass
JWT_SECRET=cambia_esto_en_produccion
CORS_ORIGIN=http://localhost:1420
```

El frontend actual (modo demo) no requiere ninguna variable de entorno — no hace llamadas de red. `VITE_API_URL` solo la usan la API (`server/`) y código legacy sin usar (`src/lib/api.ts`).

---

## Despliegue

- **Frontend** — el sitio en `src/` se despliega como estático en Vercel (ver `vercel.json`) sin configuración adicional: corre en modo demo con datos en cookies.
- **API** — `server/` es un servicio Node.js con MySQL y un stream SSE de larga duración, así que no va en Vercel. Ver [`server/README.md`](server/README.md) para cómo correrla y desplegarla. Actualmente el frontend no está conectado a ella.

---

## Estructura del proyecto

```
ProAlan/
├── src/                    # Frontend React
│   ├── pages/
│   │   ├── Dashboard.tsx   # Vista de mesas
│   │   ├── Kitchen.tsx     # KDS (Kitchen Display System)
│   │   ├── Login.tsx       # Autenticación
│   │   └── Settings.tsx    # Configuración
│   ├── components/
│   │   └── modals/
│   │       ├── OrderModal.tsx    # Crear nueva orden
│   │       └── OrderDetail.tsx   # Ver / gestionar orden activa
│   ├── services/
│   │   ├── api.ts          # Superficie pública (tipos + wrapper del demo store)
│   │   └── demoStore.ts    # "Backend" en memoria persistido en cookies
│   └── index.css           # Estilos globales
├── server/                 # API Express.js
│   └── src/
│       ├── controllers/    # Lógica de negocio
│       ├── models/         # Consultas MySQL
│       └── routes/         # Definición de rutas
├── docker/
│   └── mysql/
│       ├── init.sql        # Esquema + datos semilla (idempotente)
│       └── my.cnf          # Configuración MySQL
├── scripts/
│   ├── setup.cjs           # Script de inicialización completo
│   └── docker-create.cjs   # Aplica init.sql a contenedor existente
├── src-tauri/              # Configuración Tauri
└── docker-compose.yml
```

---

## API — Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
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

## Usuarios de prueba

Los usuarios se crean en `docker/mysql/init.sql`. Por defecto:

| Nombre | PIN | Rol |
|---|---|---|
| Admin | 1234 | admin |
| Chef | 5678 | kitchen |
| Mesero | 0000 | waiter |

> Los PINs se configuran directamente en la tabla `users` de la base de datos.

---

## Licencia

MIT

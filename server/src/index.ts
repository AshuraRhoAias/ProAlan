import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import authRoutes       from './routes/auth.routes.js';
import menuRoutes       from './routes/menu.routes.js';
import ordersRoutes     from './routes/orders.routes.js';
import shiftsRoutes     from './routes/shifts.routes.js';
import restaurantRoutes from './routes/restaurant.routes.js';
import usersRoutes      from './routes/users.routes.js';
import eventsRoutes     from './routes/events.routes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app  = express();
const PORT = Number(process.env.PORT ?? 4000);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*', credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.use('/api/auth',       authRoutes);
app.use('/api/menu',       menuRoutes);
app.use('/api/orders',     ordersRoutes);
app.use('/api/shifts',     shiftsRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/users',      usersRoutes);
app.use('/api/events',     eventsRoutes);   // SSE real-time notifications

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => console.log(`MastrFlow API → http://localhost:${PORT}`));

export default app;

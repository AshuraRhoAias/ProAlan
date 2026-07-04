import { Router, type Request, type Response } from 'express';
import { v4 as uuid } from 'uuid';
import { addClient } from '../services/events.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const id = uuid();
  addClient(id, res);

  // heartbeat each 25s to keep connection alive
  const heartbeat = setInterval(() => {
    try { res.write(': ping\n\n'); } catch (_) { clearInterval(heartbeat); }
  }, 25000);

  res.on('close', () => clearInterval(heartbeat));
});

export default router;

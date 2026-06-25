import type { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[ERROR]', err.message);
  const status = (err as { status?: number }).status ?? 500;
  res.status(status).json({ error: err.message ?? 'Error interno del servidor' });
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Ruta no encontrada' });
}

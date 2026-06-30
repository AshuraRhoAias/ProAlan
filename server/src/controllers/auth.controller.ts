import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User.js';
import type { AuthRequest } from '../types/index.js';

const JWT_SECRET  = process.env.JWT_SECRET  ?? 'change_me_in_production';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN ?? '12h';

export const login = async (req: Request, res: Response) => {
  const { pin, name } = req.body as { pin?: string; name?: string };
  if (!pin) return res.status(400).json({ error: 'PIN requerido' });

  const [rows] = await UserModel.findByPin(pin);
  if (!rows.length) return res.status(401).json({ error: 'PIN inválido' });

  const user = rows[0];

  // Si se proporciona nombre, verificar que coincida
  if (name && user.name.toLowerCase() !== name.toLowerCase()) {
    return res.status(401).json({ error: 'Usuario o PIN incorrecto' });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: JWT_EXPIRES as any });
  return res.json({
    token,
    user: { id: user.id, name: user.name, role: user.role },
  });
};

export const me = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const [rows] = await UserModel.findById(req.user.id);
  if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
  const { pin: _pin, ...safe } = rows[0];
  return res.json(safe);
};

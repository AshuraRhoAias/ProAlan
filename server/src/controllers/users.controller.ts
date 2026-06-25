import type { Request, Response } from 'express';
import { UserModel } from '../models/User.js';

export const getUsers = async (_req: Request, res: Response) => {
  const [rows] = await UserModel.findAll();
  res.json(rows);
};

export const getUser = async (req: Request, res: Response) => {
  const [rows] = await UserModel.findById(Number(req.params.id));
  if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
  const { pin: _pin, ...safe } = rows[0];
  res.json(safe);
};

export const createUser = async (req: Request, res: Response) => {
  const { name, role, pin } = req.body as { name?: string; role?: string; pin?: string };
  if (!name || !role || !pin) {
    return res.status(400).json({ error: 'name, role y pin son requeridos' });
  }
  const [result] = await UserModel.create({ name, role, pin });
  res.status(201).json({ id: result.insertId });
};

export const updateUser = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const [result] = await UserModel.update(id, req.body);
  if (!result.affectedRows) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ ok: true });
};

export const deleteUser = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const [result] = await UserModel.delete(id);
  if (!result.affectedRows) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ ok: true });
};

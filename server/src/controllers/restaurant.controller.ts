import type { Request, Response } from 'express';
import { RestaurantModel } from '../models/Restaurant.js';

// ── Restaurant ────────────────────────────────────────────────────────────────

export const getRestaurant = async (_req: Request, res: Response) => {
  const [rows] = await RestaurantModel.get();
  res.json(rows[0] ?? null);
};

export const updateRestaurant = async (req: Request, res: Response) => {
  await RestaurantModel.update(req.body);
  res.json({ ok: true });
};

// ── Customer types ────────────────────────────────────────────────────────────

export const getCustomerTypes = async (_req: Request, res: Response) => {
  const [rows] = await RestaurantModel.getCustomerTypes();
  res.json(rows);
};

export const createCustomerType = async (req: Request, res: Response) => {
  const { name, color } = req.body as { name?: string; color?: string };
  if (!name) return res.status(400).json({ error: 'Nombre requerido' });
  const [result] = await RestaurantModel.createCustomerType(name, color);
  res.status(201).json({ id: result.insertId });
};

export const updateCustomerType = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const [result] = await RestaurantModel.updateCustomerType(id, req.body);
  if (!result.affectedRows) return res.status(404).json({ error: 'Tipo de cliente no encontrado' });
  res.json({ ok: true });
};

export const deleteCustomerType = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const [result] = await RestaurantModel.deleteCustomerType(id);
  if (!result.affectedRows) return res.status(404).json({ error: 'Tipo de cliente no encontrado' });
  res.json({ ok: true });
};

// ── Tables ────────────────────────────────────────────────────────────────────

export const getTables = async (_req: Request, res: Response) => {
  const [rows] = await RestaurantModel.getTables();
  res.json(rows);
};

export const createTable = async (req: Request, res: Response) => {
  const { name, capacity } = req.body as { name?: string; capacity?: number };
  if (!name) return res.status(400).json({ error: 'Nombre requerido' });
  const [result] = await RestaurantModel.createTable(name, capacity);
  res.status(201).json({ id: result.insertId });
};

export const updateTable = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const [result] = await RestaurantModel.updateTable(id, req.body);
  if (!result.affectedRows) return res.status(404).json({ error: 'Mesa no encontrada' });
  res.json({ ok: true });
};

export const deleteTable = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const [result] = await RestaurantModel.deleteTable(id);
  if (!result.affectedRows) return res.status(404).json({ error: 'Mesa no encontrada' });
  res.json({ ok: true });
};

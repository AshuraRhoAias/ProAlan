import type { Request, Response } from 'express';
import { MenuModel } from '../models/MenuItem.js';

// ── Categories ────────────────────────────────────────────────────────────────

export const getCategories = async (_req: Request, res: Response) => {
  const [rows] = await MenuModel.getAllCategories();
  res.json(rows);
};

export const createCategory = async (req: Request, res: Response) => {
  const { name, sort_order } = req.body as { name?: string; sort_order?: number };
  if (!name) return res.status(400).json({ error: 'Nombre requerido' });
  const [result] = await MenuModel.createCategory(name, sort_order);
  res.status(201).json({ id: result.insertId });
};

export const updateCategory = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const [result] = await MenuModel.updateCategory(id, req.body);
  if (!result.affectedRows) return res.status(404).json({ error: 'Categoría no encontrada' });
  res.json({ ok: true });
};

export const deleteCategory = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const [result] = await MenuModel.deleteCategory(id);
  if (!result.affectedRows) return res.status(404).json({ error: 'Categoría no encontrada' });
  res.json({ ok: true });
};

// ── Items ─────────────────────────────────────────────────────────────────────

export const getItems = async (req: Request, res: Response) => {
  const onlyAvailable = req.query.available === '1';
  const [rows] = await MenuModel.getAll(onlyAvailable);
  res.json(rows);
};

export const getItem = async (req: Request, res: Response) => {
  const [rows] = await MenuModel.getById(Number(req.params.id));
  if (!rows.length) return res.status(404).json({ error: 'Item no encontrado' });
  res.json(rows[0]);
};

export const createItem = async (req: Request, res: Response) => {
  const { category_id, name, description, price, allergens } = req.body as {
    category_id?: number; name?: string; description?: string; price?: number; allergens?: string[];
  };
  if (!category_id || !name || price === undefined) {
    return res.status(400).json({ error: 'category_id, name y price son requeridos' });
  }
  const result = await MenuModel.create({ category_id, name, description, price, allergens });
  res.status(201).json({ id: result.insertId });
};

export const updateItem = async (req: Request, res: Response) => {
  await MenuModel.update(Number(req.params.id), req.body);
  res.json({ ok: true });
};

export const deleteItem = async (req: Request, res: Response) => {
  const [result] = await MenuModel.delete(Number(req.params.id));
  if (!result.affectedRows) return res.status(404).json({ error: 'Item no encontrado' });
  res.json({ ok: true });
};

export const getCategoryModifiers = async (req: Request, res: Response) => {
  const [rows] = await MenuModel.getCategoryModifiers(Number(req.params.categoryId));
  res.json(rows);
};

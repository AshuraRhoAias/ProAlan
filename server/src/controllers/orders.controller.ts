import type { Request, Response } from 'express';
import { OrderModel } from '../models/Order.js';

export const getOrders = async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const hours = Number(req.query.hours ?? 24);
  const [rows] = await OrderModel.getAll(status, hours);
  res.json(rows);
};

export const getOrder = async (req: Request, res: Response) => {
  const [rows] = await OrderModel.getById(Number(req.params.id));
  if (!rows.length) return res.status(404).json({ error: 'Orden no encontrada' });
  const order = rows[0];
  const [items] = await OrderModel.getItems(order.id);
  res.json({ ...order, items });
};

export const createOrder = async (req: Request, res: Response) => {
  const { table_id, customer_type_id, shift_id, notes, items } = req.body as {
    table_id?: number; customer_type_id?: number; shift_id?: number;
    notes?: string; items?: unknown[];
  };
  if (!table_id || !customer_type_id || !items?.length) {
    return res.status(400).json({ error: 'table_id, customer_type_id e items son requeridos' });
  }
  const result = await OrderModel.create({ table_id, customer_type_id, shift_id, notes, items: items as never });
  res.status(201).json(result);
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  const { status } = req.body as { status?: string };
  if (!status) return res.status(400).json({ error: 'status requerido' });
  await OrderModel.updateStatus(Number(req.params.id), status);
  res.json({ ok: true });
};

export const cancelOrder = async (req: Request, res: Response) => {
  const { cancelled_value } = req.body as { cancelled_value?: number };
  await OrderModel.cancel(Number(req.params.id), cancelled_value ?? 0);
  res.json({ ok: true });
};

export const searchOrders = async (req: Request, res: Response) => {
  const q = req.query.q as string | undefined;
  if (!q) return res.status(400).json({ error: 'q requerido' });
  const [rows] = await OrderModel.search(q);
  res.json(rows);
};

import type { Request, Response } from 'express';
import { OrderModel } from '../models/Order.js';
import { emit } from '../services/events.js';

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

  // Notificar a kitchen y dashboard
  const [rows] = await OrderModel.getById(result.orderId);
  if (rows[0]) emit('order_new', rows[0]);

  res.status(201).json(result);
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  const { status } = req.body as { status?: string };
  if (!status) return res.status(400).json({ error: 'status requerido' });
  const id = Number(req.params.id);
  await OrderModel.updateStatus(id, status);

  const [rows] = await OrderModel.getById(id);
  if (rows[0]) emit('order_status', rows[0]);

  res.json({ ok: true });
};

export const cancelOrder = async (req: Request, res: Response) => {
  const { cancelled_value } = req.body as { cancelled_value?: number };
  const id = Number(req.params.id);
  await OrderModel.cancel(id, cancelled_value ?? 0);
  emit('order_status', { id, status: 'cancelled' });
  res.json({ ok: true });
};

export const searchOrders = async (req: Request, res: Response) => {
  const q = req.query.q as string | undefined;
  if (!q) return res.status(400).json({ error: 'q requerido' });
  const [rows] = await OrderModel.search(q);
  res.json(rows);
};

export const addItems = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { items } = req.body as { items?: unknown[] };
  if (!items?.length) return res.status(400).json({ error: 'items requerido' });
  await OrderModel.addItems(id, items as never);
  const [rows] = await OrderModel.getById(id);
  if (rows[0]) emit('order_status', rows[0]);
  res.json({ ok: true });
};

export const closeWithTip = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { tip = 0, payment_method = 'cash' } = req.body as { tip?: number; payment_method?: string };
  await OrderModel.closeWithTip(id, tip, payment_method);
  const [rows] = await OrderModel.getById(id);
  if (rows[0]) emit('order_status', rows[0]);
  res.json({ ok: true });
};

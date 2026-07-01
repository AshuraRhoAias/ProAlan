import type { Request, Response } from 'express';
import { ShiftModel } from '../models/Shift.js';

export const getShifts = async (_req: Request, res: Response) => {
  try {
    const [rows] = await ShiftModel.getAll();
    res.json(rows);
  } catch {
    res.json([]);
  }
};

export const getCurrentShift = async (_req: Request, res: Response) => {
  try {
    const [rows] = await ShiftModel.getCurrent();
    res.json(rows[0] ?? null);
  } catch {
    res.json(null);
  }
};

export const getShift = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const [[rows], [stats], [topItems]] = await Promise.all([
      ShiftModel.getById(id),
      ShiftModel.getStats(id),
      ShiftModel.getTopItems(id),
    ]);
    if (!rows.length) return res.status(404).json({ error: 'Turno no encontrado' });
    res.json({ ...rows[0], stats: stats[0] ?? null, topItems });
  } catch {
    res.status(500).json({ error: 'Error al obtener turno' });
  }
};

export const openShift = async (req: Request, res: Response) => {
  try {
    const { name, start_hour, end_hour } = req.body as {
      name?: string; start_hour?: number; end_hour?: number;
    };
    if (!name || start_hour === undefined || end_hour === undefined) {
      return res.status(400).json({ error: 'name, start_hour y end_hour son requeridos' });
    }
    const [existing] = await ShiftModel.getCurrent();
    if (existing.length) return res.status(409).json({ error: 'Ya hay un turno abierto' });

    const [result] = await ShiftModel.open({ name, start_hour, end_hour });
    res.status(201).json({ id: result.insertId });
  } catch {
    res.status(500).json({ error: 'Error al abrir turno' });
  }
};

export const closeShift = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const [result] = await ShiftModel.close(id);
    if (!result.affectedRows) return res.status(404).json({ error: 'Turno no encontrado' });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Error al cerrar turno' });
  }
};

import db from '../config/database.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface ShiftRow extends RowDataPacket {
  id: number; name: string; start_hour: number; end_hour: number;
  date: string; opened_at: Date; closed_at: Date; status: string;
}

export interface ShiftStatsRow extends RowDataPacket {
  total_revenue: number; orders_closed: number; tables_served: number;
  cancelled_value: number; avg_wait_seconds: number; avg_cook_seconds: number;
}

export const ShiftModel = {
  getAll: () =>
    db.query<ShiftRow[]>('SELECT * FROM shifts ORDER BY opened_at DESC LIMIT 50'),

  getById: (id: number) =>
    db.query<ShiftRow[]>('SELECT * FROM shifts WHERE id = ?', [id]),

  getCurrent: () =>
    db.query<ShiftRow[]>("SELECT * FROM shifts WHERE status = 'open' ORDER BY opened_at DESC LIMIT 1"),

  open: (data: { name: string; start_hour: number; end_hour: number }) =>
    db.query<ResultSetHeader>(
      'INSERT INTO shifts (name, start_hour, end_hour, date) VALUES (?, ?, ?, CURDATE())',
      [data.name, data.start_hour, data.end_hour]
    ),

  close: (id: number) =>
    db.query<ResultSetHeader>(
      "UPDATE shifts SET status = 'closed', closed_at = NOW() WHERE id = ?",
      [id]
    ),

  getStats: (id: number) =>
    db.query<ShiftStatsRow[]>(`
      SELECT
        SUM(CASE WHEN o.status = 'closed' THEN o.total ELSE 0 END)         AS total_revenue,
        COUNT(CASE WHEN o.status = 'closed' THEN 1 END)                     AS orders_closed,
        COUNT(DISTINCT CASE WHEN o.status = 'closed' THEN o.table_id END)   AS tables_served,
        SUM(o.cancelled_value)                                               AS cancelled_value,
        AVG(CASE WHEN o.started_at IS NOT NULL
             THEN TIMESTAMPDIFF(SECOND, o.created_at, o.started_at) END)    AS avg_wait_seconds,
        AVG(CASE WHEN o.ready_at IS NOT NULL AND o.started_at IS NOT NULL
             THEN TIMESTAMPDIFF(SECOND, o.started_at, o.ready_at) END)      AS avg_cook_seconds
      FROM orders o
      WHERE o.shift_id = ?
    `, [id]),

  getTopItems: (id: number) =>
    db.query<RowDataPacket[]>(`
      SELECT mi.name, mc.name AS category, SUM(oi.quantity) AS qty,
             SUM(oi.quantity * oi.unit_price) AS revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN menu_items mi ON mi.id = oi.menu_item_id
      JOIN menu_categories mc ON mc.id = mi.category_id
      WHERE o.shift_id = ? AND o.status = 'closed'
      GROUP BY oi.menu_item_id
      ORDER BY qty DESC
      LIMIT 10
    `, [id]),
};

import db from '../config/database.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface OrderRow extends RowDataPacket {
  id: number; code: string; table_id: number; table_name: string;
  customer_type_id: number; customer_type_name: string;
  shift_id: number; status: string;
  payment_method: string; notes: string;
  total: number; tip: number; cancelled_value: number;
  created_at: Date; started_at: Date; ready_at: Date; closed_at: Date;
}

export interface OrderItemRow extends RowDataPacket {
  id: number; order_id: number; menu_item_id: number;
  menu_item_name: string; quantity: number; unit_price: number;
  notes: string; status: string;
  modifiers: string; // JSON via GROUP_CONCAT
}

export const OrderModel = {
  getAll: (status?: string, hours = 24) =>
    db.query<OrderRow[]>(`
      SELECT o.*, t.name AS table_name, ct.name AS customer_type_name
      FROM orders o
      JOIN tables_restaurant t ON t.id = o.table_id
      JOIN customer_types ct ON ct.id = o.customer_type_id
      WHERE o.created_at >= NOW() - INTERVAL ? HOUR
      ${status ? 'AND o.status = ?' : ''}
      ORDER BY o.created_at DESC
    `, status ? [hours, status] : [hours]),

  getById: (id: number) =>
    db.query<OrderRow[]>(`
      SELECT o.*, t.name AS table_name, ct.name AS customer_type_name
      FROM orders o
      JOIN tables_restaurant t ON t.id = o.table_id
      JOIN customer_types ct ON ct.id = o.customer_type_id
      WHERE o.id = ?
    `, [id]),

  getItems: (orderId: number) =>
    db.query<OrderItemRow[]>(`
      SELECT oi.*, mi.name AS menu_item_name,
             GROUP_CONCAT(
               JSON_OBJECT('name', oim.name, 'type', oim.type)
               ORDER BY oim.id SEPARATOR '||'
             ) AS modifiers
      FROM order_items oi
      JOIN menu_items mi ON mi.id = oi.menu_item_id
      LEFT JOIN order_item_modifiers oim ON oim.order_item_id = oi.id
      WHERE oi.order_id = ?
      GROUP BY oi.id
    `, [orderId]),

  create: async (data: {
    table_id: number; customer_type_id: number; shift_id?: number; notes?: string;
    items: Array<{
      menu_item_id: number; quantity: number; unit_price: number; notes?: string;
      modifiers?: Array<{ name: string; type: 'included' | 'removed' | 'extra' }>;
    }>;
  }) => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const total = data.items.reduce((s, i) => s + i.quantity * i.unit_price, 0);

    const [orderResult] = await db.query<ResultSetHeader>(
      'INSERT INTO orders (code, table_id, customer_type_id, shift_id, notes, total) VALUES (?, ?, ?, ?, ?, ?)',
      [code, data.table_id, data.customer_type_id, data.shift_id ?? null, data.notes ?? '', total]
    );
    const orderId = orderResult.insertId;

    for (const item of data.items) {
      const [itemResult] = await db.query<ResultSetHeader>(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, notes) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.menu_item_id, item.quantity, item.unit_price, item.notes ?? '']
      );
      if (item.modifiers?.length) {
        const vals = item.modifiers.map(m => [itemResult.insertId, m.name, m.type]);
        await db.query('INSERT INTO order_item_modifiers (order_item_id, name, type) VALUES ?', [vals]);
      }
    }

    // Marcar mesa como ocupada
    await db.query('UPDATE tables_restaurant SET status = ? WHERE id = ?', ['occupied', data.table_id]);

    return { orderId, code };
  },

  updateStatus: async (id: number, status: string) => {
    const timeField: Record<string, string> = {
      cooking: 'started_at', ready: 'ready_at', closed: 'closed_at', cancelled: 'closed_at',
    };
    const tf = timeField[status];
    const sql = tf
      ? `UPDATE orders SET status = ?, ${tf} = NOW() WHERE id = ?`
      : 'UPDATE orders SET status = ? WHERE id = ?';
    await db.query<ResultSetHeader>(sql, [status, id]);

    if (status === 'closed' || status === 'cancelled') {
      const [rows] = await db.query<OrderRow[]>('SELECT table_id FROM orders WHERE id = ?', [id]);
      if (rows[0]) {
        await db.query('UPDATE tables_restaurant SET status = ? WHERE id = ?', ['available', rows[0].table_id]);
      }
    }
  },

  cancel: async (id: number, cancelledValue: number) => {
    const [rows] = await db.query<OrderRow[]>('SELECT table_id FROM orders WHERE id = ?', [id]);
    await db.query<ResultSetHeader>(
      'UPDATE orders SET status = "cancelled", cancelled_value = ?, closed_at = NOW() WHERE id = ?',
      [cancelledValue, id]
    );
    if (rows[0]) {
      await db.query('UPDATE tables_restaurant SET status = ? WHERE id = ?', ['available', rows[0].table_id]);
    }
  },

  search: (q: string) =>
    db.query<OrderRow[]>(`
      SELECT o.*, t.name AS table_name, ct.name AS customer_type_name
      FROM orders o
      JOIN tables_restaurant t ON t.id = o.table_id
      JOIN customer_types ct ON ct.id = o.customer_type_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
      WHERE o.created_at >= NOW() - INTERVAL 24 HOUR
        AND (o.code LIKE ? OR t.name LIKE ? OR mi.name LIKE ?)
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 50
    `, [`%${q}%`, `%${q}%`, `%${q}%`]),

  addItems: async (
    orderId: number,
    items: Array<{
      menu_item_id: number; quantity: number; unit_price: number; notes?: string;
      modifiers?: Array<{ name: string; type: 'included' | 'removed' | 'extra' }>;
    }>
  ) => {
    const addedTotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
    for (const item of items) {
      const [r] = await db.query<ResultSetHeader>(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, notes) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.menu_item_id, item.quantity, item.unit_price, item.notes ?? '']
      );
      if (item.modifiers?.length) {
        const vals = item.modifiers.map(m => [r.insertId, m.name, m.type]);
        await db.query('INSERT INTO order_item_modifiers (order_item_id, name, type) VALUES ?', [vals]);
      }
    }
    await db.query(
      'UPDATE orders SET total = total + ?, status = "waiting", started_at = NULL WHERE id = ? AND status != "closed" AND status != "cancelled"',
      [addedTotal, orderId]
    );
  },

  closeWithTip: async (id: number, tip: number, paymentMethod: string) => {
    await db.query<ResultSetHeader>(
      `UPDATE orders SET status = 'closed', closed_at = NOW(),
       tip = ?, payment_method = ?
       WHERE id = ?`,
      [tip, paymentMethod, id]
    );
    const [rows] = await db.query<OrderRow[]>('SELECT table_id FROM orders WHERE id = ?', [id]);
    if (rows[0]) {
      await db.query('UPDATE tables_restaurant SET status = ? WHERE id = ?', ['available', rows[0].table_id]);
    }
  },

  cancelItem: async (orderId: number, itemId: number) => {
    const [items] = await db.query<OrderItemRow[]>(
      'SELECT quantity, unit_price FROM order_items WHERE id = ? AND order_id = ? AND status = "pending"',
      [itemId, orderId]
    );
    if (!items.length) return;
    const refund = items[0].quantity * items[0].unit_price;
    await db.query('UPDATE order_items SET status = "cancelled" WHERE id = ?', [itemId]);
    await db.query('UPDATE orders SET total = GREATEST(0, total - ?) WHERE id = ?', [refund, orderId]);
  },
};

import db from '../config/database.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface RestaurantRow extends RowDataPacket {
  id: number; name: string; currency_symbol: string;
  tax_rate: number; num_tables: number; use_system_time: number;
}

export interface CustomerTypeRow extends RowDataPacket {
  id: number; name: string; color: string; sort_order: number; active: number;
}

export interface TableRow extends RowDataPacket {
  id: number; name: string; capacity: number; status: string;
}

export const RestaurantModel = {
  get: () =>
    db.query<RestaurantRow[]>('SELECT * FROM restaurant LIMIT 1'),

  update: (data: Partial<{ name: string; currency_symbol: string; tax_rate: number; num_tables: number; use_system_time: number }>) => {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
    return db.query<ResultSetHeader>(`UPDATE restaurant SET ${fields} LIMIT 1`, Object.values(data));
  },

  // Customer types
  getCustomerTypes: () =>
    db.query<CustomerTypeRow[]>('SELECT * FROM customer_types WHERE active = 1 ORDER BY sort_order'),

  createCustomerType: (name: string, color = '#6b7280') =>
    db.query<ResultSetHeader>('INSERT INTO customer_types (name, color) VALUES (?, ?)', [name, color]),

  updateCustomerType: (id: number, data: Partial<{ name: string; color: string; sort_order: number; active: number }>) => {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
    return db.query<ResultSetHeader>(`UPDATE customer_types SET ${fields} WHERE id = ?`, [...Object.values(data), id]);
  },

  deleteCustomerType: (id: number) =>
    db.query<ResultSetHeader>('DELETE FROM customer_types WHERE id = ?', [id]),

  // Tables
  getTables: () =>
    db.query<TableRow[]>('SELECT * FROM tables_restaurant ORDER BY id'),

  createTable: (name: string, capacity = 4) =>
    db.query<ResultSetHeader>('INSERT INTO tables_restaurant (name, capacity) VALUES (?, ?)', [name, capacity]),

  updateTable: (id: number, data: Partial<{ name: string; capacity: number; status: string }>) => {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
    return db.query<ResultSetHeader>(`UPDATE tables_restaurant SET ${fields} WHERE id = ?`, [...Object.values(data), id]);
  },

  deleteTable: (id: number) =>
    db.query<ResultSetHeader>('DELETE FROM tables_restaurant WHERE id = ?', [id]),
};

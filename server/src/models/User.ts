import db from '../config/database.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface UserRow extends RowDataPacket {
  id: number; name: string; role: string; pin: string; active: number;
  created_at: Date; updated_at: Date;
}

export const UserModel = {
  findAll: () =>
    db.query<UserRow[]>('SELECT id, name, role, active, created_at FROM users ORDER BY id'),

  findById: (id: number) =>
    db.query<UserRow[]>('SELECT * FROM users WHERE id = ?', [id]),

  findByPin: (pin: string) =>
    db.query<UserRow[]>('SELECT * FROM users WHERE pin = ? AND active = 1 LIMIT 1', [pin]),

  create: (data: { name: string; role: string; pin: string }) =>
    db.query<ResultSetHeader>(
      'INSERT INTO users (name, role, pin) VALUES (?, ?, ?)',
      [data.name, data.role, data.pin]
    ),

  update: (id: number, data: Partial<{ name: string; role: string; pin: string; active: number }>) => {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
    return db.query<ResultSetHeader>(`UPDATE users SET ${fields} WHERE id = ?`, [...Object.values(data), id]);
  },

  delete: (id: number) =>
    db.query<ResultSetHeader>('DELETE FROM users WHERE id = ?', [id]),
};

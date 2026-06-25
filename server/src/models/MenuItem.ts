import db from '../config/database.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface MenuItemRow extends RowDataPacket {
  id: number; category_id: number; category_name: string;
  name: string; description: string; price: number;
  available: number; photo_url: string;
  allergens: string; // JSON array as string from GROUP_CONCAT
}

export interface CategoryRow extends RowDataPacket {
  id: number; name: string; sort_order: number; active: number;
}

export const MenuModel = {
  // ── Categorías ──────────────────────────────────────────────
  getAllCategories: () =>
    db.query<CategoryRow[]>('SELECT * FROM menu_categories ORDER BY sort_order'),

  createCategory: (name: string, sort_order = 0) =>
    db.query<ResultSetHeader>('INSERT INTO menu_categories (name, sort_order) VALUES (?, ?)', [name, sort_order]),

  updateCategory: (id: number, data: Partial<{ name: string; sort_order: number; active: number }>) => {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
    return db.query<ResultSetHeader>(`UPDATE menu_categories SET ${fields} WHERE id = ?`, [...Object.values(data), id]);
  },

  deleteCategory: (id: number) =>
    db.query<ResultSetHeader>('DELETE FROM menu_categories WHERE id = ?', [id]),

  // ── Items ────────────────────────────────────────────────────
  getAll: (onlyAvailable = false) =>
    db.query<MenuItemRow[]>(`
      SELECT mi.*, mc.name AS category_name,
             GROUP_CONCAT(mia.name ORDER BY mia.id SEPARATOR '||') AS allergens
      FROM menu_items mi
      JOIN menu_categories mc ON mc.id = mi.category_id
      LEFT JOIN menu_item_allergens mia ON mia.menu_item_id = mi.id
      ${onlyAvailable ? 'WHERE mi.available = 1' : ''}
      GROUP BY mi.id
      ORDER BY mc.sort_order, mi.name
    `),

  getById: (id: number) =>
    db.query<MenuItemRow[]>(`
      SELECT mi.*, mc.name AS category_name,
             GROUP_CONCAT(mia.name ORDER BY mia.id SEPARATOR '||') AS allergens
      FROM menu_items mi
      JOIN menu_categories mc ON mc.id = mi.category_id
      LEFT JOIN menu_item_allergens mia ON mia.menu_item_id = mi.id
      WHERE mi.id = ?
      GROUP BY mi.id
    `, [id]),

  create: async (data: { category_id: number; name: string; description?: string; price: number; allergens?: string[] }) => {
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO menu_items (category_id, name, description, price) VALUES (?, ?, ?, ?)',
      [data.category_id, data.name, data.description ?? '', data.price]
    );
    if (data.allergens?.length) {
      const vals = data.allergens.map(a => [result.insertId, a]);
      await db.query('INSERT INTO menu_item_allergens (menu_item_id, name) VALUES ?', [vals]);
    }
    return result;
  },

  update: async (id: number, data: { category_id?: number; name?: string; description?: string; price?: number; available?: number; allergens?: string[] }) => {
    const { allergens, ...rest } = data;
    if (Object.keys(rest).length) {
      const fields = Object.keys(rest).map(k => `${k} = ?`).join(', ');
      await db.query<ResultSetHeader>(`UPDATE menu_items SET ${fields} WHERE id = ?`, [...Object.values(rest), id]);
    }
    if (allergens !== undefined) {
      await db.query('DELETE FROM menu_item_allergens WHERE menu_item_id = ?', [id]);
      if (allergens.length) {
        const vals = allergens.map(a => [id, a]);
        await db.query('INSERT INTO menu_item_allergens (menu_item_id, name) VALUES ?', [vals]);
      }
    }
  },

  delete: (id: number) =>
    db.query<ResultSetHeader>('DELETE FROM menu_items WHERE id = ?', [id]),

  // ── Modificadores por categoría ──────────────────────────────
  getCategoryModifiers: (categoryId: number) =>
    db.query<RowDataPacket[]>('SELECT * FROM category_modifiers WHERE category_id = ? ORDER BY sort_order', [categoryId]),
};

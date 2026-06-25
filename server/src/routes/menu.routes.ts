import { Router } from 'express';
import {
  getCategories, createCategory, updateCategory, deleteCategory,
  getItems, getItem, createItem, updateItem, deleteItem,
  getCategoryModifiers,
} from '../controllers/menu.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

// Categories
router.get('/categories', getCategories);
router.post('/categories', requireRole('manager', 'admin'), createCategory);
router.put('/categories/:id', requireRole('manager', 'admin'), updateCategory);
router.delete('/categories/:id', requireRole('manager', 'admin'), deleteCategory);
router.get('/categories/:categoryId/modifiers', getCategoryModifiers);

// Items
router.get('/', getItems);
router.get('/:id', getItem);
router.post('/', requireRole('manager', 'admin'), createItem);
router.put('/:id', requireRole('manager', 'admin'), updateItem);
router.delete('/:id', requireRole('manager', 'admin'), deleteItem);

export default router;

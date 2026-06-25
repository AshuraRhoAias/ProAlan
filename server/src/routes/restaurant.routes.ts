import { Router } from 'express';
import {
  getRestaurant, updateRestaurant,
  getCustomerTypes, createCustomerType, updateCustomerType, deleteCustomerType,
  getTables, createTable, updateTable, deleteTable,
} from '../controllers/restaurant.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getRestaurant);
router.put('/', requireRole('manager', 'admin'), updateRestaurant);

// Customer types
router.get('/customer-types', getCustomerTypes);
router.post('/customer-types', requireRole('manager', 'admin'), createCustomerType);
router.put('/customer-types/:id', requireRole('manager', 'admin'), updateCustomerType);
router.delete('/customer-types/:id', requireRole('manager', 'admin'), deleteCustomerType);

// Tables
router.get('/tables', getTables);
router.post('/tables', requireRole('manager', 'admin'), createTable);
router.put('/tables/:id', requireRole('manager', 'admin'), updateTable);
router.delete('/tables/:id', requireRole('manager', 'admin'), deleteTable);

export default router;

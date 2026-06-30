import { Router } from 'express';
import {
  getOrders, getOrder, createOrder, updateOrderStatus,
  cancelOrder, searchOrders, addItems, closeWithTip,
} from '../controllers/orders.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/search', searchOrders);
router.get('/', getOrders);
router.get('/:id', getOrder);
router.post('/', createOrder);
router.patch('/:id/status', updateOrderStatus);
router.patch('/:id/cancel', cancelOrder);
router.post('/:id/items', addItems);
router.patch('/:id/close', closeWithTip);

export default router;

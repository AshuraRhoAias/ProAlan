import { Router } from 'express';
import {
  getShifts, getCurrentShift, getShift, openShift, closeShift,
} from '../controllers/shifts.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getShifts);
router.get('/current', getCurrentShift);
router.get('/:id', getShift);
router.post('/', requireRole('manager', 'admin'), openShift);
router.patch('/:id/close', requireRole('manager', 'admin'), closeShift);

export default router;

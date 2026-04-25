import { Router } from 'express';
import {
  acceptOrderController,
  completeOrderController,
  createOrderController,
  deleteOrderController,
  getOrderByIdController,
  getOrdersController,
  updatePositionController,
} from './order.controller';
import { authMiddleware, checkRole } from '../../middlewares/authMiddleware';

export const router = Router();

router.use(authMiddleware);

router.get('/', getOrdersController);
router.get('/:id', getOrderByIdController);
router.post('/', checkRole(['consumer']), createOrderController);
router.patch('/:id/accept', checkRole(['delivery']), acceptOrderController);
router.patch('/:id/deliver', checkRole(['delivery']), completeOrderController);
router.patch('/:id/position', checkRole(['delivery']), updatePositionController);
router.delete('/:id', checkRole(['consumer']), deleteOrderController);

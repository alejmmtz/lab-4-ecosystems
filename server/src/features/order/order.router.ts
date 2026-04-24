import { Router } from 'express';
import {
  createOrderController,
  deleteOrderController,
  getOrderByIdController,
  getOrdersController,
  acceptOrderController,
  updatePositionController,
} from './order.controller';
import { authMiddleware, checkRole } from '../../middlewares/authMiddleware';

export const router = Router();

router.use(authMiddleware);

router.get('/', getOrdersController);
router.get('/:id', getOrderByIdController);

router.post('/', checkRole(['consumer']), createOrderController);

router.post('/:id/accept', checkRole(['delivery']), acceptOrderController);

router.patch(
  '/:id',
  checkRole(['store', 'delivery']),
  updatePositionController
);

router.delete('/:id', checkRole(['consumer']), deleteOrderController);

import { Router } from 'express';
import {
  createStoreController,
  deleteStoreController,
  getStoreByIdController,
  getStoresController,
  updateStoreController,
} from './store.controller';
import { authMiddleware, checkRole } from '../../middlewares/authMiddleware';

export const router = Router();

router.use(authMiddleware);

router.get('/', getStoresController);
router.get('/:id', getStoreByIdController);

router.post('/', checkRole(['store']), createStoreController);
router.patch('/:id', checkRole(['store']), updateStoreController);
router.delete('/:id', checkRole(['store']), deleteStoreController);

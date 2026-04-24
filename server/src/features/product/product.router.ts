import { Router } from 'express';
import {
  createProductController,
  deleteProductController,
  getProductByIdController,
  getProductsController,
  updateProductController,
} from './product.controller';
import { authMiddleware, checkRole } from '../../middlewares/authMiddleware';

export const router = Router();

router.use(authMiddleware);

router.get('/', getProductsController);
router.get('/:id', getProductByIdController);

router.post('/', checkRole(['store']), createProductController);
router.patch('/:id', checkRole(['store']), updateProductController);
router.delete('/:id', checkRole(['store']), deleteProductController);

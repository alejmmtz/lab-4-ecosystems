import { Request, Response } from 'express';
import Boom from '@hapi/boom';
import {
  createProductService,
  deleteProductService,
  getProductByIdService,
  getProductsService,
  updateProductService,
} from './product.service';
import { getUserFromRequest } from '../../middlewares/authMiddleware';
import { getStoreByOwnerIdService } from '../store/store.service';

export const getProductsController = async (req: Request, res: Response) => {
  const { storeId } = req.query;
  const products = await getProductsService(
    storeId ? Number(storeId) : undefined
  );
  return res.json(products);
};

export const getProductByIdController = async (req: Request, res: Response) => {
  const product = await getProductByIdService(Number(req.params.id));
  return res.json(product);
};

export const createProductController = async (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  const { name, price, description } = req.body;

  if (!name) throw Boom.badRequest('Name is required');
  if (price === undefined) throw Boom.badRequest('Price is required');
  if (!description) throw Boom.badRequest('Description is required');

  const store = await getStoreByOwnerIdService(user.id);

  const newProduct = await createProductService({
    name,
    price,
    description,
    storeId: store.id,
  });
  return res.status(201).json(newProduct);
};

export const updateProductController = async (req: Request, res: Response) => {
  const { price, description, name } = req.body;
  const updated = await updateProductService(
    { name, price, description },
    Number(req.params.id)
  );
  return res.json(updated);
};

export const deleteProductController = async (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  const store = await getStoreByOwnerIdService(user.id);
  await deleteProductService(Number(req.params.id), store.id); // number, no string
  return res.json({ message: 'Product deleted' });
};

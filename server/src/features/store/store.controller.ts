import { Request, Response } from 'express';
import Boom from '@hapi/boom';
import {
  createStoreService,
  deleteStoreService,
  getStoreByIdService,
  getStoresService,
  updateStoreService,
} from './store.service';
import { getUserFromRequest } from '../../middlewares/authMiddleware';

export const getStoresController = async (_req: Request, res: Response) => {
  const stores = await getStoresService();
  return res.json(stores);
};

export const getStoreByIdController = async (req: Request, res: Response) => {
  const store = await getStoreByIdService(Number(req.params.id));
  return res.json(store);
};

export const createStoreController = async (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  const { name, address } = req.body;

  if (!name) throw Boom.badRequest('El nombre de la tienda es obligatorio');

  const newStore = await createStoreService({ name, address }, user.id);
  return res.status(201).json(newStore);
};

export const updateStoreController = async (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  const updated = await updateStoreService(
    Number(req.params.id),
    user.id,
    req.body
  );
  return res.json(updated);
};

export const deleteStoreController = async (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  await deleteStoreService(Number(req.params.id), user.id);
  return res.json({ message: 'Tienda eliminada exitosamente' });
};

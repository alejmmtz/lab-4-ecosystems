import { Request, Response } from 'express';
import Boom from '@hapi/boom';
import {
  createOrderService,
  deleteOrderService,
  getOrderByIdService,
  getOrdersService,
  acceptOrderService,
  updateDeliveryPositionService,
} from './order.service';
import { getUserFromRequest } from '../../middlewares/authMiddleware';
import { supabaseAdmin } from '../../config/supabase';

export const getOrdersController = async (req: Request, res: Response) => {
  const user = getUserFromRequest(req);

  if (!user || !user.role) {
    throw Boom.unauthorized('Usuario no encontrado en la sesión');
  }

  const orders = await getOrdersService(user.id, user.role);
  return res.json(orders);
};

export const getOrderByIdController = async (req: Request, res: Response) => {
  const order = await getOrderByIdService(Number(req.params.id));
  return res.json(order);
};

export const createOrderController = async (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  const { storeId, destination, items } = req.body;

  if (!storeId) throw Boom.badRequest('storeId is required');
  if (!destination?.lat || !destination?.lng)
    throw Boom.badRequest('destination coordinates are required');
  if (!items?.length) throw Boom.badRequest('At least one item is required');

  const newOrder = await createOrderService(
    { storeId, destination, items },
    user.id
  );
  return res.status(201).json(newOrder);
};

export const acceptOrderController = async (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  const orderId = Number(req.params.id);

  const order = await acceptOrderService(orderId, user.id);

  await supabaseAdmin.channel(`order:${orderId}`).send({
    type: 'broadcast',
    event: 'order-accepted',
    payload: { deliveryId: user.id },
  });

  return res.json(order);
};

export const updatePositionController = async (req: Request, res: Response) => {
  const orderId = Number(req.params.id);
  const { lat, lng } = req.body;

  if (lat === undefined || lng === undefined) {
    throw Boom.badRequest('lat and lng are required');
  }

  const { order, arrived } = await updateDeliveryPositionService(orderId, {
    lat,
    lng,
  });

  await supabaseAdmin.channel(`order:${orderId}`).send({
    type: 'broadcast',
    event: arrived ? 'delivery-arrived' : 'position-update',
    payload: { lat, lng },
  });

  return res.json({ order, arrived });
};

export const deleteOrderController = async (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  await deleteOrderService(Number(req.params.id), user.id);
  return res.json({ message: 'Order deleted' });
};

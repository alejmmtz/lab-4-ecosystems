import { Request, Response } from 'express';
import Boom from '@hapi/boom';
import {
  acceptOrderService,
  completeOrderService,
  createOrderService,
  deleteOrderService,
  getOrderByIdService,
  getOrdersService,
  updateDeliveryPositionService,
} from './order.service';
import { getUserFromRequest } from '../../middlewares/authMiddleware';
import { supabaseAdmin } from '../../config/supabase';
import { UserRole } from '../auth/auth.types';
import {
  CreateOrderDTO,
  OrderBroadcastEvent,
  OrderPositionBroadcastPayload,
  OrderStatus,
  OrderStatusBroadcastPayload,
} from './order.types';

const getUserRole = (req: Request): UserRole => {
  const user = getUserFromRequest(req);
  const rawRole = user.user_metadata?.role;

  if (
    rawRole !== UserRole.CONSUMER &&
    rawRole !== UserRole.STORE &&
    rawRole !== UserRole.DELIVERY
  ) {
    throw Boom.unauthorized('User role is missing from the session');
  }

  return rawRole;
};

const parseOrderId = (value: string | string[]): number => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const orderId = Number(rawValue);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw Boom.badRequest('A valid order id is required');
  }

  return orderId;
};

const broadcastOrderEvent = async <TPayload>(
  orderId: number,
  event: OrderBroadcastEvent,
  payload: TPayload
): Promise<void> => {
  const channel = supabaseAdmin.channel(`order:${orderId}`);

  try {
    await channel.send({
      type: 'broadcast',
      event,
      payload,
    });
  } finally {
    await supabaseAdmin.removeChannel(channel);
  }
};

export const getOrdersController = async (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  const role = getUserRole(req);
  const orders = await getOrdersService(user.id, role);
  return res.json(orders);
};

export const getOrderByIdController = async (req: Request, res: Response) => {
  const order = await getOrderByIdService(parseOrderId(req.params.id));
  return res.json(order);
};

export const createOrderController = async (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  const body = req.body as Partial<CreateOrderDTO>;
  const storeId = Number(body.storeId);
  const destination = body.destination;
  const rawItems = Array.isArray(body.items) ? body.items : [];

  if (!Number.isInteger(storeId) || storeId <= 0) {
    throw Boom.badRequest('storeId is required');
  }

  if (
    destination === undefined ||
    !Number.isFinite(destination.lat) ||
    !Number.isFinite(destination.lng)
  ) {
    throw Boom.badRequest('destination coordinates are required');
  }

  if (rawItems.length === 0) {
    throw Boom.badRequest('At least one item is required');
  }

  const items = rawItems.map((item) => {
    const productId = Number(item.productId);
    const quantity = Number(item.quantity);

    if (!Number.isInteger(productId) || productId <= 0) {
      throw Boom.badRequest('Each item must include a valid productId');
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw Boom.badRequest('Each item must include a valid quantity');
    }

    return {
      productId,
      quantity,
    };
  });

  const newOrder = await createOrderService(
    {
      storeId,
      destination: {
        lat: destination.lat,
        lng: destination.lng,
      },
      items,
    },
    user.id
  );

  return res.status(201).json(newOrder);
};

export const acceptOrderController = async (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  const orderId = parseOrderId(req.params.id);
  const order = await acceptOrderService(orderId, user.id);

  if (order.deliveryPosition) {
    const positionPayload: OrderPositionBroadcastPayload = {
      lat: order.deliveryPosition.lat,
      lng: order.deliveryPosition.lng,
    };

    await broadcastOrderEvent(
      orderId,
      OrderBroadcastEvent.POSITION,
      positionPayload
    );
  }

  const payload: OrderStatusBroadcastPayload = {
    status: OrderStatus.IN_DELIVERY,
    deliveryId: user.id,
  };

  await broadcastOrderEvent(orderId, OrderBroadcastEvent.STATUS, payload);

  return res.json(order);
};

export const updatePositionController = async (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  const orderId = parseOrderId(req.params.id);
  const lat = Number(req.body?.lat);
  const lng = Number(req.body?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw Boom.badRequest('lat and lng are required');
  }

  const { order, arrived, distanceMeters } = await updateDeliveryPositionService(
    orderId,
    user.id,
    {
      lat,
      lng,
    }
  );

  const positionPayload: OrderPositionBroadcastPayload = { lat, lng };
  await broadcastOrderEvent(orderId, OrderBroadcastEvent.POSITION, positionPayload);

  if (arrived) {
    const statusPayload: OrderStatusBroadcastPayload = {
      status: OrderStatus.DELIVERED,
      deliveryId: order.deliveryId,
    };

    await broadcastOrderEvent(orderId, OrderBroadcastEvent.STATUS, statusPayload);
  }

  return res.json({ order, arrived, distanceMeters });
};

export const completeOrderController = async (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  const orderId = parseOrderId(req.params.id);
  const order = await completeOrderService(orderId, user.id);

  const statusPayload: OrderStatusBroadcastPayload = {
    status: OrderStatus.DELIVERED,
    deliveryId: order.deliveryId,
  };

  await broadcastOrderEvent(orderId, OrderBroadcastEvent.STATUS, statusPayload);

  return res.json(order);
};

export const deleteOrderController = async (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  await deleteOrderService(parseOrderId(req.params.id), user.id);
  return res.json({ message: 'Order deleted' });
};

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Order,
  OrderItem,
  OrderStatus,
  CreateOrderDTO,
  UpdatePositionDTO,
} from './order.types';
import Boom from '@hapi/boom';
import { pool } from '../../config/database';

const mapOrderRow = (row: any): Order => ({
  id: row.id,
  status: row.status,
  total: row.total,
  destination: {
    lat: row.destinationLat,
    lng: row.destinationLng,
  },
  deliveryPosition:
    row.deliveryLat != null
      ? { lat: row.deliveryLat, lng: row.deliveryLng }
      : null,
  consumerId: row.consumerId,
  storeId: row.storeId,
  deliveryId: row.deliveryId ?? null,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const SELECT_ORDER = `
  SELECT
    id,
    status,
    total,
    ST_Y(destination::geometry)        AS "destinationLat",
    ST_X(destination::geometry)        AS "destinationLng",
    ST_Y(delivery_position::geometry)  AS "deliveryLat",
    ST_X(delivery_position::geometry)  AS "deliveryLng",
    consumer_id  AS "consumerId",
    store_id     AS "storeId",
    delivery_id  AS "deliveryId",
    created_at   AS "createdAt",
    updated_at   AS "updatedAt"
  FROM orders
`;

const getOrderItems = async (orderId: number): Promise<OrderItem[]> => {
  const { rows } = await pool.query(
    `SELECT id, order_id AS "orderId", product_id AS "productId",
            quantity, unit_price AS "unitPrice"
     FROM order_items WHERE order_id = $1`,
    [orderId]
  );
  return rows;
};

export const getOrdersService = async (
  userId: string,
  role: string
): Promise<Order[]> => {
  let query = SELECT_ORDER;
  const params: any[] = [];

  if (role === 'consumer') {
    query += ' WHERE consumer_id = $1';
    params.push(userId);
  } else if (role === 'store') {
    query +=
      ' WHERE store_id = (SELECT id FROM stores WHERE owner_id = $1 LIMIT 1)';
    params.push(userId);
  } else if (role === 'delivery') {
    // Pedidos asignados al repartidor O pedidos disponibles (aún sin repartidor)
    query += ` WHERE delivery_id = $1 OR (delivery_id IS NULL AND status = $2)`;
    params.push(userId, OrderStatus.CREATED);
  } else {
    return [];
  }

  query += ' ORDER BY created_at DESC';
  const { rows } = await pool.query(query, params);
  return rows.map(mapOrderRow);
};

export const getOrderByIdService = async (orderId: number): Promise<Order> => {
  const { rows, rowCount } = await pool.query(`${SELECT_ORDER} WHERE id = $1`, [
    orderId,
  ]);
  if (rowCount === 0) throw Boom.notFound('Order not found');

  const order = mapOrderRow(rows[0]);
  order.items = await getOrderItems(orderId);
  return order;
};

export const createOrderService = async (
  dto: CreateOrderDTO,
  consumerId: string
): Promise<Order> => {
  let total = 0;
  const itemsToInsert: {
    productId: number;
    quantity: number;
    unitPrice: number;
  }[] = [];

  for (const item of dto.items) {
    const { rows } = await pool.query(
      'SELECT price FROM products WHERE id = $1',
      [item.productId]
    );
    if (rows.length === 0)
      throw Boom.notFound(`Product ${item.productId} not found`);

    const unitPrice = rows[0].price;
    total += unitPrice * item.quantity;
    itemsToInsert.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
    });
  }
  const { rows } = await pool.query(
    `INSERT INTO orders (status, total, destination, consumer_id, store_id)
     VALUES (
       $1,
       $2,
       ST_SetSRID(ST_MakePoint($3, $4), 4326),
       $5,
       $6
     )
     RETURNING
       id, status, total,
       ST_Y(destination::geometry) AS "destinationLat",
       ST_X(destination::geometry) AS "destinationLng",
       NULL::float AS "deliveryLat",
       NULL::float AS "deliveryLng",
       consumer_id AS "consumerId",
       store_id    AS "storeId",
       delivery_id AS "deliveryId",
       created_at  AS "createdAt",
       updated_at  AS "updatedAt"`,
    [
      OrderStatus.CREATED,
      total,
      dto.destination.lng,
      dto.destination.lat,
      consumerId,
      dto.storeId,
    ]
  );

  const order = mapOrderRow(rows[0]);

  const items: OrderItem[] = [];
  for (const item of dto.items) {
    const { rows: productRows } = await pool.query(
      'SELECT price FROM products WHERE id = $1',
      [item.productId]
    );
    const unitPrice = productRows[0].price;
    const { rows: itemRows } = await pool.query(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
       VALUES ($1, $2, $3, $4)
       RETURNING id, order_id AS "orderId", product_id AS "productId",
                 quantity, unit_price AS "unitPrice"`,
      [order.id, item.productId, item.quantity, unitPrice]
    );
    items.push(itemRows[0]);
  }

  order.items = items;
  return order;
};

export const acceptOrderService = async (
  orderId: number,
  deliveryId: string
): Promise<Order> => {
  const order = await getOrderByIdService(orderId);

  if (order.status !== OrderStatus.CREATED) {
    throw Boom.conflict('This order has already been accepted or delivered');
  }
  if (order.deliveryId) {
    throw Boom.conflict('This order already has a delivery person assigned');
  }

  const { rows } = await pool.query(
    `UPDATE orders
     SET status = $1, delivery_id = $2, updated_at = NOW()
     WHERE id = $3
     RETURNING
       id, status, total,
       ST_Y(destination::geometry) AS "destinationLat",
       ST_X(destination::geometry) AS "destinationLng",
       ST_Y(delivery_position::geometry) AS "deliveryLat",
       ST_X(delivery_position::geometry) AS "deliveryLng",
       consumer_id AS "consumerId",
       store_id    AS "storeId",
       delivery_id AS "deliveryId",
       created_at  AS "createdAt",
       updated_at  AS "updatedAt"`,
    [OrderStatus.IN_DELIVERY, deliveryId, orderId]
  );

  return mapOrderRow(rows[0]);
};

export const updateDeliveryPositionService = async (
  orderId: number,
  dto: UpdatePositionDTO
): Promise<{ order: Order; arrived: boolean }> => {
  await pool.query(
    `UPDATE orders
     SET delivery_position = ST_SetSRID(ST_MakePoint($1, $2), 4326),
         updated_at = NOW()
     WHERE id = $3`,
    [dto.lng, dto.lat, orderId]
  );

  const { rows } = await pool.query(
    `SELECT
       ST_DWithin(delivery_position, destination, 5) AS arrived
     FROM orders WHERE id = $1`,
    [orderId]
  );

  const arrived: boolean = rows[0]?.arrived ?? false;

  if (arrived) {
    await pool.query(
      `UPDATE orders
       SET status = $1, updated_at = NOW()
       WHERE id = $2`,
      [OrderStatus.DELIVERED, orderId]
    );
  }

  const updatedOrder = await getOrderByIdService(orderId);
  return { order: updatedOrder, arrived };
};

export const deleteOrderService = async (
  orderId: number,
  consumerId: string
): Promise<void> => {
  const order = await getOrderByIdService(orderId);

  if (order.consumerId !== consumerId) {
    throw Boom.forbidden('You can only delete your own orders');
  }
  if (order.status !== OrderStatus.CREATED) {
    throw Boom.badRequest(
      'Cannot delete an order that is already being processed'
    );
  }

  await pool.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);
  await pool.query('DELETE FROM orders WHERE id = $1', [orderId]);
};

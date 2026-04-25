import Boom from '@hapi/boom';
import { PoolClient } from 'pg';
import { pool } from '../../config/database';
import { UserRole } from '../auth/auth.types';
import {
  CreateOrderDTO,
  NumericValue,
  Order,
  OrderItem,
  OrderItemRow,
  OrderPositionRow,
  OrderRow,
  OrderStatus,
  ProductPriceRow,
  UpdatePositionDTO,
  UpdatePositionResult,
} from './order.types';

const CREATED_STATUS_ALIASES = ['pending', 'created', 'creado'];
const IN_DELIVERY_STATUS_ALIASES = [
  'delivery',
  'in_delivery',
  'en_entrega',
  'preparing',
];
const DELIVERED_STATUS_ALIASES = ['delivered', 'entregado', 'completed'];
const ACCEPTED_POSITION_LAT_OFFSET = 0.00006;

const SELECT_ORDER_COLUMNS = `
  SELECT
    o.id,
    o.status,
    o.total,
    ST_Y(o.destination::geometry) AS "destinationLat",
    ST_X(o.destination::geometry) AS "destinationLng",
    ST_Y(o.delivery_position::geometry) AS "deliveryLat",
    ST_X(o.delivery_position::geometry) AS "deliveryLng",
    o.consumer_id AS "consumerId",
    o.store_id AS "storeId",
    o.delivery_id AS "deliveryId",
    o.created_at AS "createdAt",
    o.updated_at AS "updatedAt"
  FROM orders o
`;

const parseNumericValue = (value: NumericValue): number => Number(value);

const normalizeOrderStatus = (status: string): OrderStatus => {
  const normalizedStatus = status.trim().toLowerCase().replace(/\s+/g, '_');

  if (CREATED_STATUS_ALIASES.includes(normalizedStatus)) {
    return OrderStatus.CREATED;
  }

  if (IN_DELIVERY_STATUS_ALIASES.includes(normalizedStatus)) {
    return OrderStatus.IN_DELIVERY;
  }

  if (DELIVERED_STATUS_ALIASES.includes(normalizedStatus)) {
    return OrderStatus.DELIVERED;
  }

  throw Boom.internal(`Unsupported order status: ${status}`);
};

const mapOrderItemRow = (row: OrderItemRow): OrderItem => ({
  id: parseNumericValue(row.id),
  orderId: parseNumericValue(row.orderId),
  productId: parseNumericValue(row.productId),
  quantity: row.quantity,
  unitPrice: parseNumericValue(row.unitPrice),
});

const mapOrderRow = (row: OrderRow): Order => ({
  id: parseNumericValue(row.id),
  status: normalizeOrderStatus(row.status),
  total: parseNumericValue(row.total),
  destination: {
    lat: row.destinationLat,
    lng: row.destinationLng,
  },
  deliveryPosition:
    row.deliveryLat === null || row.deliveryLng === null
      ? null
      : {
          lat: row.deliveryLat,
          lng: row.deliveryLng,
        },
  consumerId: row.consumerId,
  storeId: parseNumericValue(row.storeId),
  deliveryId: row.deliveryId,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const getOrderItems = async (
  client: PoolClient,
  orderId: number
): Promise<OrderItem[]> => {
  const { rows } = await client.query<OrderItemRow>(
    `SELECT
       id,
       order_id AS "orderId",
       product_id AS "productId",
       quantity,
       unit_price AS "unitPrice"
     FROM order_items
     WHERE order_id = $1
     ORDER BY id ASC`,
    [orderId]
  );

  return rows.map(mapOrderItemRow);
};

const getOrderByIdFromClient = async (
  client: PoolClient,
  orderId: number
): Promise<Order> => {
  const { rows, rowCount } = await client.query<OrderRow>(
    `${SELECT_ORDER_COLUMNS} WHERE o.id = $1`,
    [orderId]
  );

  if (rowCount === 0) {
    throw Boom.notFound('Order not found');
  }

  const order = mapOrderRow(rows[0]);
  order.items = await getOrderItems(client, orderId);
  return order;
};

const withTransaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getOrdersService = async (
  userId: string,
  role: UserRole
): Promise<Order[]> => {
  let query = SELECT_ORDER_COLUMNS;
  const params: Array<string | string[]> = [userId];

  if (role === UserRole.CONSUMER) {
    query += ' WHERE o.consumer_id = $1';
  } else if (role === UserRole.STORE) {
    query +=
      ' WHERE o.store_id = (SELECT id FROM stores WHERE owner_id = $1 LIMIT 1)';
  } else if (role === UserRole.DELIVERY) {
    query += `
      WHERE o.delivery_id = $1
         OR (
           o.delivery_id IS NULL
           AND LOWER(REPLACE(TRIM(o.status), ' ', '_')) = ANY($2::text[])
         )
    `;
    params.push(CREATED_STATUS_ALIASES);
  } else {
    return [];
  }

  query += ' ORDER BY o.created_at DESC';

  const { rows } = await pool.query<OrderRow>(query, params);
  return rows.map(mapOrderRow);
};

export const getOrderByIdService = async (orderId: number): Promise<Order> => {
  const client = await pool.connect();

  try {
    return await getOrderByIdFromClient(client, orderId);
  } finally {
    client.release();
  }
};

export const createOrderService = async (
  dto: CreateOrderDTO,
  consumerId: string
): Promise<Order> =>
  withTransaction(async (client) => {
    const uniqueProductIds = [
      ...new Set(dto.items.map((item) => item.productId)),
    ];

    const { rows: productRows } = await client.query<ProductPriceRow>(
      `SELECT id, price, store_id AS "storeId"
       FROM products
       WHERE id = ANY($1::bigint[])`,
      [uniqueProductIds]
    );

    if (productRows.length !== uniqueProductIds.length) {
      throw Boom.notFound('One or more products were not found');
    }

    const productPrices = new Map<number, number>(
      productRows.map((row) => [
        parseNumericValue(row.id),
        parseNumericValue(row.price),
      ])
    );
    const resolvedStoreId = parseNumericValue(productRows[0].storeId);
    const allProductsBelongToSameStore = productRows.every(
      (row) => parseNumericValue(row.storeId) === resolvedStoreId
    );

    if (!allProductsBelongToSameStore) {
      throw Boom.badRequest(
        'All products in the order must belong to the same store'
      );
    }

    const total = dto.items.reduce((accumulator, item) => {
      const unitPrice = productPrices.get(item.productId);

      if (unitPrice === undefined) {
        throw Boom.notFound(`Product ${item.productId} not found`);
      }

      return accumulator + unitPrice * item.quantity;
    }, 0);

    const { rows: insertedOrders } = await client.query<OrderRow>(
      `INSERT INTO orders (status, total, destination, consumer_id, store_id)
       VALUES (
         $1,
         $2,
         ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography,
         $5,
         $6
       )
       RETURNING
         id,
         status,
         total,
         ST_Y(destination::geometry) AS "destinationLat",
         ST_X(destination::geometry) AS "destinationLng",
         ST_Y(delivery_position::geometry) AS "deliveryLat",
         ST_X(delivery_position::geometry) AS "deliveryLng",
         consumer_id AS "consumerId",
         store_id AS "storeId",
         delivery_id AS "deliveryId",
         created_at AS "createdAt",
         updated_at AS "updatedAt"`,
      [
        OrderStatus.CREATED,
        total,
        dto.destination.lng,
        dto.destination.lat,
        consumerId,
        resolvedStoreId,
      ]
    );

    const order = mapOrderRow(insertedOrders[0]);
    const itemValues = dto.items.flatMap((item) => {
      const unitPrice = productPrices.get(item.productId);

      if (unitPrice === undefined) {
        throw Boom.notFound(`Product ${item.productId} not found`);
      }

      return [order.id, item.productId, item.quantity, unitPrice];
    });

    const itemPlaceholders = dto.items
      .map((_, index) => {
        const offset = index * 4;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${
          offset + 4
        })`;
      })
      .join(', ');

    const { rows: itemRows } = await client.query<OrderItemRow>(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
       VALUES ${itemPlaceholders}
       RETURNING
         id,
         order_id AS "orderId",
         product_id AS "productId",
         quantity,
         unit_price AS "unitPrice"`,
      itemValues
    );

    order.items = itemRows.map(mapOrderItemRow);
    return order;
  });

export const acceptOrderService = async (
  orderId: number,
  deliveryId: string
): Promise<Order> =>
  withTransaction(async (client) => {
    const { rows, rowCount } = await client.query<OrderRow>(
      `UPDATE orders AS o
       SET status = $1,
           delivery_id = $2,
           delivery_position = COALESCE(
             o.delivery_position,
             ST_SetSRID(
               ST_MakePoint(
                 ST_X(o.destination::geometry),
                 ST_Y(o.destination::geometry) + $5
               ),
               4326
             )::geography
           ),
           updated_at = NOW()
       WHERE o.id = $3
         AND o.delivery_id IS NULL
         AND LOWER(REPLACE(TRIM(o.status), ' ', '_')) = ANY($4::text[])
       RETURNING
         o.id,
         o.status,
         o.total,
         ST_Y(o.destination::geometry) AS "destinationLat",
         ST_X(o.destination::geometry) AS "destinationLng",
         ST_Y(o.delivery_position::geometry) AS "deliveryLat",
         ST_X(o.delivery_position::geometry) AS "deliveryLng",
         o.consumer_id AS "consumerId",
         o.store_id AS "storeId",
         o.delivery_id AS "deliveryId",
         o.created_at AS "createdAt",
         o.updated_at AS "updatedAt"`,
      [
        OrderStatus.IN_DELIVERY,
        deliveryId,
        orderId,
        CREATED_STATUS_ALIASES,
        ACCEPTED_POSITION_LAT_OFFSET,
      ]
    );

    if (rowCount === 0) {
      const { rowCount: existingOrderCount } = await client.query(
        'SELECT 1 FROM orders WHERE id = $1',
        [orderId]
      );

      if (existingOrderCount === 0) {
        throw Boom.notFound('Order not found');
      }

      throw Boom.conflict('This order is no longer available');
    }

    const order = mapOrderRow(rows[0]);
    order.items = await getOrderItems(client, orderId);
    return order;
  });

export const updateDeliveryPositionService = async (
  orderId: number,
  deliveryId: string,
  dto: UpdatePositionDTO
): Promise<UpdatePositionResult> =>
  withTransaction(async (client) => {
    const deliveredStatusAliases = [
      OrderStatus.DELIVERED,
      ...DELIVERED_STATUS_ALIASES,
    ];

    const { rows, rowCount } = await client.query<OrderPositionRow>(
      `WITH next_position AS (
         SELECT ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography AS point
       ),
       moved_order AS (
         UPDATE orders AS o
         SET delivery_position = next_position.point,
             updated_at = NOW()
         FROM next_position
         WHERE o.id = $3
           AND o.delivery_id = $4
           AND LOWER(REPLACE(TRIM(o.status), ' ', '_')) <> ALL($5::text[])
         RETURNING
           o.id,
           o.status,
           o.total,
           ST_Y(o.destination::geometry) AS "destinationLat",
           ST_X(o.destination::geometry) AS "destinationLng",
           ST_Y(o.delivery_position::geometry) AS "deliveryLat",
           ST_X(o.delivery_position::geometry) AS "deliveryLng",
           o.consumer_id AS "consumerId",
           o.store_id AS "storeId",
           o.delivery_id AS "deliveryId",
           o.created_at AS "createdAt",
           o.updated_at AS "updatedAt",
           ST_Distance(next_position.point, o.destination) AS "distanceMeters",
           ST_DWithin(next_position.point, o.destination, 5) AS arrived
       ),
       delivered_order AS (
         UPDATE orders AS o
         SET status = $6, updated_at = NOW()
         FROM moved_order
         WHERE o.id = moved_order.id
           AND moved_order.arrived = TRUE
           AND LOWER(REPLACE(TRIM(o.status), ' ', '_')) <> $6
         RETURNING
           o.id,
           o.status,
           o.total,
           ST_Y(o.destination::geometry) AS "destinationLat",
           ST_X(o.destination::geometry) AS "destinationLng",
           ST_Y(o.delivery_position::geometry) AS "deliveryLat",
           ST_X(o.delivery_position::geometry) AS "deliveryLng",
           o.consumer_id AS "consumerId",
           o.store_id AS "storeId",
           o.delivery_id AS "deliveryId",
           o.created_at AS "createdAt",
           o.updated_at AS "updatedAt",
           ST_Distance(o.delivery_position, o.destination) AS "distanceMeters",
           TRUE AS arrived
       )
       SELECT * FROM delivered_order
       UNION ALL
       SELECT * FROM moved_order
       WHERE NOT EXISTS (SELECT 1 FROM delivered_order)`,
      [
        dto.lng,
        dto.lat,
        orderId,
        deliveryId,
        deliveredStatusAliases,
        OrderStatus.DELIVERED,
      ]
    );

    if (rowCount === 0) {
      const { rowCount: existingOrderCount } = await client.query(
        'SELECT 1 FROM orders WHERE id = $1',
        [orderId]
      );

      if (existingOrderCount === 0) {
        throw Boom.notFound('Order not found');
      }

      throw Boom.conflict('This order is not available for position updates');
    }

    const positionRow = rows[0];
    const order = mapOrderRow(positionRow);
    order.items = await getOrderItems(client, orderId);

    return {
      order,
      arrived: positionRow.arrived,
      distanceMeters: parseNumericValue(positionRow.distanceMeters),
    };
  });

export const completeOrderService = async (
  orderId: number,
  deliveryId: string
): Promise<Order> =>
  withTransaction(async (client) => {
    const currentOrder = await getOrderByIdFromClient(client, orderId);

    if (currentOrder.deliveryId !== deliveryId) {
      throw Boom.forbidden('This order is assigned to another delivery user');
    }

    if (currentOrder.status === OrderStatus.DELIVERED) {
      return currentOrder;
    }

    const { rows, rowCount } = await client.query<OrderRow>(
      `UPDATE orders AS o
       SET status = $1, updated_at = NOW()
       WHERE o.id = $2
         AND o.delivery_id = $3
       RETURNING
         o.id,
         o.status,
         o.total,
         ST_Y(o.destination::geometry) AS "destinationLat",
         ST_X(o.destination::geometry) AS "destinationLng",
         ST_Y(o.delivery_position::geometry) AS "deliveryLat",
         ST_X(o.delivery_position::geometry) AS "deliveryLng",
         o.consumer_id AS "consumerId",
         o.store_id AS "storeId",
         o.delivery_id AS "deliveryId",
         o.created_at AS "createdAt",
         o.updated_at AS "updatedAt"`,
      [OrderStatus.DELIVERED, orderId, deliveryId]
    );

    if (rowCount === 0) {
      throw Boom.conflict('This order cannot be marked as delivered');
    }

    const order = mapOrderRow(rows[0]);
    order.items = await getOrderItems(client, orderId);
    return order;
  });

export const deleteOrderService = async (
  orderId: number,
  consumerId: string
): Promise<void> =>
  withTransaction(async (client) => {
    const order = await getOrderByIdFromClient(client, orderId);

    if (order.consumerId !== consumerId) {
      throw Boom.forbidden('You can only delete your own orders');
    }

    if (order.status !== OrderStatus.CREATED) {
      throw Boom.badRequest(
        'Cannot delete an order that is already being processed'
      );
    }

    await client.query('DELETE FROM order_items WHERE order_id = $1', [
      orderId,
    ]);
    await client.query('DELETE FROM orders WHERE id = $1', [orderId]);
  });

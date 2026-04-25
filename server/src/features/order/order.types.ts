import { GeoPoint } from '../../shared/geo.types';

export enum OrderStatus {
  CREATED = 'created',
  IN_DELIVERY = 'in_delivery',
  DELIVERED = 'delivered',
}

export enum OrderBroadcastEvent {
  POSITION = 'delivery:position',
  STATUS = 'order:status',
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: number;
  status: OrderStatus;
  total: number;
  destination: GeoPoint;
  deliveryPosition: GeoPoint | null;
  consumerId: string;
  storeId: number;
  deliveryId: string | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

export interface CreateOrderItemDTO {
  productId: number;
  quantity: number;
  unitPrice?: number;
}

export interface CreateOrderDTO {
  storeId: number;
  destination: GeoPoint;
  items: CreateOrderItemDTO[];
}

export interface UpdatePositionDTO {
  lat: number;
  lng: number;
}

export interface OrderPositionBroadcastPayload {
  lat: number;
  lng: number;
}

export interface OrderStatusBroadcastPayload {
  status: OrderStatus;
  deliveryId: string | null;
}

export interface UpdatePositionResult {
  order: Order;
  arrived: boolean;
  distanceMeters: number;
}

export type NumericValue = number | string;

export interface OrderRow {
  id: NumericValue;
  status: string;
  total: NumericValue;
  destinationLat: number;
  destinationLng: number;
  deliveryLat: number | null;
  deliveryLng: number | null;
  consumerId: string;
  storeId: NumericValue;
  deliveryId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemRow {
  id: NumericValue;
  orderId: NumericValue;
  productId: NumericValue;
  quantity: number;
  unitPrice: NumericValue;
}

export interface ProductPriceRow {
  id: NumericValue;
  price: NumericValue;
  storeId: NumericValue;
}

export interface OrderPositionRow extends OrderRow {
  distanceMeters: number;
  arrived: boolean;
}

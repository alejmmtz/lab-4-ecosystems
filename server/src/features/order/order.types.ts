import { GeoPoint } from '../../shared/geo.types';

export enum OrderStatus {
  CREATED = 'Created',
  IN_DELIVERY = 'Delivery',
  DELIVERED = 'Delivered',
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
  deliveryPosition?: GeoPoint | null;
  consumerId: string;
  storeId: number;
  deliveryId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  items?: OrderItem[];
}

export interface CreateOrderDTO {
  storeId: number;
  destination: GeoPoint;
  items: {
    productId: number;
    quantity: number;
    unitPrice: number;
  }[];
}

export type AcceptOrderDTO = Record<string, never>;

export interface UpdatePositionDTO {
  lat: number;
  lng: number;
}

export interface PositionBroadcastPayload {
  lat: number;
  lng: number;
}

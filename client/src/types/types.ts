export interface AuthData {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: "consumer" | "store" | "delivery";
  };
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export enum OrderStatus {
  CREATED = "created",
  IN_DELIVERY = "in_delivery",
  DELIVERED = "delivered",
}

export enum OrderBroadcastEvent {
  POSITION = "delivery:position",
  STATUS = "order:status",
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.CREATED]: "Creado",
  [OrderStatus.IN_DELIVERY]: "En entrega",
  [OrderStatus.DELIVERED]: "Entregado",
};

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

export interface CreateOrderDTO {
  storeId: number;
  destination: GeoPoint;
  items: { productId: number; quantity: number; unitPrice?: number }[];
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

export interface UpdateOrderPositionResponse {
  order: Order;
  arrived: boolean;
  distanceMeters: number;
}

export type StoreStatus = "open" | "closed";

export interface Store {
  id: number;
  name: string;
  address?: GeoPoint | null;
  status: StoreStatus;
  ownerId: string;
  createdAt?: string;
}

export interface CreateStoreDTO {
  name: string;
  address?: GeoPoint;
}

export interface UpdateStoreDTO {
  name?: string;
  address?: GeoPoint;
  status?: StoreStatus;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  storeId: number;
  createdAt?: string;
}

export interface CreateProductDTO {
  name: string;
  price: number;
  description: string;
  storeId: number;
}

export interface UpdateProductDTO {
  name?: string;
  price?: number;
  description?: string;
}

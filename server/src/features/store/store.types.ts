import { GeoPoint } from '../../shared/geo.types';

export enum StoreStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

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

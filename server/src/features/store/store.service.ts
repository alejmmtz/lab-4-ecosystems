/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Store,
  CreateStoreDTO,
  UpdateStoreDTO,
  StoreStatus,
} from './store.types';
import Boom from '@hapi/boom';
import { pool } from '../../config/database';

const mapStoreRow = (row: any): Store => ({
  id: row.id,
  name: row.name,
  address:
    row.addressLat != null
      ? { lat: row.addressLat, lng: row.addressLng }
      : null,
  status: row.status,
  ownerId: row.ownerId,
  createdAt: row.createdAt,
});

const SELECT_STORE = `
  SELECT
    id,
    name,
    ST_Y(address::geometry) AS "addressLat",
    ST_X(address::geometry) AS "addressLng",
    status,
    owner_id AS "ownerId",
    created_at AS "createdAt"
  FROM stores
`;

export const getStoresService = async (): Promise<Store[]> => {
  const { rows } = await pool.query(SELECT_STORE);
  return rows.map(mapStoreRow);
};

export const getStoreByIdService = async (storeId: number): Promise<Store> => {
  const { rows, rowCount } = await pool.query(`${SELECT_STORE} WHERE id = $1`, [
    storeId,
  ]);
  if (rowCount === 0) throw Boom.notFound('Tienda no encontrada');
  return mapStoreRow(rows[0]);
};

export const getStoreByOwnerIdService = async (
  ownerId: string
): Promise<Store> => {
  const { rows, rowCount } = await pool.query(
    `${SELECT_STORE} WHERE owner_id = $1`,
    [ownerId]
  );
  if (rowCount === 0)
    throw Boom.notFound('Este usuario no tiene una tienda asociada');
  return mapStoreRow(rows[0]);
};

export const createStoreService = async (
  store: CreateStoreDTO,
  ownerId: string
): Promise<Store> => {
  const { rows } = await pool.query(
    `INSERT INTO stores (name, address, status, owner_id)
  VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5)
     RETURNING
       id,
       name,
       ST_Y(address::geometry) AS "addressLat",
       ST_X(address::geometry) AS "addressLng",
       status,
       owner_id AS "ownerId",
       created_at AS "createdAt"`,
    [
      store.name,
      store.address?.lng,
      store.address?.lat,
      StoreStatus.CLOSED,
      ownerId,
    ]
  );
  return mapStoreRow(rows[0]);
};

export const updateStoreService = async (
  storeId: number,
  ownerId: string,
  data: UpdateStoreDTO
): Promise<Store> => {
  const currentStore = await getStoreByIdService(storeId);
  if (currentStore.ownerId !== ownerId) {
    throw Boom.forbidden('No tienes permisos para editar esta tienda');
  }

  const { rows } = await pool.query(
    `UPDATE stores
     SET
       name   = COALESCE($1, name),
       address = ST_SetSRID(ST_MakePoint($2, $3), 4326),
       status  = COALESCE($4, status)
     WHERE id = $5
     RETURNING
       id,
       name,
       ST_Y(address::geometry) AS "addressLat",
       ST_X(address::geometry) AS "addressLng",
       status,
       owner_id AS "ownerId",
       created_at AS "createdAt"`,
    [
      data.name ?? null,
      data.address?.lng ?? null,
      data.address?.lat ?? null,
      data.status ?? null,
      storeId,
    ]
  );
  return mapStoreRow(rows[0]);
};

export const deleteStoreService = async (
  storeId: number,
  ownerId: string
): Promise<void> => {
  const store = await getStoreByIdService(storeId);
  if (store.ownerId !== ownerId) {
    throw Boom.forbidden('No tienes permisos para eliminar esta tienda');
  }
  await pool.query('DELETE FROM stores WHERE id = $1', [storeId]);
};

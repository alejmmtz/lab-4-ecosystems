import Boom from '@hapi/boom';
import { pool } from '../../config/database';
import {
  Store,
  CreateStoreDTO,
  UpdateStoreDTO,
  StoreStatus,
} from './store.types';
import { NumericValue } from '../order/order.types';

interface StoreRow {
  id: NumericValue;
  name: string;
  status: StoreStatus;
  ownerId: string;
  createdAt: string;
}

const mapStoreRow = (row: StoreRow): Store => ({
  id: Number(row.id),
  name: row.name,
  address: null,
  status: row.status,
  ownerId: row.ownerId,
  createdAt: row.createdAt,
});

const SELECT_STORE = `
  SELECT
    id,
    name,
    status,
    owner_id AS "ownerId",
    created_at AS "createdAt"
  FROM stores
`;

export const getStoresService = async (): Promise<Store[]> => {
  const { rows } = await pool.query<StoreRow>(SELECT_STORE);
  return rows.map(mapStoreRow);
};

export const getStoreByIdService = async (storeId: number): Promise<Store> => {
  const { rows, rowCount } = await pool.query<StoreRow>(
    `${SELECT_STORE} WHERE id = $1`,
    [storeId]
  );

  if (rowCount === 0) {
    throw Boom.notFound('Tienda no encontrada');
  }

  return mapStoreRow(rows[0]);
};

export const getStoreByOwnerIdService = async (
  ownerId: string
): Promise<Store> => {
  const { rows, rowCount } = await pool.query<StoreRow>(
    `${SELECT_STORE} WHERE owner_id = $1`,
    [ownerId]
  );

  if (rowCount === 0) {
    throw Boom.notFound('Este usuario no tiene una tienda asociada');
  }

  return mapStoreRow(rows[0]);
};

export const createStoreService = async (
  store: CreateStoreDTO,
  ownerId: string
): Promise<Store> => {
  const { rows } = await pool.query<StoreRow>(
    `INSERT INTO stores (name, status, owner_id)
     VALUES ($1, $2, $3)
     RETURNING
       id,
       name,
       status,
       owner_id AS "ownerId",
       created_at AS "createdAt"`,
    [store.name, StoreStatus.CLOSED, ownerId]
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

  const { rows } = await pool.query<StoreRow>(
    `UPDATE stores
     SET
       name = COALESCE($1, name),
       status = COALESCE($2, status)
     WHERE id = $3
     RETURNING
       id,
       name,
       status,
       owner_id AS "ownerId",
       created_at AS "createdAt"`,
    [data.name ?? null, data.status ?? null, storeId]
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

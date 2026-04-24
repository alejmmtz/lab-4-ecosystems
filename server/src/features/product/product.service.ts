import Boom from '@hapi/boom';
import { pool } from '../../config/database';
import { CreateProductDTO, Product, UpdateProductDTO } from './product.types';

const SELECT_PRODUCT = `
  SELECT id, name, price, description, store_id AS "storeId", created_at AS "createdAt"
  FROM products
`;

export const getProductsService = async (
  storeId?: number
): Promise<Product[]> => {
  if (storeId) {
    const { rows } = await pool.query(`${SELECT_PRODUCT} WHERE store_id = $1`, [
      storeId,
    ]);
    return rows;
  }
  const { rows } = await pool.query(SELECT_PRODUCT);
  return rows;
};

export const getProductByIdService = async (
  productId: number
): Promise<Product> => {
  const { rows, rowCount } = await pool.query(
    `${SELECT_PRODUCT} WHERE id = $1`,
    [productId]
  );
  if (rowCount === 0) throw Boom.notFound('Product not found');
  return rows[0];
};

export const createProductService = async (
  product: CreateProductDTO
): Promise<Product> => {
  const { rows } = await pool.query(
    `INSERT INTO products (name, price, description, store_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, price, description, store_id AS "storeId", created_at AS "createdAt"`,
    [product.name, product.price, product.description, product.storeId]
  );
  return rows[0];
};

export const updateProductService = async (
  product: UpdateProductDTO,
  productId: number
): Promise<Product> => {
  const { rows } = await pool.query(
    `UPDATE products
     SET
       name        = COALESCE($1, name),
       price       = COALESCE($2, price),
       description = COALESCE($3, description)
     WHERE id = $4
     RETURNING id, name, price, description, store_id AS "storeId", created_at AS "createdAt"`,
    [
      product.name ?? null,
      product.price ?? null,
      product.description ?? null,
      productId,
    ]
  );
  return rows[0];
};

export const deleteProductService = async (
  productId: number,
  storeId: number // number, consistente con bigint
): Promise<void> => {
  const product = await getProductByIdService(productId);
  if (product.storeId !== storeId) {
    throw Boom.forbidden(
      'You do not have this product in your store, action denied'
    );
  }
  await pool.query('DELETE FROM products WHERE id = $1', [productId]);
};

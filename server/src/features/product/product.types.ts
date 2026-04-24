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

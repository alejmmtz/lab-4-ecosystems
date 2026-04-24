export enum UserRole {
  STORE = 'store',
  CONSUMER = 'consumer',
  DELIVERY = 'delivery',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface CreateUserDTO {
  email: string;
  name: string;
  password: string;
  role: UserRole;

  storeName?: string;
}

export interface AuthenticateUserDTO {
  email: string;
  password: string;
}

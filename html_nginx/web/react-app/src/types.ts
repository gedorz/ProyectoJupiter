export type AnalyzeResponse = {
  response?: string;
  [key: string]: unknown;
};

export type Task = {
  id: number;
  id_padre?: number | null;
  id_user?: number | null;
  titulo: string;
  contenido: string;
  startline?: string | null;
  deadline: string;
  completada: boolean;
  created_at: string;
  updated_at: string;
};

export type TaskCreatePayload = {
  titulo: string;
  contenido: string;
  startline?: string | null;
  deadline: string;
  id_padre?: number | null;
  id_user?: number | null;
};

export type TaskUpdatePayload = {
  titulo: string;
  contenido: string;
  startline?: string | null;
  deadline: string;
  completada: boolean;
  id_padre?: number | null;
  id_user?: number | null;
};

export type User = {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  descripcion: string;
  password: string;
  status: number;
  startline: string | null;
  deadline: string | null;
  created_at: string;
  updated_at: string;
};

export type UserCreatePayload = {
  nombre: string;
  apellido: string;
  email: string;
  descripcion: string;
  password: string;
  status: number;
  startline?: string | null;
  deadline?: string | null;
};

export type UserUpdatePayload = {
  nombre: string;
  apellido: string;
  email: string;
  descripcion: string;
  password: string;
  status: number;
  startline?: string | null;
  deadline?: string | null;
};

export type Product = {
  pk_product: number;
  cdgo_producto_externo: string | null;
  name_product: string;
  description_product: string | null;
  disabled: boolean;
  price: number | null;
  unit: number;
  final_price: number | null;
  discount: number | null;
  discount_end_date: string | null;
  fk_currency: number;
  currency: string | null;
  user_rating: number;
  link: string | null;
  creation_date: string | null;
  fk_last_update_user: number;
  last_update: string | null;
  supplier: string | null;
};

export type ProductCreatePayload = {
  cdgo_producto_externo?: string | null;
  name_product: string;
  description_product?: string | null;
  disabled?: boolean;
  price?: number | null;
  unit?: number;
  final_price?: number | null;
  discount?: number | null;
  discount_end_date?: string | null;
  fk_currency?: number;
  currency?: string | null;
  user_rating?: number;
  link?: string | null;
  creation_date?: string | null;
  fk_last_update_user?: number;
  last_update?: string | null;
  supplier?: string | null;
};

export type ProductUpdatePayload = ProductCreatePayload;

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  price1?: number;
  price2?: number;
  imageId: string;
  category: string;
  photo_url?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: 'admin' | 'customer';
};

export type CartItem = {
  id: string;
  product: Product;
  quantity: number;
};

export type Address = {
  id: number;
  profile_id: number;
  order_id: number | null;
  postal_code: string | null;
  country: string | null;
  city: string | null;
  street: string | null;
  building: string | null;
  housing: string | null;
  apartment: string | null;
  created_at: string;
  updated_at: string;
  address_type: 'delivery' | 'billing' | 'other' | null;
};

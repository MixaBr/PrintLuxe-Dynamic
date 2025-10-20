export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageId: string;
  category: string;
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

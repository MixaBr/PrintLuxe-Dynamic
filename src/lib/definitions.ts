
export type Product = {
  id: string;
  name: string;
  description: string;
  price: number | null; // This will hold the final price for the client
  imageId: string;
  category: string;

  // Fields from screenshot
  product_number: string | null;
  article_number: string | null;
  photo_url: string | null;
  stock_quantity: number | null;
  price1: number | null;
  price2: number | null;
  price3: number | null;
  price4: number | null;
  added_at: string;
  updated_at: string;
  accumulation: number | null;
  sizeW: number | null;
  sizeL: number | null;
  sizeH: number | null;
  weight: number | null;
  manufacturer: string | null;
  compatible_with_models: string | null;
  image_urls: string[] | null;
  is_featured: boolean | null;
  total_purchases: number | null;
  views_count: number | null;
  order_count: number | null;
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


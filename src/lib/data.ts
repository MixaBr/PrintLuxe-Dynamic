import type { Product } from './definitions';
import { PlaceHolderImages } from './placeholder-images';

const products: Product[] = [
  { id: '1', name: 'Визитки', description: 'Стильные визитки на плотной бумаге.', price: 1500, imageId: 'product-business-cards', category: 'Печатная продукция' },
  { id: '2', name: 'Флаеры', description: 'Яркие и красочные флаеры для вашей рекламы.', price: 2500, imageId: 'product-flyers', category: 'Рекламная продукция' },
  { id: '3', name: 'Постеры', description: 'Широкоформатная печать постеров любого размера.', price: 3000, imageId: 'product-posters', category: 'Интерьерная печать' },
  { id: '4', name: 'Брошюры', description: 'Многостраничные брошюры для презентации компании.', price: 5000, imageId: 'product-brochures', category: 'Печатная продукция' },
  { id: '5', name: 'Баннеры', description: 'Прочные виниловые баннеры для наружной рекламы.', price: 7500, imageId: 'product-banners', category: 'Наружная реклама' },
  { id: '6', name: 'Наклейки', description: 'Кастомные наклейки любой формы и размера.', price: 1000, imageId: 'product-stickers', category: 'Рекламная продукция' },
  { id: '7', name: 'Печать на футболках', description: 'Высококачественная печать на текстиле.', price: 2200, imageId: 'product-tshirt', category: 'Сувенирная продукция' },
  { id: '8', name: 'Кружки с логотипом', description: 'Брендированные кружки для офиса и мероприятий.', price: 1800, imageId: 'product-mugs', category: 'Сувенирная продукция' },
];

// Simulate fetching data with a delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getAllProducts(): Promise<Product[]> {
  await sleep(500);
  return products;
}

export async function getFeaturedProducts(count: number): Promise<Product[]> {
  await sleep(300);
  return products.slice(0, count);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  await sleep(200);
  return products.find(p => p.id === id);
}

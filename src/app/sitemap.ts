import { MetadataRoute } from 'next';
import { getAllProducts } from '@/lib/data';
import { getPageLastModified } from '@/lib/settings-data';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Получаем все товары для генерации ссылок
  const products = await getAllProducts();
  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `https://remontprintlux.by/catalog/${product.id}`,
    lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // Получаем точные даты последнего обновления для динамических страниц
  const aboutLastModified = await getPageLastModified('about_');
  const contactLastModified = await getPageLastModified('contact_');

  // Собираем все страницы в единый, типизированный массив
  const routes: MetadataRoute.Sitemap = [
    {
      url: 'https://remontprintlux.by',
      lastModified: new Date(), // Главная страница, обновляется при каждой сборке
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://remontprintlux.by/about',
      lastModified: aboutLastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://remontprintlux.by/contact',
      lastModified: contactLastModified,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...productEntries,
  ];

  return routes;
}

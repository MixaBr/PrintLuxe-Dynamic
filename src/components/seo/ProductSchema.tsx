import type { Product } from '@/lib/definitions';

interface ProductSchemaProps {
  product: Product;
}

export default function ProductSchema({ product }: ProductSchemaProps) {
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.photo_url || (Array.isArray(product.image_urls) && product.image_urls.length > 0 ? product.image_urls[0] : undefined),
    description: product.description,
    sku: product.article_number || product.product_number,
    brand: product.manufacturer ? {
      '@type': 'Brand',
      name: product.manufacturer,
    } : undefined,
    offers: product.price ? {
      '@type': 'Offer',
      url: `https://remontprintlux.by/catalog#product-${product.id}`, // Используем фрагмент для уникальности URL
      priceCurrency: 'BYN',
      price: product.price,
      availability: (product.stock_quantity ?? 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    } : undefined,
  };

  // JSON.stringify автоматически удаляет ключи с undefined значениями
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}


import { getAllProducts } from '@/lib/data';
import CatalogClient from './CatalogClient';

export default async function CatalogPage() {
  const products = await getAllProducts();
  
  // Get unique categories for the filter
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))] as string[];

  return (
    <div className="container mx-auto px-4 py-8 md:px-8 md:py-12">
      <div className="text-center mb-8">
        <h1 className="font-headline text-4xl md:text-5xl font-bold">Каталог продукции</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Ознакомьтесь с полным ассортиментом наших товаров и услуг.
        </p>
      </div>
      <CatalogClient products={products} categories={categories} />
    </div>
  );
}

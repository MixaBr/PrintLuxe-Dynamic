import { getAllProducts } from '@/lib/data';
import { ProductCard } from '@/components/catalog/ProductCard';

export default async function CatalogPage() {
  const products = await getAllProducts();

  return (
    <div className="container mx-auto px-4 py-12 md:px-8 md:py-16">
      <div className="text-center">
        <h1 className="font-headline text-4xl md:text-5xl font-bold">Каталог продукции</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Ознакомьтесь с полным ассортиментом наших товаров и услуг.
        </p>
      </div>
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

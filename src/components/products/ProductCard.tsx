
import Image from 'next/image';
import type { Product } from '@/lib/data';

interface ProductCardProps {
  product: Product;
}

// Helper function to format the product name for proper wrapping.
// It inserts a zero-width space after each slash, creating a line break opportunity.
const formatNameForWrapping = (name: string) => {
  if (!name) return '';
  // Using .join() is slightly more performant than .replace() with a global regex for this case.
  return name.split('/').join('/​');
};

export default function ProductCard({ product }: ProductCardProps) {
  // The component now receives the final price, no logic needed here.
  const price = product.price;

  const handleAddToCart = () => {
    // This is a placeholder for the actual add to cart logic.
    console.log(`Adding product ${product.id} (${product.name}) to cart.`);
    alert(`Товар "${product.name}" добавлен в корзину! (Заглушка)`);
  };

  return (
    <div className="border rounded-lg p-4 bg-white/10 backdrop-blur-sm text-white flex flex-col h-full">
      <div className="relative w-full h-40 mb-4 bg-gray-800 rounded-md overflow-hidden">
        <Image
          src={product.photo_url || '/placeholder.png'}
          alt={`Image of ${product.name}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 hover:scale-110"
        />
      </div>
      {/* The name is now formatted to allow breaks after slashes. */}
      <h3 className="font-bold text-lg" title={product.name}>
        {formatNameForWrapping(product.name)}
      </h3>

      <div className="mt-auto pt-4"> {/* Wrapper to push content to the bottom */}
        <p className="text-xl font-semibold">{price ? `${price.toLocaleString('ru-RU')} BYN` : 'Цена по запросу'}</p>
        <button
          onClick={handleAddToCart}
          className="mt-4 w-full bg-white/20 border border-white/30 backdrop-blur-sm text-white font-bold py-2 px-4 rounded hover:bg-white/30 transition-colors duration-200"
        >
          Купить
        </button>
      </div>
    </div>
  );
}

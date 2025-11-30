
import Image from 'next/image';
import type { Product } from '@/lib/data';
import { useCartStore } from '@/hooks/use-cart-store';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';

interface ProductCardProps {
  product: Product;
}

const formatNameForWrapping = (name: string) => {
  if (!name) return '';
  return name.split('/').join('/​');
};

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCartStore();
  const { toast } = useToast();
  
  const price = product.price;

  const handleAddToCart = () => {
    addToCart(product);
    toast({
      title: 'Успех!',
      description: `Товар "${product.name}" добавлен в корзину.`,
    });
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
      <h3 className="font-bold text-lg flex-grow" title={product.name}>
        {formatNameForWrapping(product.name)}
      </h3>

      <div className="mt-auto pt-4">
        <p className="text-xl font-semibold">{price ? `${price.toLocaleString('ru-RU')} BYN` : 'Цена по запросу'}</p>
        <Button
          onClick={handleAddToCart}
          className="mt-4 w-full bg-white/20 border border-white/30 backdrop-blur-sm text-white font-bold py-2 px-4 rounded hover:bg-white/30 transition-colors duration-200"
        >
          В корзину
        </Button>
      </div>
    </div>
  );
}

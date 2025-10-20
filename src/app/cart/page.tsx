import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const isEmpty = true; // Placeholder for cart state

  return (
    <div className="container mx-auto px-4 py-12 md:px-8 md:py-16">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-4xl md:text-5xl font-bold">Корзина</h1>
      </div>

      {isEmpty ? (
        <div className="text-center bg-card p-12 rounded-lg shadow-sm">
          <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground" />
          <h2 className="mt-6 text-2xl font-semibold">Ваша корзина пуста</h2>
          <p className="mt-2 text-muted-foreground">
            Похоже, вы еще ничего не добавили. Начните покупки, чтобы увидеть товары здесь.
          </p>
          <Button asChild className="mt-6 font-bold">
            <Link href="/catalog">Перейти в каталог</Link>
          </Button>
        </div>
      ) : (
        <div>
          {/* Cart items will be displayed here */}
          <p>Содержимое корзины...</p>
        </div>
      )}
    </div>
  );
}

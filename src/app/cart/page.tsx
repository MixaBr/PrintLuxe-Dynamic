'use client';

import { Button } from '@/components/ui/button';
import { ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/hooks/use-cart-store';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead, TableFooter } from '@/components/ui/table';
import Image from 'next/image';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity } = useCartStore();
  
  const total = items.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-8 md:py-16">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-4xl md:text-5xl font-bold">Корзина</h1>
      </div>

      {items.length === 0 ? (
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
        <div className="bg-card p-6 rounded-lg shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-24">Товар</TableHead>
                        <TableHead>Название</TableHead>
                        <TableHead className="text-center">Количество</TableHead>
                        <TableHead className="text-right">Цена за шт.</TableHead>
                        <TableHead className="text-right">Сумма</TableHead>
                        <TableHead className="w-12"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map(item => (
                        <TableRow key={item.id}>
                            <TableCell>
                                <div className="relative h-16 w-16 rounded-md overflow-hidden">
                                     <Image src={item.photo_url || '/placeholder.png'} alt={item.name} fill className="object-cover" />
                                </div>
                            </TableCell>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-center">
                               <div className="flex items-center justify-center">
                                    <Button size="icon" variant="ghost" onClick={() => handleQuantityChange(item.id, item.quantity - 1)}>-</Button>
                                    <span className="w-12 text-center">{item.quantity}</span>
                                    <Button size="icon" variant="ghost" onClick={() => handleQuantityChange(item.id, item.quantity + 1)}>+</Button>
                               </div>
                            </TableCell>
                            <TableCell className="text-right">{(item.price || 0).toLocaleString('ru-RU')} BYN</TableCell>
                            <TableCell className="text-right">{((item.price || 0) * item.quantity).toLocaleString('ru-RU')} BYN</TableCell>
                            <TableCell>
                                <Button size="icon" variant="ghost" onClick={() => removeFromCart(item.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={4} className="text-right font-bold text-lg">Итого:</TableCell>
                        <TableCell className="text-right font-bold text-lg">{total.toLocaleString('ru-RU')} BYN</TableCell>
                        <TableCell></TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
            <div className="flex justify-end mt-6">
                <Button size="lg" className="font-bold">Оформить заказ</Button>
            </div>
        </div>
      )}
    </div>
  );
}

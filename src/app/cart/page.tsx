'use client';

import { Button } from '@/components/ui/button';
import { ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/hooks/use-cart-store';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead, TableFooter } from '@/components/ui/table';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity } = useCartStore();
  
  const total = items.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      // If quantity is zero, do nothing, deletion is handled by trash icon
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:px-8 flex flex-col h-full">
      <div className="text-center mb-8 flex-shrink-0">
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-white">Корзина</h1>
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
        <div className="bg-card rounded-lg shadow-sm flex flex-col flex-grow min-h-0">
            {/* Mobile View */}
            <div className="md:hidden p-4 space-y-4 overflow-y-auto">
              {items.map(item => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-4 flex gap-4">
                    <div className="relative h-24 w-24 flex-shrink-0 rounded-md overflow-hidden">
                      <Image src={item.photo_url || '/placeholder.png'} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-grow flex flex-col">
                      <p className="font-medium text-sm leading-tight mb-2">{item.name}</p>
                      <div className="flex items-center justify-between my-2">
                        <span className="text-sm text-muted-foreground">Кол-во:</span>
                        <div className="flex items-center">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleQuantityChange(item.id, item.quantity - 1)}>-</Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleQuantityChange(item.id, item.quantity + 1)}>+</Button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Сумма:</span>
                        <span className="font-semibold">{((item.price || 0) * item.quantity).toLocaleString('ru-RU')} BYN</span>
                      </div>
                      <div className="mt-auto flex justify-end">
                         <Button size="icon" variant="ghost" onClick={() => removeFromCart(item.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden md:flex flex-col h-full">
              <div className='flex-shrink-0'>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-24 text-foreground">Товар</TableHead>
                            <TableHead className="text-foreground">Название</TableHead>
                            <TableHead className="text-center text-foreground w-40">Количество</TableHead>
                            <TableHead className="text-right text-foreground w-40">Цена за шт.</TableHead>
                            <TableHead className="text-right text-foreground w-40">Сумма</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                </Table>
              </div>
              <ScrollArea className="flex-grow">
                <Table>
                    <TableBody>
                        {items.map(item => (
                            <TableRow key={item.id}>
                                <TableCell className="w-24">
                                    <div className="relative h-16 w-16 rounded-md overflow-hidden">
                                        <Image src={item.photo_url || '/placeholder.png'} alt={item.name} fill className="object-cover" />
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="w-40">
                                  <div className="flex items-center justify-center">
                                        <Button size="icon" variant="ghost" onClick={() => handleQuantityChange(item.id, item.quantity - 1)}>-</Button>
                                        <span className="w-12 text-center">{item.quantity}</span>
                                        <Button size="icon" variant="ghost" onClick={() => handleQuantityChange(item.id, item.quantity + 1)}>+</Button>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right w-40">{(item.price || 0).toLocaleString('ru-RU')} BYN</TableCell>
                                <TableCell className="text-right w-40">{((item.price || 0) * item.quantity).toLocaleString('ru-RU')} BYN</TableCell>
                                <TableCell className="w-12">
                                    <Button size="icon" variant="ghost" onClick={() => removeFromCart(item.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              </ScrollArea>
               <div className='flex-shrink-0'>
                <Table>
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={4} className="text-right font-bold text-lg">Итого:</TableCell>
                            <TableCell className="text-right font-bold text-lg w-40">{total.toLocaleString('ru-RU')} BYN</TableCell>
                            <TableCell className="w-12"></TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
               </div>
            </div>

            {/* Common Footer */}
            <div className="flex flex-col-reverse sm:flex-row justify-between items-center mt-auto p-4 sm:p-6 border-t flex-shrink-0">
                <Button variant="outline" asChild>
                    <Link href="/catalog">Продолжить покупки</Link>
                </Button>
                <div className="w-full sm:w-auto flex flex-col sm:items-end gap-2 mb-4 sm:mb-0">
                   <div className="flex justify-between sm:justify-end items-center gap-4">
                     <span className="text-lg font-bold">Итого:</span>
                     <span className="text-xl font-bold">{total.toLocaleString('ru-RU')} BYN</span>
                   </div>
                   <Button size="lg" className="font-bold w-full">Оформить заказ</Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

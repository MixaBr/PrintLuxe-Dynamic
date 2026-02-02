
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/hooks/use-cart-store';

import { Button } from '@/components/ui/button';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";


export default function CartPage() {
  const router = useRouter();
  const { items, removeFromCart, updateQuantity } = useCartStore();
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [isConsentGiven, setIsConsentGiven] = useState(false);
  
  const total = items.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      // If quantity is zero, do nothing, deletion is handled by trash icon
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleCheckoutClick = () => {
    setShowConsentDialog(true);
  };

  const handleConfirmCheckout = () => {
    if (isConsentGiven) {
      router.push('/checkout');
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8 md:px-8 h-full flex flex-col">
          <div className="text-center mb-8 flex-shrink-0">
              <h1 className="font-headline text-4xl md:text-5xl font-bold text-white">Корзина</h1>
          </div>

          {items.length === 0 ? (
              <div className="text-center bg-black/50 text-white p-12 rounded-lg shadow-lg border-none backdrop-blur-sm">
              <ShoppingCart className="mx-auto h-16 w-16 text-gray-400" />
              <h2 className="mt-6 text-2xl font-semibold">Ваша корзина пуста</h2>
              <p className="mt-2 text-gray-300">
                  Похоже, вы еще ничего не добавили. Начните покупки, чтобы увидеть товары здесь.
              </p>
              <Button asChild className="mt-6 font-bold">
                  <Link href="/catalog">Перейти в каталог</Link>
              </Button>
              </div>
          ) : (
              <div className="bg-black/50 text-white border-white/20 backdrop-blur-sm rounded-lg shadow-lg flex flex-col flex-grow min-h-0">
                  {/* Mobile View */}
                  <div className="md:hidden flex-grow min-h-0">
                      <ScrollArea className="h-full p-4">
                          <div className="space-y-4">
                          {items.map(item => (
                              <Card key={item.id} className="overflow-hidden bg-white/10 border-none">
                              <CardContent className="p-4 flex gap-4">
                                  <div className="relative h-24 w-24 flex-shrink-0 rounded-md overflow-hidden">
                                  <Image src={item.photo_url || '/placeholder.png'} alt={item.name} fill sizes="96px" className="object-cover" />
                                  </div>
                                  <div className="flex-grow flex flex-col">
                                  <p className="font-medium text-sm leading-tight mb-2 text-white">{item.name}</p>
                                  <div className="flex items-center justify-between my-2">
                                      <span className="text-sm text-gray-300">Кол-во:</span>
                                      <div className="flex items-center">
                                      <Button size="icon" variant="ghost" className="h-7 w-7 text-white" onClick={() => handleQuantityChange(item.id, item.quantity - 1)}>-</Button>
                                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                                      <Button size="icon" variant="ghost" className="h-7 w-7 text-white" onClick={() => handleQuantityChange(item.id, item.quantity + 1)}>+</Button>
                                      </div>
                                  </div>
                                  <div className="flex justify-between items-center text-sm">
                                      <span className="text-gray-300">Сумма:</span>
                                      <span className="font-semibold text-white">{((item.price || 0) * item.quantity).toLocaleString('ru-RU')} BYN</span>
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
                      </ScrollArea>
                  </div>

                  {/* Desktop View */}
                  <div className="hidden md:flex flex-col flex-grow min-h-0">
                      <div className='flex-shrink-0 border-b border-white/20'>
                          <Table>
                              <TableHeader>
                                  <TableRow className="border-b-white/20 hover:bg-transparent">
                                      <TableHead className="w-24 text-white">Товар</TableHead>
                                      <TableHead className="text-left text-white">Название</TableHead>
                                      <TableHead className="text-center text-white w-40">Количество</TableHead>
                                      <TableHead className="text-right text-white w-40">Цена за шт.</TableHead>
                                      <TableHead className="text-right text-white w-40">Сумма</TableHead>
                                      <TableHead className="w-12"></TableHead>
                                  </TableRow>
                              </TableHeader>
                          </Table>
                      </div>
                      <ScrollArea className="flex-grow">
                          <Table>
                              <TableBody>
                                  {items.map(item => (
                                      <TableRow key={item.id} className="border-b-white/10 hover:bg-white/5">
                                          <TableCell className="w-24 py-2">
                                              <div className="relative h-14 w-14 rounded-md overflow-hidden">
                                                  <Image src={item.photo_url || '/placeholder.png'} alt={item.name} fill sizes="56px" className="object-cover" />
                                              </div>
                                          </TableCell>
                                          <TableCell className="font-medium text-white py-2">{item.name}</TableCell>
                                          <TableCell className="w-40 py-2">
                                          <div className="flex items-center justify-center">
                                                  <Button size="icon" variant="ghost" className="text-white" onClick={() => handleQuantityChange(item.id, item.quantity - 1)}>-</Button>
                                                  <span className="w-12 text-center">{item.quantity}</span>
                                                  <Button size="icon" variant="ghost" className="text-white" onClick={() => handleQuantityChange(item.id, item.quantity + 1)}>+</Button>
                                          </div>
                                          </TableCell>
                                          <TableCell className="text-right w-40 py-2">{(item.price || 0).toLocaleString('ru-RU')} BYN</TableCell>
                                          <TableCell className="text-right w-40 py-2">{((item.price || 0) * item.quantity).toLocaleString('ru-RU')} BYN</TableCell>
                                          <TableCell className="w-12 py-2">
                                              <Button size="icon" variant="ghost" onClick={() => removeFromCart(item.id)}>
                                                  <Trash2 className="h-4 w-4 text-destructive" />
                                              </Button>
                                          </TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                      </ScrollArea>
                  </div>

                  {/* Common Footer */}
                  <div className="flex-shrink-0 mt-auto p-4 sm:p-6 border-t border-white/20">
                      <div className='flex justify-between items-center gap-6'>
                          <div>
                              <Button variant="outline" className="bg-transparent border-white/50 text-white hover:bg-white/10" asChild>
                                  <Link href="/catalog">Продолжить покупки</Link>
                              </Button>
                          </div>
                          <div className="flex items-center gap-6">
                              <div className="text-right">
                                  <span className="text-gray-300">Итого:</span>
                                  <p className="font-bold text-2xl text-white">{total.toLocaleString('ru-RU')} BYN</p>
                              </div>
                              <Button onClick={handleCheckoutClick} size="lg" className="font-bold">
                                 Оформить заказ
                              </Button>
                          </div>
                      </div>
                  </div>
              </div>
          )}
      </div>

      <AlertDialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтверждение согласия</AlertDialogTitle>
            <AlertDialogDescription>
                Чтобы продолжить, пожалуйста, ознакомьтесь с условиями и подтвердите ваше согласие.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-start space-x-3 py-4">
            <Checkbox id="consent-checkbox" checked={isConsentGiven} onCheckedChange={(checked) => setIsConsentGiven(checked as boolean)} className="mt-1" />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="consent-checkbox" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Я даю согласие на обработку моих персональных данных и подтверждаю, что ознакомлен(а) с <Link href="/legal/privacy-policy" className="underline hover:text-primary" target="_blank">Политикой конфиденциальности</Link> и принимаю <Link href="/legal/terms-of-service" className="underline hover:text-primary" target="_blank">Условия использования</Link>.
              </Label>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCheckout} disabled={!isConsentGiven}>
              Оформить заказ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

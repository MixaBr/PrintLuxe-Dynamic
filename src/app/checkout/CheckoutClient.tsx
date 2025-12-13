
'use client';

import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/hooks/use-cart-store';
import { processOrder } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Package, ShoppingCart, User, Truck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Address } from '@/lib/definitions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CheckoutClientProps {
  user: {
    id: string;
    email?: string;
    profile?: {
      first_name?: string;
      last_name?: string;
      phone?: string;
    };
    addresses: Address[];
  } | null;
}

const initialState = {
  status: 'error' as 'error' | 'success',
  message: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full" size="lg">
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Подтвердить заказ
    </Button>
  );
}

export default function CheckoutClient({ user }: CheckoutClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { items, clearCart } = useCartStore();
  const [formState, formAction] = useFormState(processOrder, initialState);

  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  
  const total = items.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);

  useEffect(() => {
    if (formState.status === 'success' && formState.orderId) {
      toast({ title: 'Успех!', description: formState.message });
      clearCart();
      router.push(`/thank-you/${formState.orderId}`);
    } else if (formState.status === 'error' && formState.message) {
      toast({ variant: 'destructive', title: 'Ошибка', description: formState.message });
    }
  }, [formState, router, clearCart, toast]);

  const selectedAddress = user?.addresses.find(a => a.id.toString() === selectedAddressId);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form action={formAction} className="lg:col-span-2 space-y-6">
          <input type="hidden" name="cart_items" value={JSON.stringify(items.map(i => ({ product_id: i.id, quantity: i.quantity, price: i.price })))} />
          {/* Add more hidden fields for metadata */}
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User /> Контактная информация</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="first_name">Имя</Label>
                <Input id="first_name" name="first_name" defaultValue={user?.profile?.first_name || ''} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="last_name">Фамилия</Label>
                <Input id="last_name" name="last_name" defaultValue={user?.profile?.last_name || ''} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={user?.email || ''} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">Телефон</Label>
                <Input id="phone" name="phone" type="tel" defaultValue={user?.profile?.phone || ''} required />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Truck /> Доставка и оплата</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Шаг 1: Способ доставки</AccordionTrigger>
                  <AccordionContent>
                    <RadioGroup name="delivery_method" defaultValue="pickup" onValueChange={setDeliveryMethod}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pickup" id="pickup" />
                        <Label htmlFor="pickup">Самовывоз</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="delivery" id="delivery" />
                        <Label htmlFor="delivery">Доставка курьером (по Минску)</Label>
                      </div>
                    </RadioGroup>
                  </AccordionContent>
                </AccordionItem>
                {deliveryMethod === 'delivery' && (
                  <AccordionItem value="item-2">
                    <AccordionTrigger>Шаг 2: Адрес доставки</AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      {user && user.addresses.length > 0 && (
                        <div className="space-y-2">
                          <Label>Выбор адреса</Label>
                           <Select onValueChange={setSelectedAddressId} defaultValue="new">
                            <SelectTrigger>
                                <SelectValue placeholder="Выберите сохраненный адрес" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="new">-- Ввести новый адрес --</SelectItem>
                                {user.addresses.map(addr => (
                                    <SelectItem key={addr.id} value={addr.id.toString()}>
                                        {`${addr.city}, ${addr.street}, ${addr.building}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                           </Select>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><Label htmlFor="country">Страна</Label><Input name="country" defaultValue={selectedAddress?.country || 'Беларусь'} /></div>
                        <div><Label htmlFor="city">Город</Label><Input name="city" defaultValue={selectedAddress?.city || 'Минск'} /></div>
                        <div><Label htmlFor="street">Улица</Label><Input name="street" defaultValue={selectedAddress?.street || ''} /></div>
                        <div><Label htmlFor="postal_code">Индекс</Label><Input name="postal_code" defaultValue={selectedAddress?.postal_code || ''} /></div>
                        <div><Label htmlFor="building">Дом</Label><Input name="building" defaultValue={selectedAddress?.building || ''} /></div>
                        <div><Label htmlFor="housing">Корпус</Label><Input name="housing" defaultValue={selectedAddress?.housing || ''} /></div>
                        <div><Label htmlFor="apartment">Квартира</Label><Input name="apartment" defaultValue={selectedAddress?.apartment || ''} /></div>
                      </div>
                      <div><Label htmlFor="address_comment">Комментарий к адресу</Label><Textarea name="address_comment" /></div>
                    </AccordionContent>
                  </AccordionItem>
                )}
                <AccordionItem value="item-3">
                  <AccordionTrigger>Шаг 3: Способ оплаты</AccordionTrigger>
                  <AccordionContent>
                    <RadioGroup name="payment_method" defaultValue="cash">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cash" id="cash" />
                        <Label htmlFor="cash">Наличными / картой при получении</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="erip" id="erip" />
                        <Label htmlFor="erip">Система "Расчет" (ЕРИП)</Label>
                      </div>
                    </RadioGroup>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>Шаг 4: Комментарий к заказу</AccordionTrigger>
                  <AccordionContent>
                     <Textarea name="order_comment" placeholder="Ваши пожелания к заказу..." />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <SubmitButton />

        </form>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShoppingCart /> Ваш заказ</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {items.map(item => (
                  <li key={item.id} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-muted-foreground">x {item.quantity}</p>
                    </div>
                    <p>{((item.price || 0) * item.quantity).toLocaleString('ru-RU')} BYN</p>
                  </li>
                ))}
              </ul>
              <hr className="my-4"/>
              <div className="flex justify-between font-bold text-lg">
                <span>Итого:</span>
                <span>{total.toLocaleString('ru-RU')} BYN</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


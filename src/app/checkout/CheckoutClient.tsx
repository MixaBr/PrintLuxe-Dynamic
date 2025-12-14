
'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';

import { useCartStore } from '@/hooks/use-cart-store';
import { useToast } from '@/hooks/use-toast';
import { processOrder } from './actions';
import { refinedCheckoutFormSchema, CheckoutFormValues } from '@/lib/form-schema';
import type { Address } from '@/lib/definitions';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ShoppingCart, User, Truck } from 'lucide-react';

const initialState = { status: 'error' as const, message: '', orderId: undefined };

interface CheckoutClientProps {
  user: { id: string; email?: string; profile?: { first_name?: string; last_name?: string; phone?: string; }; addresses: Address[]; } | null;
}

function SubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Подтвердить заказ
    </Button>
  );
}

export default function CheckoutClient({ user }: CheckoutClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { items, clearCart } = useCartStore();
  const [formState, formAction] = useFormState(processOrder, initialState);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(refinedCheckoutFormSchema),
    defaultValues: {
      first_name: user?.profile?.first_name || '',
      last_name: user?.profile?.last_name || '',
      email: user?.email || '',
      phone: user?.profile?.phone || '',
      delivery_method: 'Самовывоз', // Default to a valid enum value
      payment_method: 'Наличный при получении', // Default to a valid enum value
      country: 'Беларусь',
      city: 'Минск',
      street: '',
      building: '',
      housing: '',
      apartment: '',
      postal_code: '',
      address_comment: '',
      order_comment: '',
    },
  });

  const { formState: { isSubmitting }, control, watch, setValue } = form;
  const deliveryMethod = watch('delivery_method');

  useEffect(() => {
    if (formState.status === 'success' && formState.orderId) {
      toast({ title: 'Успех!', description: formState.message });
      clearCart();
      router.push(`/thank-you/${formState.orderId}`);
    } else if (formState.status === 'error' && formState.message) {
      if (formState.errors) {
        Object.entries(formState.errors).forEach(([field, errors]) => {
          if (errors && errors.length > 0) {
            form.setError(field as keyof CheckoutFormValues, { type: 'server', message: errors[0] });
          }
        });
      }
      toast({ variant: 'destructive', title: 'Ошибка', description: formState.message });
    }
  }, [formState, router, clearCart, toast, form]);

  const handleAddressSelect = (addressId: string) => {
    if (addressId === 'new') {
        setValue('country', 'Беларусь');
        setValue('city', 'Минск');
        setValue('street', '');
        setValue('building', '');
        setValue('housing', '');
        setValue('apartment', '');
        setValue('postal_code', '');
    } else {
      const selectedAddr = user?.addresses.find(a => a.id.toString() === addressId);
      if (selectedAddr) {
        setValue('country', selectedAddr.country || 'Беларусь');
        setValue('city', selectedAddr.city || 'Минск');
        setValue('street', selectedAddr.street || '');
        setValue('building', selectedAddr.building || '');
        setValue('housing', selectedAddr.housing || '');
        setValue('apartment', selectedAddr.apartment || '');
        setValue('postal_code', selectedAddr.postal_code || '');
      }
    }
  };

  const onSubmit = (data: CheckoutFormValues) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, value.toString());
    });
    formData.append('cart_items', JSON.stringify(items.map(i => ({ product_id: i.id, quantity: i.quantity, price: i.price, name: i.name }))));
    formAction(formData);
  };

  const total = items.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><User />Контактная информация</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={control} name="first_name" render={({ field }) => (<FormItem><FormLabel>Имя</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="last_name" render={({ field }) => (<FormItem><FormLabel>Фамилия</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="phone" render={({ field }) => (<FormItem><FormLabel>Телефон</FormLabel><FormControl><Input type="tel" placeholder="+375 (XX) XXX-XX-XX" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Truck />Доставка и оплата</CardTitle></CardHeader>
              <CardContent>
                <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Шаг 1: Способ доставки</AccordionTrigger>
                    <AccordionContent>
                      <FormField control={control} name="delivery_method" render={({ field }) => (
                        <FormItem><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-2">
                          <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="Самовывоз" /></FormControl><FormLabel>Самовывоз</FormLabel></FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="Курьером по городу" /></FormControl><FormLabel>Курьером по городу</FormLabel></FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="СДЭК" /></FormControl><FormLabel>СДЭК</FormLabel></FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="Почта" /></FormControl><FormLabel>Почта</FormLabel></FormItem>
                        </RadioGroup></FormControl><FormMessage /></FormItem>)} />
                    </AccordionContent>
                  </AccordionItem>

                  {deliveryMethod === 'Курьером по городу' && (
                    <AccordionItem value="item-2">
                      <AccordionTrigger>Шаг 2: Адрес доставки</AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        {user && user.addresses.length > 0 && (
                            <div className="space-y-2">
                                <Label>Выбор адреса</Label>
                                <Select onValueChange={handleAddressSelect} defaultValue="new">
                                    <SelectTrigger><SelectValue placeholder="Выберите сохраненный адрес" /></SelectTrigger>
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
                            <FormField control={control} name="country" render={({ field }) => (<FormItem><FormLabel>Страна</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={control} name="city" render={({ field }) => (<FormItem><FormLabel>Город</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={control} name="street" render={({ field }) => (<FormItem><FormLabel>Улица</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                             <FormField control={control} name="postal_code" render={({ field }) => (<FormItem><FormLabel>Индекс</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={control} name="building" render={({ field }) => (<FormItem><FormLabel>Дом</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={control} name="housing" render={({ field }) => (<FormItem><FormLabel>Корпус</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={control} name="apartment" render={({ field }) => (<FormItem><FormLabel>Квартира</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <FormField control={control} name="address_comment" render={({ field }) => (<FormItem><FormLabel>Комментарий к адресу</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  <AccordionItem value="item-3">
                    <AccordionTrigger>Шаг 3: Способ оплаты</AccordionTrigger>
                    <AccordionContent>
                      <FormField control={control} name="payment_method" render={({ field }) => (
                        <FormItem><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-2">
                          <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="Наличный при получении" /></FormControl><FormLabel>Наличный при получении</FormLabel></FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="Картой при получении" /></FormControl><FormLabel>Картой при получении</FormLabel></FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="Оплата через ЕРИП" /></FormControl><FormLabel>Оплата через ЕРИП</FormLabel></FormItem>
                        </RadioGroup></FormControl><FormMessage /></FormItem>)} />
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-4">
                    <AccordionTrigger>Шаг 4: Комментарий к заказу</AccordionTrigger>
                    <AccordionContent>
                      <FormField control={control} name="order_comment" render={({ field }) => (<FormItem><FormControl><Textarea placeholder="Ваши пожелания к заказу..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            <SubmitButton isSubmitting={isSubmitting} />
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart />Ваш заказ</CardTitle></CardHeader>
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
                <hr className="my-4" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Итого:</span>
                  <span>{total.toLocaleString('ru-RU')} BYN</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  );
}

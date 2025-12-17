
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';

import { useCartStore } from '@/hooks/use-cart-store';
import { useToast } from '@/hooks/use-toast';
import { processOrder } from './actions';
import { refinedCheckoutFormSchema, CheckoutFormValues, deliveryMethods, paymentMethods } from '@/lib/form-schema';
import type { Address } from '@/lib/definitions';
import { cn } from '@/lib/utils';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ShoppingCart, User, Truck } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const initialState = { status: 'error' as const, message: '', orderId: undefined };

interface CheckoutClientProps {
  user: { id: string; email?: string; profile?: { first_name?: string; last_name?: string; phone?: string; }; addresses: Address[]; } | null;
  pickupAddress: string | null;
}

function SubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Подтвердить заказ
    </Button>
  );
}

export default function CheckoutClient({ user, pickupAddress }: CheckoutClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { items, clearCart } = useCartStore();
  const [formState, formAction] = useFormState(processOrder, initialState);

  const [selectedSavedAddress, setSelectedSavedAddress] = useState<Address | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(refinedCheckoutFormSchema),
    defaultValues: {
      first_name: user?.profile?.first_name || '',
      last_name: user?.profile?.last_name || '',
      email: user?.email || '',
      phone: user?.profile?.phone || '',
      delivery_method: undefined, 
      payment_method: undefined,
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

  const { formState: { isSubmitting }, control, watch, setValue, trigger } = form;
  const deliveryMethod = watch('delivery_method');
  const paymentMethod = watch('payment_method');
  const cardClasses = "bg-black/50 text-white border-white/20 backdrop-blur-sm";
  const inputClasses = "bg-white/10 border-white/20 text-white placeholder:text-white/50";

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

  useEffect(() => {
    // Reset address form when delivery method changes to a non-delivery one
    if (deliveryMethod === 'Самовывоз' || !deliveryMethod || deliveryMethod === 'Выберите способ...') {
        setShowNewAddressForm(false);
        setSelectedSavedAddress(null);
        setValue('street', '');
        setValue('building', '');
        setValue('housing', '');
        setValue('apartment', '');
        setValue('postal_code', '');
        setValue('city', 'Минск');
        setValue('country', 'Беларусь');
    }
    trigger();
  }, [deliveryMethod, setValue, trigger]);
  
  useEffect(() => {
    trigger();
  }, [paymentMethod, trigger]);

  // --- DEPENDENCY LOGIC ---
  const isPaymentMethodDisabled = (method: typeof paymentMethods[number]) => {
    if (!deliveryMethod || deliveryMethod === 'Выберите способ...') return false;

    if (deliveryMethod === 'Самовывоз') {
      return false; // All payment methods are enabled
    }
    
    if (deliveryMethod === 'Курьером по городу' || deliveryMethod === 'СДЭК' || deliveryMethod === 'Почта') {
      return method === 'Наличный при получении' || method === 'Картой при получении';
    }
    
    return false;
  };

  const isDeliveryMethodDisabled = (method: typeof deliveryMethods[number]) => {
    if (!paymentMethod || paymentMethod === 'Выберите способ...') return false;

    if (paymentMethod === 'Наличный при получении' || paymentMethod === 'Картой при получении') {
      return method !== 'Самовывоз';
    }

    if (paymentMethod === 'Оплата через ЕРИП') {
        return false; // Все способы доставки доступны
    }
    
    return false;
  };
  
  // --- END OF DEPENDENCY LOGIC ---

  const handleSelectSavedAddress = () => {
      if (selectedSavedAddress) {
          setValue('street', selectedSavedAddress.street || '');
          setValue('building', selectedSavedAddress.building || '');
          setValue('housing', selectedSavedAddress.housing || '');
          setValue('apartment', selectedSavedAddress.apartment || '');
          setValue('postal_code', selectedSavedAddress.postal_code || '');
          setValue('city', selectedSavedAddress.city || 'Минск');
          setValue('country', selectedSavedAddress.country || 'Беларусь');
          setShowNewAddressForm(true); 
          toast({ title: "Адрес выбран", description: "Данные адреса подставлены в форму."});
      }
  };

  const onSubmit = (data: CheckoutFormValues) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        if (value && value !== 'Выберите способ...') formData.append(key, value.toString());
    });
    formData.append('cart_items', JSON.stringify(items.map(i => ({ product_id: i.id, quantity: i.quantity, price: i.price, name: i.name }))));
    formAction(formData);
  };

  const total = items.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);

  const renderAddressSection = () => {
    if (!deliveryMethod || deliveryMethod === 'Выберите способ...') return null;

    if (deliveryMethod === 'Самовывоз') {
      return (
        <div className='mt-6'>
          <h3 className="font-semibold mb-2">Адрес самовывоза</h3>
          <p className="text-gray-300 bg-white/5 p-3 rounded-md">{pickupAddress || 'Адрес уточняется.'}</p>
        </div>
      );
    }
    
    const isDelivery = deliveryMethod === 'Курьером по городу' || deliveryMethod === 'СДЭК' || deliveryMethod === 'Почта';
    if (!isDelivery) return null;

    // Guest View
    if (!user) {
        return (
            <div className='mt-6 space-y-4'>
                <h3 className="font-semibold">Адрес доставки</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={control} name="country" render={({ field }) => (<FormItem><FormLabel>Страна</FormLabel><FormControl><Input {...field} className={inputClasses} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={control} name="city" render={({ field }) => (<FormItem><FormLabel>Город</FormLabel><FormControl><Input {...field} className={inputClasses} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={control} name="street" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Улица</FormLabel><FormControl><Input {...field} placeholder="Введите адрес" className={inputClasses} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={control} name="building" render={({ field }) => (<FormItem><FormLabel>Дом</FormLabel><FormControl><Input {...field} className={inputClasses} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={control} name="housing" render={({ field }) => (<FormItem><FormLabel>Корпус</FormLabel><FormControl><Input {...field} className={inputClasses} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={control} name="apartment" render={({ field }) => (<FormItem><FormLabel>Квартира</FormLabel><FormControl><Input {...field} className={inputClasses} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={control} name="postal_code" render={({ field }) => (<FormItem><FormLabel>Индекс</FormLabel><FormControl><Input {...field} className={inputClasses} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField control={control} name="address_comment" render={({ field }) => (<FormItem><FormLabel>Комментарий к адресу</FormLabel><FormControl><Textarea {...field} className={inputClasses} /></FormControl><FormMessage /></FormItem>)} />
            </div>
        );
    }
    
    // Authenticated User View
    return (
        <div className='mt-6 space-y-4'>
            <h3 className="font-semibold">Адрес доставки</h3>
            
            {user.addresses.length > 0 && !showNewAddressForm && (
                <div className='space-y-3'>
                    <p className="text-sm text-gray-300">Выберите сохраненный адрес или введите новый.</p>
                     <div className="h-48 w-full rounded-md border border-white/20 flex flex-col bg-white/5">
                        <ScrollArea className="flex-grow">
                            <div className="p-2 space-y-2">
                            {user.addresses.map(addr => (
                                <div 
                                    key={addr.id}
                                    onClick={() => setSelectedSavedAddress(addr)}
                                    className={cn(
                                        "p-3 rounded-md cursor-pointer transition-colors border",
                                        selectedSavedAddress?.id === addr.id 
                                            ? "bg-primary/20 border-primary" 
                                            : "bg-white/5 border-transparent hover:bg-white/10"
                                    )}
                                >
                                    <p className="font-medium text-sm">{`${addr.city}, ${addr.street}, ${addr.building}`}</p>
                                    <p className="text-xs text-gray-400">{`${addr.postal_code || ''}, ${addr.country || ''}`}</p>
                                </div>
                            ))}
                            </div>
                        </ScrollArea>
                    </div>
                    <div className='flex gap-2'>
                        <Button onClick={handleSelectSavedAddress} disabled={!selectedSavedAddress} className="flex-1">Выберите адрес</Button>
                        <Button onClick={() => setShowNewAddressForm(true)} variant="outline" className="flex-1">Ввести новый адрес</Button>
                    </div>
                </div>
            )}
            
            {(user.addresses.length === 0 || showNewAddressForm) && (
                 <div className="space-y-4">
                    {user.addresses.length > 0 && 
                        <Button variant="link" onClick={() => setShowNewAddressForm(false)} className="p-0 h-auto text-white">Назад к выбору адреса</Button>
                    }
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <FormField control={control} name="country" render={({ field }) => (<FormItem><FormLabel>Страна</FormLabel><FormControl><Input {...field} className={inputClasses} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={control} name="city" render={({ field }) => (<FormItem><FormLabel>Город</FormLabel><FormControl><Input {...field} className={inputClasses} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={control} name="street" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Улица</FormLabel><FormControl><Input {...field} placeholder="Введите адрес" className={inputClasses} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={control} name="building" render={({ field }) => (<FormItem><FormLabel>Дом</FormLabel><FormControl><Input {...field} className={inputClasses} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={control} name="housing" render={({ field }) => (<FormItem><FormLabel>Корпус</FormLabel><FormControl><Input {...field} className={inputClasses} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={control} name="apartment" render={({ field }) => (<FormItem><FormLabel>Квартира</FormLabel><FormControl><Input {...field} className={inputClasses} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={control} name="postal_code" render={({ field }) => (<FormItem><FormLabel>Индекс</FormLabel><FormControl><Input {...field} className={inputClasses} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                     <FormField control={control} name="address_comment" render={({ field }) => (<FormItem><FormLabel>Комментарий к адресу</FormLabel><FormControl><Textarea {...field} className={inputClasses} /></FormControl><FormMessage /></FormItem>)} />
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-white">Оформление заказа</h1>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className={cardClasses}>
              <CardHeader><CardTitle className="flex items-center gap-2"><User />Контактная информация</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={control} name="first_name" render={({ field }) => (<FormItem><FormLabel>Имя</FormLabel><FormControl><Input {...field} className={inputClasses} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="last_name" render={({ field }) => (<FormItem><FormLabel>Фамилия</FormLabel><FormControl><Input {...field} className={inputClasses} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} className={inputClasses} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="phone" render={({ field }) => (<FormItem><FormLabel>Телефон</FormLabel><FormControl><Input type="tel" placeholder="+375 (XX) XXX-XX-XX" {...field} className={inputClasses} /></FormControl><FormMessage /></FormItem>)} />
              </CardContent>
            </Card>

            <Card className={cardClasses}>
              <CardHeader><CardTitle className="flex items-center gap-2"><Truck />Доставка и оплата</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <FormField
                      control={control}
                      name="delivery_method"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Способ доставки</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || 'Выберите способ...'}>
                            <FormControl>
                              <SelectTrigger className={inputClasses}>
                                <SelectValue placeholder="Выберите способ..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                               <SelectItem value="Выберите способ...">Выберите способ...</SelectItem>
                               {deliveryMethods.map(method => (
                                <SelectItem key={method} value={method} disabled={isDeliveryMethodDisabled(method)}>
                                  {method}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="payment_method"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Способ оплаты</FormLabel>
                           <Select onValueChange={field.onChange} value={field.value || 'Выберите способ...'}>
                            <FormControl>
                              <SelectTrigger className={inputClasses}>
                                <SelectValue placeholder="Выберите способ..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                               <SelectItem value="Выберите способ...">Выберите способ...</SelectItem>
                               {paymentMethods.map(method => (
                                <SelectItem key={method} value={method} disabled={isPaymentMethodDisabled(method)}>
                                  {method}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                {renderAddressSection()}
                <div className="mt-6">
                    <FormField control={control} name="order_comment" render={({ field }) => (<FormItem><FormLabel>Комментарий к заказу</FormLabel><FormControl><Textarea placeholder="Ваши пожелания к заказу..." {...field} className={inputClasses} /></FormControl><FormMessage /></FormItem>)} />
                </div>
              </CardContent>
            </Card>

            <SubmitButton isSubmitting={isSubmitting} />
          </div>

          <div className="lg:col-span-1">
            <Card className={cn(cardClasses, "sticky top-24")}>
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
                <hr className="my-4 border-white/20" />
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

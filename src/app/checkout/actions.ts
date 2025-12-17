
'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { sendMail } from '@/lib/mail';
import { refinedCheckoutFormSchema } from '@/lib/form-schema';
import { cookies, headers } from 'next/headers';


type FormState = {
  status: 'error' | 'success';
  message: string;
  errors?: Record<string, string[] | undefined>;
  orderId?: number;
};

// ИСПРАВЛЕНИЕ: Определяем тип для объекта в корзине
type CartItem = {
  name: string;
  price: number;
  quantity: number;
  product_id: number;
};

export async function processOrder(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  
  const supabase = createClient();
  const rawData = Object.fromEntries(formData.entries());

  // Server-side check for placeholder values
  if (rawData.delivery_method === 'Выберите способ...') {
    return {
      status: 'error',
      message: 'Пожалуйста, выберите способ доставки.',
      errors: { delivery_method: ['Выберите способ доставки.'] }
    };
  }
  if (rawData.payment_method === 'Выберите способ...') {
    return {
      status: 'error',
      message: 'Пожалуйста, выберите способ оплаты.',
      errors: { payment_method: ['Выберите способ оплаты.'] }
    };
  }

  const validatedFields = refinedCheckoutFormSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      status: 'error',
      message: 'Пожалуйста, проверьте правильность введенных данных.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { data: validatedData } = validatedFields;
  const cartItemsString = formData.get('cart_items') as string;
  // ИСПРАВЛЕНИЕ: Указываем тип для массива корзины
  const cartItems: CartItem[] = JSON.parse(cartItemsString || '[]');

  if (cartItems.length === 0) {
    return { status: 'error', message: 'Ваша корзина пуста.' };
  }

  let newOrderId: number;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const headerList = headers();
    const cookieStore = cookies();

    const rpcParameters = {
        p_user_id: user?.id || null,
        p_guest_email: user ? null : validatedData.email,
        p_guest_first_name: user ? null : validatedData.first_name,
        p_guest_last_name: user ? null : validatedData.last_name,
        p_guest_phone: user ? null : validatedData.phone,
        p_delivery_method: validatedData.delivery_method,
        p_payment_method: validatedData.payment_method,
        p_delivery_address: validatedData.delivery_method === 'Курьером по городу' ? {
            raw: `${validatedData.country || ''}, ${validatedData.city || ''}, ${validatedData.street || ''}, ${validatedData.building || ''}`,
            structured: {
                country: validatedData.country,
                city: validatedData.city,
                street: validatedData.street,
                building: validatedData.building,
                housing: validatedData.housing,
                apartment: validatedData.apartment,
                postal_code: validatedData.postal_code,
            },
            comment: validatedData.address_comment
        } : null,
        p_metadata: {
            order_comment: validatedData.order_comment,
            user_agent: headerList.get('user-agent'),
            source_url: headerList.get('referer'),
            cookie_id: cookieStore.get('_ga')?.value
        },
        p_order_items: cartItems
    };

    const { data: orderData, error: rpcError } = await supabase.rpc('create_order_and_details', rpcParameters);

    if (rpcError) {
      console.error('RPC Error:', rpcError);
      return { status: 'error', message: `Ошибка при создании заказа: ${rpcError.message}` };
    }

    newOrderId = orderData;

    // --- БЛОК ОТПРАВКИ ПИСЕМ ---
    try {
      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'contact_email_main')
        .single();

      if (settingsError) {
        console.error("Ошибка при получении email менеджера:", settingsError);
      }

      const managerEmail = settingsData?.value;
      const customerEmail = user ? user.email : validatedData.email;
      const customerName = user ? (user.user_metadata?.first_name || '') : validatedData.first_name;

      if (customerEmail) {
        await sendMail({
          to: customerEmail,
          subject: `Заказ #${newOrderId} успешно оформлен!`,
          html: `<h1>Здравствуйте, ${customerName}!</h1>
                 <p>Ваш заказ с номером <strong>${newOrderId}</strong> в нашем магазине успешно оформлен.</p>
                 <p>Мы свяжемся с вами в ближайшее время для подтверждения деталей.</p>
                 <p>Спасибо за покупку!</p>`,
        });
      }

      if (managerEmail) {
        // Теперь эта строка не вызовет ошибки
        const totalAmount = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const orderSummary = `
          <h1>Поступил новый заказ #${newOrderId}</h1>
          <h2>Данные клиента:</h2>
          <ul>
            <li>Имя: ${validatedData.first_name} ${validatedData.last_name}</li>
            <li>Email: ${validatedData.email}</li>
            <li>Телефон: ${validatedData.phone}</li>
          </ul>
          <h2>Состав заказа:</h2>
          <ul>
            ${cartItems.map(item => `<li>${item.name} - ${item.quantity} шт. x ${item.price} руб.</li>`).join('')}
          </ul>
          <h3>Сумма по товарам: ${totalAmount} руб.</h3>
          <h2>Доставка и оплата:</h2>
          <ul>
            <li>Способ доставки: ${validatedData.delivery_method}</li>
            <li>Адрес: ${validatedData.delivery_method === 'Курьером по городу' ? `${validatedData.country || ''}, ${validatedData.city || ''}, ${validatedData.street || ''}, ${validatedData.building || ''}` : 'Самовывоз'}</li>
            <li>Комментарий к адресу: ${validatedData.address_comment || 'Нет'}</li>
            <li>Способ оплаты: ${validatedData.payment_method}</li>
          </ul>
          <h2>Комментарий к заказу:</h2>
          <p>${validatedData.order_comment || 'Нет'}</p>
        `;

        await sendMail({
          to: managerEmail,
          subject: `Новый заказ #${newOrderId} от ${validatedData.first_name}`,
          html: orderSummary,
        });
      }
    } catch (emailError) {
      console.error(`Заказ #${newOrderId} создан, но произошла ошибка при отправке email:`, emailError);
    }
    // --- КОНЕЦ БЛОКА ---

  } catch (err: any) {
    console.error('Checkout Error:', err);
    return { status: 'error', message: 'Произошла непредвиденная ошибка на сервере.' };
  }
  
  return { status: 'success', message: 'Заказ успешно оформлен!', orderId: newOrderId };
}

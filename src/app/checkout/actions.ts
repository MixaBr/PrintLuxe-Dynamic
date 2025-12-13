
'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { sendMail } from '@/lib/mail';

const formSchema = z.object({
  first_name: z.string().min(2, 'Имя обязательно'),
  last_name: z.string().min(2, 'Фамилия обязательна'),
  email: z.string().email('Неверный формат email'),
  phone: z.string().min(9, 'Телефон обязателен'),
  delivery_method: z.enum(['pickup', 'delivery']),
  payment_method: z.enum(['cash', 'erip']),
  order_comment: z.string().optional(),

  // Address fields (optional based on delivery_method)
  country: z.string().optional(),
  city: z.string().optional(),
  street: z.string().optional(),
  building: z.string().optional(),
  housing: z.string().optional(),
  apartment: z.string().optional(),
  postal_code: z.string().optional(),
  address_comment: z.string().optional(),
  
  // Metadata
  user_agent: z.string().optional(),
  utm_params: z.string().optional(),
  source_url: z.string().optional(),
  cookie_id: z.string().optional(),

  // Cart Data
  cart_items: z.string(), // JSON string of cart items
});

type FormState = {
  status: 'error' | 'success';
  message: string;
  errors?: Record<string, string[] | undefined>;
  orderId?: number;
};

export async function processOrder(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  
  const supabase = createClient();
  const rawData = Object.fromEntries(formData.entries());

  // Clean the phone number from mask characters before validation
  if (typeof rawData.phone === 'string') {
    rawData.phone = rawData.phone.replace(/[^\d]/g, '');
  }

  const validatedFields = formSchema.safeParse(rawData);

  if (!validatedFields.success) {
    // --- START DIAGNOSTIC LOGGING ---
    console.log("Validation failed. Raw data:", rawData);
    console.log("Validation errors:", validatedFields.error.flatten().fieldErrors);
    // --- END DIAGNOSTIC LOGGING ---
    return {
      status: 'error',
      message: 'Пожалуйста, проверьте правильность введенных данных.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { data: validatedData } = validatedFields;

  if (validatedData.delivery_method === 'delivery' && !validatedData.street) {
    return {
      status: 'error',
      message: 'Адрес доставки обязателен при выборе доставки курьером.',
      errors: { street: ['Улица обязательна для доставки'] },
    };
  }
  let newOrderId: number;
  // Use a database function (RPC) to handle the transaction
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const cartItems = JSON.parse(validatedData.cart_items);
    if (!cartItems || cartItems.length === 0) {
        return { status: 'error', message: 'Ваша корзина пуста.' };
    }

    const { data: orderData, error: rpcError } = await supabase.rpc('create_order_and_details', {
        // user/guest info
        p_user_id: user?.id || null,
        p_guest_email: user ? null : validatedData.email,
        p_guest_first_name: user ? null : validatedData.first_name,
        p_guest_last_name: user ? null : validatedData.last_name,
        p_guest_phone: user ? null : validatedData.phone,
        
        // order info
        p_delivery_method: validatedData.delivery_method,
        p_payment_method: validatedData.payment_method,

        // address info (as a single JSONB object)
        p_delivery_address: validatedData.delivery_method === 'delivery' ? {
            raw: `${validatedData.country || ''}, ${validatedData.city || ''}, ${validatedData.street || ''}, ${validatedData.building || ''}${validatedData.housing ? ', к.'+validatedData.housing : ''}${validatedData.apartment ? ', кв.'+validatedData.apartment : ''}`,
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
        
        // metadata (as a single JSONB object)
        p_metadata: {
            order_comment: validatedData.order_comment,
            user_agent: validatedData.user_agent,
            utm_params: validatedData.utm_params,
            source_url: validatedData.source_url,
            cookie_id: validatedData.cookie_id
        },
        
        // cart items
        p_order_items: cartItems
    });

    if (rpcError) {
      console.error('RPC Error:', rpcError);
      return { status: 'error', message: `Ошибка при создании заказа: ${rpcError.message}` };
    }

    newOrderId = orderData;
    
    // Send email notifications
    const orderDetailsForEmail = cartItems.map((item: any) => `<li>${item.name} (x${item.quantity}) - ${(item.price * item.quantity).toFixed(2)} BYN</li>`).join('');
    const totalAmount = cartItems.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0);

    // To Client
    await sendMail({
      to: validatedData.email,
      subject: `Ваш заказ №${newOrderId} принят`,
      html: `
        <h1>Здравствуйте, ${validatedData.first_name}!</h1>
        <p>Ваш заказ №${newOrderId} успешно принят в обработку.</p>
        <h3>Состав заказа:</h3>
        <ul>${orderDetailsForEmail}</ul>
        <p><strong>Итого: ${totalAmount.toFixed(2)} BYN</strong></p>
        <p>Мы свяжемся с вами в ближайшее время для подтверждения деталей.</p>
        <p>С уважением, команда PrintLux.</p>
      `
    });

    // To Manager
    await sendMail({
      to: process.env.ORDER_NOTIFICATION_EMAIL || (process.env.SMTP_TO as string),
      subject: `Новый заказ №${newOrderId}`,
      html: `
        <h1>Получен новый заказ №${newOrderId}</h1>
        <p><strong>Клиент:</strong> ${validatedData.first_name} ${validatedData.last_name}</p>
        <p><strong>Email:</strong> ${validatedData.email}</p>
        <p><strong>Телефон:</strong> ${validatedData.phone}</p>
        <hr>
        <h3>Детали заказа:</h3>
        <ul>${orderDetailsForEmail}</ul>
        <p><strong>Итого: ${totalAmount.toFixed(2)} BYN</strong></p>
        <hr>
        <p><strong>Способ доставки:</strong> ${validatedData.delivery_method === 'delivery' ? 'Доставка курьером' : 'Самовывоз'}</p>
        <p><strong>Способ оплаты:</strong> ${validatedData.payment_method === 'cash' ? 'Наличные/Карта при получении' : 'ЕРИП'}</p>
        ${validatedData.order_comment ? `<p><strong>Комментарий к заказу:</strong> ${validatedData.order_comment}</p>` : ''}
      `
    });

  } catch (err: any) {
    console.error('Checkout Error:', err);
    return { status: 'error', message: 'Произошла непредвиденная ошибка на сервере.' };
  }
  
  // On success, redirect to a thank you page
  // The redirection will be handled on the client-side based on the returned state.
  return { status: 'success', message: 'Заказ успешно оформлен!', orderId: newOrderId };
}

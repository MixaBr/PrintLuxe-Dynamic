
'use server';

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Определяем типы для заказов и их содержимого
export type OrderItem = {
  id: number;
  order_id: number;
  product_id: string;
  quantity: number;
  price: number;
  product_name: string;
};

export type OrderWithItems = {
  id: number;
  created_at: string;
  user_id: string;
  status: 'Новый' | 'В обработке' | 'В пути' | 'Доставлен' | 'Отменен';
  total_amount: number;
  items: OrderItem[];
};

/**
 * Fetches all orders for the currently authenticated user, along with their items.
 * @returns A promise that resolves to an object containing the user's orders or an error.
 */
export async function getUserOrders(): Promise<{ orders: OrderWithItems[], error: string | null }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Эта проверка на случай, если до страницы дошли без аутентификации
    return { orders: [], error: 'Пользователь не авторизован.' };
  }

  try {
    // 1. Получаем все заказы пользователя
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id, created_at, user_id, status, total_amount')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching user orders:', ordersError);
      throw new Error('Не удалось загрузить историю заказов.');
    }

    if (!ordersData || ordersData.length === 0) {
      return { orders: [], error: null };
    }

    const orderIds = ordersData.map(o => o.id);

    // 2. Получаем все товары для всех найденных заказов одним запросом
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('id, order_id, product_id, quantity, price, product_name')
      .in('order_id', orderIds);

    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
      throw new Error('Не удалось загрузить детализацию заказов.');
    }

    // 3. Группируем товары по ID заказа для удобного маппинга
    const itemsByOrderId = itemsData.reduce<Record<number, OrderItem[]>>((acc, item) => {
      if (!acc[item.order_id]) {
        acc[item.order_id] = [];
      }
      acc[item.order_id].push(item as OrderItem);
      return acc;
    }, {});

    // 4. Собираем финальный массив заказов с их товарами
    const ordersWithItems: OrderWithItems[] = ordersData.map(order => ({
      ...order,
      total_amount: order.total_amount || 0,
      status: order.status || 'Новый',
      items: itemsByOrderId[order.id] || [],
    }));

    return { orders: ordersWithItems, error: null };

  } catch (err: any) {
    return { orders: [], error: err.message || 'Произошла непредвиденная ошибка.' };
  }
}


'use server';

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Определяем типы для заказов и их содержимого
export type OrderItem = {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  name: string;
};

export type OrderWithItems = {
  id: number;
  order_date: string;
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
    return { orders: [], error: 'Пользователь не авторизован.' };
  }

  try {
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_date, user_id, status, total_amount')
      .eq('user_id', user.id)
      .order('order_date', { ascending: false });

    if (ordersError) {
      console.error('Error fetching user orders:', ordersError);
      return { orders: [], error: `Ошибка при загрузке заказов: ${ordersError.message}` };
    }
    
    if (!ordersData || ordersData.length === 0) {
      return { orders: [], error: null };
    }

    const orderIds = ordersData.map(o => o.id);

    const { data: itemsData, error: itemsError } = await supabase
      .from('order_details')
      .select('id, order_id, product_id, quantity, price, name:product_name')
      .in('order_id', orderIds);

    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
      return { orders: [], error: `Ошибка при загрузке состава заказов: ${itemsError.message}` };
    }

    const itemsByOrderId = itemsData.reduce<Record<number, OrderItem[]>>((acc, item) => {
      if (!acc[item.order_id]) {
        acc[item.order_id] = [];
      }
      acc[item.order_id].push(item as OrderItem);
      return acc;
    }, {});

    const ordersWithItems: OrderWithItems[] = ordersData.map(order => ({
      ...order,
      order_date: order.order_date,
      total_amount: order.total_amount || 0,
      status: order.status || 'Новый',
      items: itemsByOrderId[order.id] || [],
    }));

    return { orders: ordersWithItems, error: null };

  } catch (err: any) {
    return { orders: [], error: err.message || 'Произошла непредвиденная ошибка.' };
  }
}

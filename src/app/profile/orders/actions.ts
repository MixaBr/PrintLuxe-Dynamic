
'use server';

import { createClient } from "@/lib/supabase/server";

export type OrderItem = {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  product_name: string;
};

export type OrderWithItems = {
  id: number;
  order_date: string;
  user_id: string;
  status: string;
  total_amount: number;
  items: OrderItem[];
  invoice_created: boolean;
  tracking_number: string | null;
};

export async function getUserOrders(): Promise<{ orders: OrderWithItems[], error: string | null }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { orders: [], error: 'Пользователь не авторизован.' };
  }

  try {
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_date, user_id, status, total_amount, invoice_created, tracking_number')
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
      .select('id, order_id, product_id, quantity, price')
      .in('order_id', orderIds);

    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
      return { orders: [], error: `Ошибка при загрузке детализации заказов: ${itemsError.message}` };
    }

    if (!itemsData || itemsData.length === 0) {
        const ordersWithEmptyItems: OrderWithItems[] = ordersData.map(order => ({
            ...order,
            order_date: order.order_date,
            total_amount: order.total_amount || 0,
            status: order.status || 'Новый',
            items: [],
            invoice_created: order.invoice_created ?? false,
            tracking_number: order.tracking_number,
        }));
        return { orders: ordersWithEmptyItems, error: null };
    }

    const productIds = [...new Set(itemsData.map(item => item.product_id))];
    const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name')
        .in('id', productIds);

    if (productsError) {
        console.error('Error fetching product names:', productsError);
        return { orders: [], error: `Ошибка при загрузке названий товаров: ${productsError.message}` };
    }

    const productNamesMap = new Map(productsData.map(p => [p.id, p.name]));

    const itemsByOrderId = itemsData.reduce<Record<number, OrderItem[]>>((acc, item) => {
      if (!acc[item.order_id]) {
        acc[item.order_id] = [];
      }
      acc[item.order_id].push({
        id: item.id,
        order_id: item.order_id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        product_name: productNamesMap.get(item.product_id) || `[Товар удален, ID: ${item.product_id}]`
      });
      return acc;
    }, {});

    const ordersWithItems: OrderWithItems[] = ordersData.map(order => ({
      ...order,
      order_date: order.order_date,
      total_amount: order.total_amount || 0,
      status: order.status || 'Новый',
      items: itemsByOrderId[order.id] || [],
      invoice_created: order.invoice_created ?? false,
      tracking_number: order.tracking_number,
    }));

    return { orders: ordersWithItems, error: null };

  } catch (err: any) {
    return { orders: [], error: err.message || 'Произошла непредвиденная ошибка.' };
  }
}

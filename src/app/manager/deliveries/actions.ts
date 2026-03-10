
'use server';

import { createAdminClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type Delivery = {
    id: number;
    order_date: string;
    customer_name: string;
    customer_phone: string;
    delivery_address: string;
    delivery_method: string;
    status: string;
    tracking_number: string | null;
};

// Fetches all deliveries that are not yet completed
export async function getDeliveries(): Promise<{ deliveries: Delivery[], error: string | null }> {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('orders')
            .select(`
                id,
                order_date,
                delivery_method,
                status,
                tracking_number,
                delivery_address,
                profiles ( first_name, last_name, phone ),
                guest_first_name,
                guest_last_name,
                guest_phone
            `)
            .not('delivery_method', 'eq', 'Самовывоз')
            .in('status', ['Ждет доставки', 'В пути'])
            .order('order_date', { ascending: true }); // Oldest first

        if (error) throw error;
        
        const deliveries: Delivery[] = data.map(d => {
            const isGuest = !d.profiles;
            const address = (d.delivery_address as any)?.raw || 'Адрес не указан';

            return {
                id: d.id,
                order_date: d.order_date,
                customer_name: isGuest ? `${d.guest_first_name} ${d.guest_last_name}` : `${d.profiles?.first_name} ${d.profiles?.last_name}`,
                customer_phone: isGuest ? d.guest_phone : d.profiles?.phone,
                delivery_address: address,
                delivery_method: d.delivery_method,
                status: d.status,
                tracking_number: d.tracking_number,
            }
        });

        return { deliveries, error: null };

    } catch (e: any) {
        console.error("Error fetching deliveries:", e);
        return { deliveries: [], error: 'Не удалось загрузить список доставок.' };
    }
}

// Updates the delivery status and tracking number of an order
export async function updateDeliveryStatus(formData: FormData): Promise<{ success: boolean; message: string }> {
    const orderId = formData.get('orderId');
    const newStatus = formData.get('status') as string;
    const trackingNumber = formData.get('tracking_number') as string | null;
    const notes = formData.get('notes') as string | null;

    if (!orderId || !newStatus) {
        return { success: false, message: 'Отсутствуют необходимые данные (ID заказа или статус).' };
    }
    
    const supabase = createAdminClient();
    const { data: { user } } = await createClient().auth.getUser();

    if (!user) {
        return { success: false, message: 'Доступ запрещен.' };
    }

    try {
        // 1. Update the order itself
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                status: newStatus,
                tracking_number: trackingNumber,
            })
            .eq('id', orderId);
        
        if (updateError) throw updateError;
        
        // 2. Log this change to the tracking history table
        const { error: logError } = await supabase
            .from('delivery_tracking')
            .insert({
                order_id: Number(orderId),
                status: newStatus,
                tracking_number: trackingNumber,
                notes: notes,
                updated_by_user_id: user.id
            });
            
        if (logError) {
             console.error(`CRITICAL: Order ${orderId} status updated, but failed to log history. Error:`, logError.message);
        }
        
        revalidatePath('/manager/deliveries');
        revalidatePath('/profile/orders');

        return { success: true, message: `Статус заказа #${orderId} успешно обновлен на "${newStatus}".` };

    } catch (e: any) {
        console.error("Error updating delivery status:", e);
        return { success: false, message: e.message };
    }
}

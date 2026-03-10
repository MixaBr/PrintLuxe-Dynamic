
'use server';

import { createAdminClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendMail } from '@/lib/mail';

export type Delivery = {
    id: number;
    order_date: string;
    customer_name: string;
    customer_phone: string;
    delivery_address: string;
    delivery_method: string;
    status: string;
    tracking_number: string | null;
    guest_email: string | null;
};

// Fetches all deliveries that are not yet completed or cancelled
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
                guest_email,
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
                customer_name: isGuest ? `${d.guest_first_name || ''} ${d.guest_last_name || ''}`.trim() : `${d.profiles?.first_name || ''} ${d.profiles?.last_name || ''}`.trim(),
                customer_phone: isGuest ? d.guest_phone || 'Не указан' : d.profiles?.phone || 'Не указан',
                delivery_address: address,
                delivery_method: d.delivery_method,
                status: d.status,
                tracking_number: d.tracking_number,
                guest_email: d.guest_email,
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
    
    const supabaseAdmin = createAdminClient();
    const { data: { user } } = await createClient().auth.getUser();

    if (!user) {
        return { success: false, message: 'Доступ запрещен.' };
    }

    try {
        const { data: orderData, error: fetchError } = await supabaseAdmin.from('orders').select('guest_email').eq('id', orderId).single();
        if (fetchError) throw new Error(`Не удалось найти заказ #${orderId} для обновления.`);

        // 1. Update the order itself
        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update({
                status: newStatus,
                tracking_number: trackingNumber,
            })
            .eq('id', orderId);
        
        if (updateError) throw updateError;
        
        // 2. Log this change to the tracking history table
        const { error: logError } = await supabaseAdmin
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

        // 3. Send notification to guest if applicable
        if (orderData.guest_email) {
            try {
                let emailSubject = '';
                let emailBody = '';

                if (newStatus === 'В пути') {
                    emailSubject = `Ваш заказ №${orderId} отправлен!`;
                    emailBody = `<p>Здравствуйте! Ваш заказ был передан в службу доставки.</p>
                               <p>Вы можете отследить его по трек-номеру: <strong><a href="https://www.google.com/search?q=${trackingNumber}">${trackingNumber}</a></strong></p>`;
                } else if (newStatus === 'Доставлен') {
                     emailSubject = `Ваш заказ №${orderId} доставлен!`;
                     emailBody = `<p>Здравствуйте! Ваш заказ успешно доставлен. Спасибо за покупку!</p>`;
                } else if (newStatus === 'Готов к самовывозу') {
                     emailSubject = `Ваш заказ №${orderId} готов к выдаче!`;
                     emailBody = `<p>Здравствуйте! Ваш заказ готов к выдаче в нашем пункте самовывоза. Не забудьте назвать номер заказа при получении.</p>`;
                }

                if (emailSubject && emailBody) {
                    await sendMail({
                        to: orderData.guest_email,
                        subject: emailSubject,
                        html: emailBody,
                    });
                }
            } catch (emailError: any) {
                console.error(`Status for order ${orderId} updated, but failed to send email to guest. Error:`, emailError.message);
            }
        }
        
        revalidatePath('/manager/deliveries');
        revalidatePath('/profile/orders');

        return { success: true, message: `Статус заказа #${orderId} успешно обновлен на "${newStatus}".` };

    } catch (e: any) {
        console.error("Error updating delivery status:", e);
        return { success: false, message: e.message };
    }
}

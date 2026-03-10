
'use server';

import { createAdminClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { sendMail } from "@/lib/mail";

type FormState = {
    message: string;
    status: 'idle' | 'success' | 'error';
};

export async function createInvoiceForOrder(prevState: FormState, formData: FormData): Promise<FormState> {
    const orderId = formData.get('order_id');
    const invoiceNumber = formData.get('invoice_number') as string || null;

    if (!orderId) {
        return { status: 'error', message: 'Необходимо выбрать заказ.' };
    }

    const supabase = createAdminClient();

    try {
        // 1. Fetch order details
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('user_id, total_amount')
            .eq('id', orderId)
            .single();

        if (orderError || !orderData) {
            throw new Error(`Не удалось найти заказ #${orderId}: ${orderError?.message}`);
        }

        // 2. Create invoice with "home position" values
        const { data: invoiceData, error: invoiceError } = await supabase
            .from('invoices')
            .insert({
                order_id: Number(orderId),
                user_id: orderData.user_id,
                invoice_number: invoiceNumber,
                invoice_amount: orderData.total_amount,
                payment_amount: 0,
                debt: 0, // Per user logic, debt starts at 0
                status: 'Не оплачен',
                invoice_date: new Date().toISOString()
            })
            .select('id')
            .single();

        if (invoiceError || !invoiceData) {
            throw new Error(`Не удалось создать счет: ${invoiceError?.message}`);
        }

        // 3. Update the order to mark that an invoice has been created
        const { error: updateOrderError } = await supabase
            .from('orders')
            .update({ invoice_created: true })
            .eq('id', orderId);

        if (updateOrderError) {
            console.error(`CRITICAL: Invoice ${invoiceData.id} created, but failed to mark order ${orderId} as invoiced. Error: ${updateOrderError.message}`);
            throw new Error('Счет создан, но не удалось обновить статус заказа.');
        }

        // 4. Send email to guest if applicable
        try {
            const { data: orderDetails, error: orderDetailsError } = await supabase
                .from('orders')
                .select(`
                    delivery_method,
                    user_id,
                    guest_email,
                    order_details (
                        quantity,
                        price,
                        products ( name )
                    )
                `)
                .eq('id', orderId)
                .single();
            
            if (orderDetailsError) throw orderDetailsError;

            // IF GUEST AND NOT PICKUP, SEND ERIP INSTRUCTIONS
            if (orderDetails.user_id === null && orderDetails.guest_email && orderDetails.delivery_method !== 'Самовывоз') {
                const itemsHtml = orderDetails.order_details.map((item: any) => `<li>${item.products?.name} - ${item.quantity} шт. x ${item.price} руб.</li>`).join('');

                const { data: eripInstructionsData, error: eripError } = await supabase
                    .from('app_config')
                    .select('value')
                    .eq('key', 'bot_erip_instructions')
                    .single();

                if (eripError) console.error("Could not fetch ERIP instructions:", eripError);
                const eripInstructions = eripInstructionsData?.value || 'Инструкции по оплате будут предоставлены дополнительно.';

                await sendMail({
                    to: orderDetails.guest_email,
                    subject: `Счет #${invoiceNumber || invoiceData.id} для вашего заказа №${orderId}`,
                    html: `<h1>Счет для вашего заказа</h1>
                           <p>Здравствуйте! Для вашего заказа №${orderId} был сформирован счет №${invoiceNumber || invoiceData.id}.</p>
                           <h2>Состав заказа:</h2>
                           <ul>${itemsHtml}</ul>
                           <hr>
                           <h2>Инструкции по оплате через ЕРИП:</h2>
                           <div>${eripInstructions}</div>`
                });
            }
        } catch (emailError: any) {
            console.error(`Invoice ${invoiceData.id} created, but failed to send email notification. Error: ${emailError.message}`);
        }
        
        revalidatePath('/manager/sales');
        revalidatePath('/profile/orders');
        revalidatePath('/profile/invoices');

        return { status: 'success', message: `Счет #${invoiceData.id} для заказа #${orderId} успешно создан.` };
    } catch (e: any) {
        console.error('Error in createInvoiceForOrder:', e);
        return { status: 'error', message: e.message };
    }
}


export async function registerPayment(prevState: FormState, formData: FormData): Promise<FormState> {
    const invoiceId = formData.get('invoice_id');
    const paymentSum = parseFloat(formData.get('payment_sum') as string);
    const paymentDate = formData.get('payment_date') as string;
    const paymentMethod = formData.get('payment_method') as string;

    if (!invoiceId || isNaN(paymentSum) || !paymentDate || !paymentMethod) {
        return { status: 'error', message: 'Все поля обязательны для заполнения.' };
    }
    
    if (paymentSum <= 0) {
        return { status: 'error', message: 'Сумма оплаты должна быть положительной.' };
    }
    
    const supabaseAdmin = createAdminClient();

    try {
        const { error: paymentInsertError } = await supabaseAdmin
            .from('payments')
            .insert({
                invoice_id: Number(invoiceId),
                payment_date: paymentDate,
                payment_amount: paymentSum,
                payment_method: paymentMethod,
                payment_status: 'completed'
            });

        if (paymentInsertError) {
            throw new Error(`Не удалось записать платеж: ${paymentInsertError.message}`);
        }

        const { data: invoice, error: invoiceError } = await supabaseAdmin
            .from('invoices')
            .select('*, orders(user_id, delivery_method, guest_email)')
            .eq('id', invoiceId)
            .single();

        if (invoiceError || !invoice) {
            throw new Error(`Счет #${invoiceId} не найден.`);
        }
        
        const userId = invoice.orders?.user_id;
        
        const newPaymentAmount = (invoice.payment_amount || 0) + paymentSum;
        const newDebt = newPaymentAmount - (invoice.invoice_amount || 0);

        let newStatus: 'Не оплачен' | 'Частично оплачен' | 'Оплачен' = 'Не оплачен';
        if (newDebt >= 0) {
            newStatus = 'Оплачен';
        } else if (newDebt < 0 && newPaymentAmount > 0) {
            newStatus = 'Частично оплачен';
        }

        const { error: updateInvoiceError } = await supabaseAdmin
            .from('invoices')
            .update({
                payment_amount: newPaymentAmount,
                debt: newDebt,
                status: newStatus,
            })
            .eq('id', invoiceId);
        
        if (updateInvoiceError) {
            throw new Error(`Ошибка при обновлении счета: ${updateInvoiceError.message}`);
        }

        if (userId && newDebt > 0) {
            const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('balance').eq('user_id', userId).single();
            if (profileError || !profile) throw new Error(`Профиль для пользователя ${userId} не найден.`);

            const newBalance = (profile.balance || 0) + newDebt;
            const { error: updateProfileError } = await supabaseAdmin.from('profiles').update({ balance: newBalance }).eq('user_id', userId);
            
            if (updateProfileError) {
                 console.error(`CRITICAL: Overpayment processed for invoice ${invoiceId}, but failed to update user ${userId} balance. Error: ${updateProfileError.message}`);
                 throw new Error('Счет обновлен, но не удалось обновить баланс пользователя.');
            }
        }
        
        if (newStatus === 'Оплачен') {
            const deliveryMethod = invoice.orders?.delivery_method;
            let orderUpdateData: { status: string } | null = null;
            
            if (deliveryMethod === 'Самовывоз') {
                orderUpdateData = { status: 'Готов к самовывозу' };
            } else if (deliveryMethod) {
                orderUpdateData = { status: 'Ждет доставки' };
            }

            if (orderUpdateData) {
                const { error: orderUpdateError } = await supabaseAdmin
                    .from('orders')
                    .update(orderUpdateData)
                    .eq('id', invoice.order_id);
                
                if (orderUpdateError) {
                    console.error(`CRITICAL: Payment for order ${invoice.order_id} processed, but failed to update order status to "${orderUpdateData.status}". Error: ${orderUpdateError.message}`);
                }
                
                // Send email to guest if status is "Готов к самовывозу"
                if (orderUpdateData.status === 'Готов к самовывозу' && !invoice.orders?.user_id && invoice.orders?.guest_email) {
                    const {data: pickupAddressData} = await supabaseAdmin.from('settings').select('value').eq('key', 'pickup_address').single();

                    await sendMail({
                        to: invoice.orders.guest_email,
                        subject: `Ваш заказ №${invoice.order_id} готов к выдаче`,
                        html: `<p>Здравствуйте! Ваш заказ №${invoice.order_id} собран и готов к выдаче.</p>
                               <p>Забрать его можно по адресу: <strong>${pickupAddressData?.value || 'Адрес уточняется'}</strong></p>
                               <p>При получении, пожалуйста, назовите номер заказа или счета: <strong>${invoice.invoice_number || `#${invoice.id}`}</strong>.</p>`
                    });
                }
            }
        }

        revalidatePath('/manager/sales');
        revalidatePath('/manager/deliveries');
        revalidatePath('/profile/invoices');
        revalidatePath('/profile/orders');
        revalidatePath('/profile');
        
        return { status: 'success', message: `Оплата по счету #${invoiceId} на сумму ${paymentSum} BYN успешно зарегистрирована.` };

    } catch (e: any) {
        console.error('Error in registerPayment:', e);
        return { status: 'error', message: e.message };
    }
}

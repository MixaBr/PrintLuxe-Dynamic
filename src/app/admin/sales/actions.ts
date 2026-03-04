
'use server';

import { createAdminClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

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
            // This is not ideal, we should roll back the invoice creation.
            // For now, we log the error. A transaction/RPC would be better.
            console.error(`CRITICAL: Invoice ${invoiceData.id} created, but failed to mark order ${orderId} as invoiced. Error: ${updateOrderError.message}`);
            throw new Error('Счет создан, но не удалось обновить статус заказа.');
        }
        
        revalidatePath('/admin/sales');
        revalidatePath('/profile/orders');

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

    if (!invoiceId || isNaN(paymentSum) || !paymentDate) {
        return { status: 'error', message: 'Все поля обязательны для заполнения.' };
    }
    
    if (paymentSum <= 0) {
        return { status: 'error', message: 'Сумма оплаты должна быть положительной.' };
    }
    
    const supabase = createAdminClient();

    try {
        // --- This entire block should be a single database transaction/RPC ---

        // 1. Get current invoice and user profile
        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .select('*, orders(user_id)')
            .eq('id', invoiceId)
            .single();

        if (invoiceError || !invoice) {
            throw new Error(`Счет #${invoiceId} не найден.`);
        }
        
        const userId = invoice.orders?.user_id;
        if (!userId) {
            throw new Error(`Не удалось определить пользователя для счета #${invoiceId}.`);
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('balance')
            .eq('user_id', userId)
            .single();
        
        if (profileError || !profile) {
            throw new Error(`Профиль для пользователя ${userId} не найден.`);
        }

        // 2. Calculate new values based on your logic
        const newPaymentAmount = (invoice.payment_amount || 0) + paymentSum;
        const newDebt = newPaymentAmount - (invoice.invoice_amount || 0);

        let newStatus: 'Не оплачен' | 'Частично оплачен' | 'Оплачен' = 'Не оплачен';
        if (newDebt >= 0) {
            newStatus = 'Оплачен';
        } else if (newDebt < 0 && newPaymentAmount > 0) {
            newStatus = 'Частично оплачен';
        }

        // 3. Update invoice
        const { error: updateInvoiceError } = await supabase
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

        // 4. Handle overpayment
        if (newDebt > 0) {
            const newBalance = (profile.balance || 0) + newDebt;
            const { error: updateProfileError } = await supabase
                .from('profiles')
                .update({ balance: newBalance })
                .eq('user_id', userId);
            
            if (updateProfileError) {
                // Again, this indicates a need for transactions.
                 console.error(`CRITICAL: Overpayment processed for invoice ${invoiceId}, but failed to update user ${userId} balance. Error: ${updateProfileError.message}`);
                 throw new Error('Счет обновлен, но не удалось обновить баланс пользователя.');
            }
        }
        
        // --- End of transaction block ---

        revalidatePath('/admin/sales');
        revalidatePath('/profile/invoices');
        revalidatePath('/profile');
        
        return { status: 'success', message: `Оплата по счету #${invoiceId} на сумму ${paymentSum} BYN успешно зарегистрирована.` };

    } catch (e: any) {
        console.error('Error in registerPayment:', e);
        return { status: 'error', message: e.message };
    }
}

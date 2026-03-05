'use server';

import { createClient } from "@/lib/supabase/server";

export type Payment = {
  id: number;
  payment_date: string;
  payment_amount: number;
  payment_method: string;
  invoice_id: number;
  invoice_number: string | null;
  order_id: number;
};

type FetchedPayment = {
    id: number;
    payment_date: string;
    payment_amount: number;
    payment_method: string;
    invoice_id: number;
    invoices: {
        order_id: number;
        invoice_number: string | null;
    } | null;
}

export async function getUserPayments(): Promise<{ payments: Payment[], error: string | null }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { payments: [], error: 'Пользователь не авторизован.' };
  }

  try {
    const { data: userInvoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('id')
      .eq('user_id', user.id);

    if (invoicesError) {
      throw invoicesError;
    }
    
    if (!userInvoices || userInvoices.length === 0) {
        return { payments: [], error: null }; // No invoices means no payments
    }

    const invoiceIds = userInvoices.map(inv => inv.id);

    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select(`
        id,
        payment_date,
        payment_amount,
        payment_method,
        invoice_id,
        invoices (
          order_id,
          invoice_number
        )
      `)
      .in('invoice_id', invoiceIds)
      .order('payment_date', { ascending: false });
      
    if (paymentsError) {
        throw paymentsError;
    }
    
    const payments: Payment[] = (paymentsData as FetchedPayment[]).map(p => ({
        id: p.id,
        payment_date: p.payment_date,
        payment_amount: p.payment_amount,
        payment_method: p.payment_method,
        invoice_id: p.invoice_id,
        invoice_number: p.invoices?.invoice_number || null,
        order_id: p.invoices?.order_id || 0, // Fallback, though should always exist
    }));

    return { payments, error: null };

  } catch (err: any) {
    console.error('Error fetching user payments:', err);
    return { payments: [], error: err.message || 'Произошла непредвиденная ошибка при загрузке платежей.' };
  }
}

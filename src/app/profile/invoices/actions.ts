
'use server';

import { createClient } from "@/lib/supabase/server";

export type Invoice = {
  id: number;
  order_id: number;
  invoice_number: string | null;
  invoice_date: string;
  invoice_amount: number;
  payment_amount: number;
  debt: number;
  status: 'Не оплачен' | 'Частично оплачен' | 'Оплачен';
};

export async function getUserInvoices(): Promise<{ invoices: Invoice[], error: string | null }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { invoices: [], error: 'Пользователь не авторизован.' };
  }

  try {
    const { data: invoicesData, error: invoicesError } = await supabase
      .from('invoices')
      .select('id, order_id, invoice_number, invoice_date, invoice_amount, payment_amount, debt, status')
      .eq('user_id', user.id)
      .order('invoice_date', { ascending: false });

    if (invoicesError) {
      throw invoicesError;
    }

    const invoices: Invoice[] = invoicesData.map(inv => ({
        id: inv.id,
        order_id: inv.order_id,
        invoice_number: inv.invoice_number,
        invoice_date: inv.invoice_date,
        invoice_amount: inv.invoice_amount || 0,
        payment_amount: inv.payment_amount || 0,
        debt: inv.debt || 0,
        status: inv.status || 'Не оплачен',
      }));

    return { invoices, error: null };

  } catch (err: any) {
    console.error('Error fetching user invoices:', err);
    return { invoices: [], error: err.message || 'Произошла непредвиденная ошибка.' };
  }
}

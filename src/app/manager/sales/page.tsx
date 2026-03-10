import { createAdminClient } from "@/lib/supabase/service";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { InvoiceManager } from "./InvoiceManager";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export const dynamic = 'force-dynamic';

async function getDataForManager() {
    const supabase = createAdminClient();

    const [ordersRes, invoicesRes] = await Promise.all([
        supabase
            .from('orders')
            .select('id, total_amount, invoice_created')
            .eq('invoice_created', false)
            .order('id', { ascending: false }),
        supabase
            .from('invoices')
            .select('id, invoice_number, order_id, invoice_amount, debt, status')
            .in('status', ['Не оплачен', 'Частично оплачен'])
            .order('id', { ascending: false })
    ]);

    if (ordersRes.error) {
        console.error('Error fetching orders for invoicing:', ordersRes.error);
        return { error: 'Не удалось загрузить заказы для выставления счетов.' };
    }
    if (invoicesRes.error) {
        console.error('Error fetching invoices for payment:', invoicesRes.error);
        return { error: 'Не удалось загрузить счета для регистрации оплаты.' };
    }
    
    return {
        ordersToInvoice: ordersRes.data,
        invoicesToPay: invoicesRes.data,
    };
}


export default async function ManagerSalesPage() {
    const menuItems = [
        { href: "/manager", label: "Панель" },
        { href: "/manager/orders", label: "Заказы" },
        { href: "/manager/sales", label: "Продажи" },
        { href: "/manager/deliveries", label: "Доставки" },
        { href: "/manager/products", label: "Товары" },
        { href: "/manager/clients", label: "Клиенты" },
    ];

    const data = await getDataForManager();

    return (
        <div className="container mx-auto px-4 py-12 md:px-8 md:py-16 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="font-headline text-3xl font-bold">Панель менеджера</h1>
                <nav className="hidden md:flex items-center gap-2">
                    {menuItems.map(item => (
                        <Button key={item.href} variant={item.href === '/manager/sales' ? 'default' : 'outline'} asChild>
                            <Link href={item.href}>{item.label}</Link>
                        </Button>
                    ))}
                </nav>
            </div>
            
            <h2 className="font-headline text-2xl font-bold">Управление продажами и счетами</h2>
            
            {data.error ? (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Ошибка загрузки данных</AlertTitle>
                    <AlertDescription>{data.error}</AlertDescription>
                </Alert>
            ) : (
                <InvoiceManager
                    ordersToInvoice={data.ordersToInvoice || []}
                    invoicesToPay={data.invoicesToPay || []}
                />
            )}

             <Card>
                 <CardHeader>
                    <CardTitle>История продаж</CardTitle>
                    <CardDescription>Здесь будет отображаться информация о всех заказах.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                        <p>Нет данных о продажах для отображения.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

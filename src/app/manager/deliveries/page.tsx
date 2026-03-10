
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Truck } from "lucide-react";
import { getDeliveries } from "./actions";
import DeliveriesClient from "./DeliveriesClient";

export const dynamic = 'force-dynamic';

export default async function ManagerDeliveriesPage() {
    const menuItems = [
        { href: "/manager", label: "Панель" },
        { href: "/manager/orders", label: "Заказы" },
        { href: "/manager/sales", label: "Продажи" },
        { href: "/manager/deliveries", label: "Доставки" },
        { href: "/manager/products", label: "Товары" },
        { href: "/manager/clients", label: "Клиенты" },
    ];

    const { deliveries, error } = await getDeliveries();

    return (
        <div className="container mx-auto px-4 py-12 md:px-8 md:py-16 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="font-headline text-3xl font-bold">Панель менеджера</h1>
                <nav className="hidden md:flex items-center gap-2">
                    {menuItems.map(item => (
                        <Button key={item.href} variant={item.href === '/manager/deliveries' ? 'default' : 'outline'} asChild>
                            <Link href={item.href}>{item.label}</Link>
                        </Button>
                    ))}
                </nav>
            </div>
            
            <h2 className="font-headline text-2xl font-bold">Управление доставками</h2>
            
             <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Truck className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle>Заказы к отправке</CardTitle>
                            <CardDescription>
                                Список оплаченных заказов, ожидающих отправки или находящихся в пути. Заказы с самовывозом здесь не отображаются.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                   {error ? (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Ошибка загрузки данных</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    ) : (
                        <DeliveriesClient initialDeliveries={deliveries} />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

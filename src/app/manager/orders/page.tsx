import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ManagerOrdersPage() {
    const menuItems = [
        { href: "/manager", label: "Панель управления" },
        { href: "/manager/orders", label: "Заказы" },
        { href: "/manager/products", label: "Товары" },
        { href: "/manager/clients", label: "Клиенты" },
    ]

    return (
        <div className="container mx-auto px-4 py-12 md:px-8 md:py-16 space-y-6">
             <div className="flex justify-between items-center">
                <h1 className="font-headline text-3xl font-bold">Панель менеджера</h1>
                <nav className="flex items-center gap-2">
                    {menuItems.map(item => (
                        <Button key={item.href} variant="outline" asChild>
                            <Link href={item.href}>{item.label}</Link>
                        </Button>
                    ))}
                </nav>
            </div>
            <h2 className="font-headline text-2xl font-bold">Заказы</h2>
            <Card>
                 <CardHeader>
                    <CardTitle>История заказов</CardTitle>
                    <CardDescription>Здесь будет отображаться информация о всех заказах.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                        <p>Нет данных о заказах для отображения.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

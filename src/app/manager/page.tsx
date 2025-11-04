import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, Users, Package, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ManagerDashboardPage() {
    const stats = [
        { title: "Новые заказы", value: "125", icon: <ShoppingCart className="h-4 w-4 text-muted-foreground" /> },
        { title: "Новые клиенты", value: "+34", icon: <Users className="h-4 w-4 text-muted-foreground" /> },
        { title: "Товаров на складе", value: "1,234", icon: <Package className="h-4 w-4 text-muted-foreground" /> },
        { title: "Выручка за день", value: "50,345 BYN", icon: <DollarSign className="h-4 w-4 text-muted-foreground" /> },
    ]

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
            
            <h2 className="font-headline text-2xl font-bold">Панель управления</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map(stat => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            {stat.icon}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Активные заказы</CardTitle>
                    <CardDescription>Список заказов в работе.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                        Нет активных заказов для отображения.
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

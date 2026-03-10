
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, Users, Package, ShoppingCart, Truck } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ManagerDashboardPage() {
    const stats = [
        { title: "Заказы", description: "Просмотр и управление заказами.", icon: <ShoppingCart className="h-8 w-8 text-muted-foreground" />, href: "/manager/orders" },
        { title: "Продажи и счета", description: "Создание счетов и регистрация оплат.", icon: <DollarSign className="h-8 w-8 text-muted-foreground" />, href: "/manager/sales" },
        { title: "Доставки", description: "Управление отправкой и отслеживанием заказов.", icon: <Truck className="h-8 w-8 text-muted-foreground" />, href: "/manager/deliveries" },
        { title: "Клиенты", description: "Просмотр и управление клиентами.", icon: <Users className="h-8 w-8 text-muted-foreground" />, href: "/manager/clients" },
        { title: "Товары", description: "Управление каталогом товаров.", icon: <Package className="h-8 w-8 text-muted-foreground" />, href: "/manager/products" },
    ]

    const menuItems = [
        { href: "/manager", label: "Панель" },
        { href: "/manager/orders", label: "Заказы" },
        { href: "/manager/sales", label: "Продажи" },
        { href: "/manager/deliveries", label: "Доставки" },
        { href: "/manager/products", label: "Товары" },
        { href: "/manager/clients", label: "Клиенты" },
    ]

    return (
        <div className="container mx-auto px-4 py-12 md:px-8 md:py-16 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="font-headline text-3xl font-bold">Панель менеджера</h1>
                <nav className="hidden md:flex items-center gap-2">
                    {menuItems.map(item => (
                        <Button key={item.href} variant={item.href === '/manager' ? 'default' : 'outline'} asChild>
                            <Link href={item.href}>{item.label}</Link>
                        </Button>
                    ))}
                </nav>
            </div>
            
            <h2 className="font-headline text-2xl font-bold">Панель управления</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stats.map(stat => (
                    <Card key={stat.title} className="hover:shadow-lg transition-shadow">
                      <Link href={stat.href}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xl font-medium">{stat.title}</CardTitle>
                            {stat.icon}
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{stat.description}</p>
                        </CardContent>
                      </Link>
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

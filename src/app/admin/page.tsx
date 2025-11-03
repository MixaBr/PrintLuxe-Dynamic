import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, Users, Package, CreditCard } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AdminDashboardPage() {
    const stats = [
        { title: "Общий доход", value: "1,250,345 ₽", icon: <DollarSign className="h-4 w-4 text-muted-foreground" />, change: "+20.1% с прошлого месяца" },
        { title: "Новые пользователи", value: "+1,234", icon: <Users className="h-4 w-4 text-muted-foreground" />, change: "+180.1% с прошлого месяца" },
        { title: "Продажи", value: "+12,234", icon: <CreditCard className="h-4 w-4 text-muted-foreground" />, change: "+19% с прошлого месяца" },
        { title: "Всего товаров", value: "8", icon: <Package className="h-4 w-4 text-muted-foreground" />, change: "Актуальный каталог" },
    ]

    const menuItems = [
        { href: "/admin", label: "Панель управления" },
        { href: "/admin/products", label: "Товары" },
        { href: "/admin/sales", label: "Продажи" },
        { href: "/admin/users", label: "Пользователи" },
    ]

    return (
        <div className="container mx-auto px-4 py-12 md:px-8 md:py-16 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="font-headline text-3xl font-bold">Администрирование</h1>
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
                            <p className="text-xs text-muted-foreground">{stat.change}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Недавние продажи</CardTitle>
                    <CardDescription>Список последних 5 транзакций.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                        Нет недавних продаж для отображения.
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, Users, Package, CreditCard, ShoppingCart } from "lucide-react"

export default function ManagerDashboardPage() {
    const stats = [
        { title: "Новые заказы", value: "125", icon: <ShoppingCart className="h-4 w-4 text-muted-foreground" /> },
        { title: "Новые клиенты", value: "+34", icon: <Users className="h-4 w-4 text-muted-foreground" /> },
        { title: "Товаров на складе", value: "1,234", icon: <Package className="h-4 w-4 text-muted-foreground" /> },
        { title: "Выручка за день", value: "50,345 ₽", icon: <DollarSign className="h-4 w-4 text-muted-foreground" /> },
    ]

    return (
        <div className="space-y-6">
            <h1 className="font-headline text-3xl font-bold">Панель управления менеджера</h1>
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

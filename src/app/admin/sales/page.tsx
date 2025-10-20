import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function AdminSalesPage() {
    return (
        <div className="space-y-6">
            <h1 className="font-headline text-3xl font-bold">Продажи</h1>
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

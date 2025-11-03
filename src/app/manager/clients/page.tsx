import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function ManagerClientsPage() {
    return (
        <div className="space-y-6">
            <h1 className="font-headline text-3xl font-bold">Клиенты</h1>
             <Card>
                 <CardHeader>
                    <CardTitle>Список клиентов</CardTitle>
                    <CardDescription>Здесь будет отображаться информация о клиентах компании.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                        <p>Нет данных о клиентах для отображения.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

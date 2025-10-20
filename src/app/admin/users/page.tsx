import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function AdminUsersPage() {
    return (
        <div className="space-y-6">
            <h1 className="font-headline text-3xl font-bold">Пользователи</h1>
             <Card>
                 <CardHeader>
                    <CardTitle>Список пользователей</CardTitle>
                    <CardDescription>Здесь будет отображаться информация о зарегистрированных пользователях.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                        <p>Нет пользователей для отображения.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, FileText, Database, Settings } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AdminDashboardPage() {
    const stats = [
        { title: "Управление контентом", description: "Редактирование страниц и базы знаний AI.", icon: <FileText className="h-8 w-8 text-muted-foreground" />, href: "/admin/content" },
        { title: "Управление пользователями", description: "Назначение ролей, просмотр и редактирование профилей.", icon: <Users className="h-8 w-8 text-muted-foreground" />, href: "/admin/users" },
        { title: "Управление каталогом", description: "Добавление, изменение и удаление товаров и категорий.", icon: <Database className="h-8 w-8 text-muted-foreground" />, href: "/admin/products" },
        { title: "Системные настройки", description: "Глобальные параметры сайта, интеграции и ключи.", icon: <Settings className="h-8 w-8 text-muted-foreground" />, href: "/admin/settings" },
    ]

    const menuItems = [
        { href: "/admin", label: "Панель управления" },
        { href: "/admin/content", label: "Содержимое" },
        { href: "/admin/products", label: "Товары" },
        { href: "/admin/users", label: "Пользователи" },
        { href: "/admin/settings", label: "Настройки" },
    ]

    return (
        <div className="container mx-auto px-4 py-12 md:px-8 md:py-16 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="font-headline text-3xl font-bold">Администрирование</h1>
                <nav className="hidden md:flex items-center gap-2">
                    {menuItems.map(item => (
                        <Button key={item.href} variant={item.href === '/admin' ? 'default' : 'outline'} asChild>
                            <Link href={item.href}>{item.label}</Link>
                        </Button>
                    ))}
                </nav>
            </div>
            
            <h2 className="font-headline text-2xl font-bold">Панель управления сайтом</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                    <CardTitle>Системный журнал</CardTitle>
                    <CardDescription>Последние важные события в системе.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                        Здесь будет отображаться журнал системных событий.
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

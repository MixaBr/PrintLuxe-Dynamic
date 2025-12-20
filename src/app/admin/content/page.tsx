
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { KnowledgeBaseUploader } from "@/components/admin/KnowledgeBaseUploader"

export default function AdminContentPage() {
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
                         <Button key={item.href} variant={item.href === '/admin/content' ? 'default' : 'outline'} asChild>
                            <Link href={item.href}>{item.label}</Link>
                        </Button>
                    ))}
                </nav>
            </div>
            
            <h2 className="font-headline text-2xl font-bold">Управление контентом</h2>
            
            <Card>
                <CardHeader>
                    <CardTitle>База знаний</CardTitle>
                    <CardDescription>Загрузка и управление документами (PDF) для AI-ассистента.</CardDescription>
                </CardHeader>
                <CardContent>
                    <KnowledgeBaseUploader />
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Редактирование страниц</CardTitle>
                    <CardDescription>Управление текстами и изображениями на страницах "О нас", "Контакты" и главной.</CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="text-center text-muted-foreground py-8">
                        Здесь будет интерфейс для редактирования статических страниц.
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

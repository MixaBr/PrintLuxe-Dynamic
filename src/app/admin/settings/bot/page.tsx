import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AppSettingsForm } from "./AppSettingsForm"
import { createAdminClient } from "@/lib/supabase/service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function AdminBotSettingsPage() {
    const menuItems = [
        { href: "/admin", label: "Панель управления" },
        { href: "/admin/content", label: "Содержимое" },
        { href: "/admin/products", label: "Товары" },
        { href: "/admin/users", label: "Пользователи" },
        { href: "/admin/settings/bot", label: "Настройки" },
    ]

    const supabase = createAdminClient();
    // Фильтруем настройки, чтобы показать только те, что относятся к боту
    const { data: settings, error } = await supabase.from('app_config').select('key, value, description').like('key', 'bot_%');

    if (error) {
        return (
            <div className="container mx-auto px-4 py-12">
                <h1 className="text-destructive">Ошибка загрузки настроек: {error.message}</h1>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-12 md:px-8 md:py-16 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="font-headline text-3xl font-bold">Администрирование</h1>
                <nav className="hidden md:flex items-center gap-2">
                    {menuItems.map(item => (
                        <Button key={item.href} variant={item.href === '/admin/settings/bot' ? 'default' : 'outline'} asChild>
                            <Link href={item.href}>{item.label}</Link>
                        </Button>
                    ))}
                </nav>
            </div>
            
            <h2 className="font-headline text-2xl font-bold">Настройки Telegram-бота</h2>
            
            <Card>
                <CardHeader>
                    <CardTitle>Параметры AI-ассистента</CardTitle>
                    <CardDescription>
                        Здесь вы можете управлять системными промптами, таймаутами, лимитами и другими параметрами Telegram-бота.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AppSettingsForm settings={settings || []} />
                </CardContent>
            </Card>
        </div>
    )
}

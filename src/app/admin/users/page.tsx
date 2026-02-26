
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { getUsers } from "./actions";
import { UsersClient } from "./UsersClient";
import { createClient } from "@/lib/supabase/server";
import { AlertTriangle } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const menuItems = [
    { href: "/admin", label: "Панель управления" },
    { href: "/admin/content", label: "Содержимое" },
    { href: "/admin/products", label: "Товары" },
    { href: "/admin/users", label: "Пользователи" },
    { href: "/admin/settings/bot", label: "Настройки" },
    { href: "/admin/system", label: "Система" },
  ];

  const { users, error: getUsersError } = await getUsers();
  const supabase = createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  return (
    <div className="container mx-auto px-4 py-12 md:px-8 md:py-16 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-headline text-3xl font-bold">Администрирование</h1>
        <nav className="hidden md:flex items-center gap-2">
          {menuItems.map(item => (
            <Button key={item.href} variant={item.href === '/admin/users' ? 'default' : 'outline'} asChild>
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>
      </div>
      <h2 className="font-headline text-2xl font-bold">Пользователи</h2>
      <Card>
        <CardHeader>
          <CardTitle>Список пользователей</CardTitle>
          <CardDescription>Управление зарегистрированными пользователями, их ролями и статусами.</CardDescription>
        </CardHeader>
        <CardContent>
          {getUsersError ? (
             <div className="text-center py-8 text-destructive bg-destructive/10 rounded-md">
                <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
                <p className="font-semibold">Не удалось загрузить пользователей</p>
                <p className="text-sm">{getUsersError}</p>
            </div>
          ) : users.length > 0 ? (
            <UsersClient users={users} currentUserId={currentUser?.id} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Нет пользователей для отображения.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

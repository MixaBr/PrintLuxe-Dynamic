
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { LogOut, UserCircle, ShoppingCart, CreditCard, ShoppingBag, Star, Trash2 } from "lucide-react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function ProfilePage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const handleLogout = async () => {
    "use server";
    const supabase = createClient();
    await supabase.auth.signOut();
    revalidatePath('/', 'layout');
    redirect("/login");
  };

  const menuItems = [
    { href: "/profile/orders", label: "Мои заказы", icon: <ShoppingCart /> },
    { href: "/profile/payments", label: "Мои оплаты", icon: <CreditCard /> },
    { href: "/profile/purchases", label: "Мои покупки", icon: <ShoppingBag /> },
    { href: "/profile/bonuses", label: "Мои бонусы", icon: <Star /> },
    { href: "/profile/delete", label: "Удалить аккаунт", icon: <Trash2 />, danger: true },
  ];

  return (
    <div className="container mx-auto px-4 py-12 md:px-8 md:py-16 space-y-8">
      {/* Horizontal Menu Bar */}
      <Card>
        <CardContent className="p-2">
            <nav className="flex flex-wrap items-center gap-2">
                {menuItems.map(item => (
                <Button
                    key={item.href}
                    variant="ghost"
                    asChild
                    className={cn(
                        "justify-start gap-2",
                        item.danger && "text-destructive hover:bg-destructive/10 hover:text-destructive"
                    )}
                >
                    <Link href={item.href}>
                    {item.icon}
                    <span>{item.label}</span>
                    </Link>
                </Button>
                ))}
                <form action={handleLogout} className="ml-auto">
                    <Button variant="outline" className="font-bold">
                        <LogOut className="mr-2 h-4 w-4" />
                        Выйти
                    </Button>
                </form>
            </nav>
        </CardContent>
      </Card>

      {/* Main Profile Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <UserCircle className="w-12 h-12 text-primary" />
            <div>
              <CardTitle className="font-headline text-3xl">Профиль пользователя</CardTitle>
              <CardDescription>Ваша личная информация</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Имя</p>
            <p className="text-lg">{profile?.first_name || 'Не указано'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p className="text-lg">{user.email}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Телефон</p>
            <p className="text-lg">{profile?.phone || 'Не указан'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

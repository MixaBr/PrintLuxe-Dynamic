
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { LogOut, UserCircle, ShoppingCart, CreditCard, ShoppingBag, Star, Trash2, Home, User, Mail, Phone, Calendar, BarChart2 } from "lucide-react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';

export default async function ProfilePage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile and role in parallel
  const [profileRes, roleRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('role_users').select('role').eq('user_id', user.id).single()
  ]);

  const { data: profile } = profileRes;
  const { data: roleData } = roleRes;
  const role = roleData?.role || 'user';

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
  
  const addresses = profile?.addresses || [];

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Не указана';
    try {
        return format(new Date(dateString), 'dd.MM.yyyy');
    } catch (e) {
        return 'Неверный формат';
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 md:px-8 space-y-8">
      {/* Horizontal Menu Bar */}
      <div className="flex flex-wrap items-center justify-center gap-2 -mt-4">
        {menuItems.map(item => (
          <Button
            key={item.href}
            variant="ghost"
            asChild
            className={cn(
                "bg-white/50 text-black hover:bg-white hover:text-black flex-1 min-w-[150px] transition-colors duration-200",
                item.danger && "text-destructive hover:bg-destructive/10 hover:text-destructive"
            )}
          >
            <Link href={item.href}>
              {item.icon}
              <span>{item.label}</span>
            </Link>
          </Button>
        ))}
        <form action={handleLogout} className="flex-1 min-w-[150px]">
            <Button variant="ghost" className="w-full bg-white/50 text-black hover:bg-white hover:text-black font-bold">
                <LogOut className="mr-2 h-4 w-4" />
                Выйти
            </Button>
        </form>
      </div>

      {/* Main Profile Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <UserCircle className="w-12 h-12 text-primary" />
            <div>
              <CardTitle className="font-headline text-3xl">Профиль пользователя</CardTitle>
              <CardDescription>Ваша личная и контактная информация</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
            {/* Personal Info */}
            <div>
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-3"><User className="w-5 h-5" />Личная информация</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Имя</p>
                        <p>{profile?.first_name || 'Не указано'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Фамилия</p>
                        <p>{profile?.last_name || 'Не указана'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Дата рождения</p>
                        <p>{formatDate(profile?.birth_date)}</p>
                    </div>
                     <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Пол</p>
                        <p>{profile?.gender || 'Не указан'}</p>
                    </div>
                </div>
            </div>

            {/* Contact Info */}
            <div>
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-3"><Mail className="w-5 h-5" />Контактные данные</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p>{user.email}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Телефон</p>
                        <p>{profile?.phone || 'Не указан'}</p>
                    </div>
                </div>
            </div>

             {/* Statistics */}
            <div>
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-3"><BarChart2 className="w-5 h-5" />Статистика и статус</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Роль</p>
                        <p className="capitalize">{role}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Статус</p>
                        <p className="capitalize">{profile?.status || 'active'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Всего покупок</p>
                        <p>{profile?.total_purchases || 0}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Последний вход</p>
                        <p>{formatDate(user?.last_sign_in_at)}</p>
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>

      {/* Addresses Block */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
              <Home className="w-10 h-10 text-primary" />
              <div>
                <CardTitle className="font-headline text-3xl">Адреса пользователя</CardTitle>
                <CardDescription>Ваши сохраненные адреса доставки</CardDescription>
              </div>
          </div>
        </CardHeader>
        <CardContent>
          {Array.isArray(addresses) && addresses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((address, index) => (
                <div key={index} className="p-4 border rounded-lg bg-muted/20">
                  <p className="font-semibold">{address.label || `Адрес ${index + 1}`}</p>
                  <p className="text-muted-foreground">{address.street}, {address.city}, {address.zip_code}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">У вас пока нет сохраненных адресов.</p>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

    
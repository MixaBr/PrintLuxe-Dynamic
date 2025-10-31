
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { LogOut, UserCircle, ShoppingCart, CreditCard, ShoppingBag, Star, Trash2, Home, User, Mail, Phone, Calendar, BarChart2, Save } from "lucide-react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateProfile } from "./actions";

export default async function ProfilePage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

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
    if (!dateString) return '';
    try {
        // Supabase returns date as 'YYYY-MM-DD'
        return format(new Date(dateString), 'yyyy-MM-dd');
    } catch (e) {
        return '';
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
      <form action={updateProfile}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <UserCircle className="w-12 h-12 text-primary" />
                <div>
                  <CardTitle className="font-headline text-3xl">Профиль пользователя</CardTitle>
                  <CardDescription>Ваша личная и контактная информация</CardDescription>
                </div>
              </div>
              <Button type="submit">
                <Save className="mr-2" />
                Сохранить
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
              {/* Personal Info */}
              <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2 mb-3"><User className="w-5 h-5" />Личная информация</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                          <label htmlFor="first_name" className="text-sm font-medium text-muted-foreground">Имя</label>
                          <Input id="first_name" name="first_name" defaultValue={profile?.first_name || ''} />
                      </div>
                      <div className="space-y-1">
                          <label htmlFor="last_name" className="text-sm font-medium text-muted-foreground">Фамилия</label>
                          <Input id="last_name" name="last_name" defaultValue={profile?.last_name || ''} />
                      </div>
                      <div className="space-y-1">
                          <label htmlFor="birth_date" className="text-sm font-medium text-muted-foreground">Дата рождения</label>
                          <Input id="birth_date" name="birth_date" type="date" defaultValue={formatDate(profile?.birth_date)} />
                      </div>
                       <div className="space-y-1">
                          <label htmlFor="gender" className="text-sm font-medium text-muted-foreground">Пол</label>
                          <Select name="gender" defaultValue={profile?.gender || 'not_selected'}>
                            <SelectTrigger id="gender">
                                <SelectValue placeholder="Не выбрано" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="not_selected">Не выбрано</SelectItem>
                                <SelectItem value="male">Мужской</SelectItem>
                                <SelectItem value="female">Женский</SelectItem>
                                <SelectItem value="other">Другой</SelectItem>
                            </SelectContent>
                          </Select>
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
                          <label htmlFor="phone" className="text-sm font-medium text-muted-foreground">Телефон</label>
                          <Input id="phone" name="phone" defaultValue={profile?.phone || ''} />
                      </div>
                       <div className="space-y-1">
                          <label htmlFor="telegram_link" className="text-sm font-medium text-muted-foreground">Telegram</label>
                          <Input id="telegram_link" name="telegram_link" defaultValue={profile?.telegram_link || ''} />
                      </div>
                       <div className="space-y-1">
                          <label htmlFor="viber_phone" className="text-sm font-medium text-muted-foreground">Viber</label>
                          <Input id="viber_phone" name="viber_phone" defaultValue={profile?.viber_phone || ''} />
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
                          <p>{profile?.last_login_at ? format(new Date(profile.last_login_at), 'dd.MM.yyyy HH:mm') : 'Не записывался'}</p>
                      </div>
                  </div>
              </div>
          </CardContent>
        </Card>
      </form>

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

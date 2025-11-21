import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { LogOut, UserCircle, ShoppingCart, CreditCard, ShoppingBag, Star, Home, User, Mail, Phone, Calendar, BarChart2, Save, PlusCircle } from "lucide-react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateProfile } from "./actions";
import { DeleteAccountButton } from "./DeleteAccountButton";
import AddressManager from "./AddressManager";
import type { Address } from "@/lib/definitions";

export default async function ProfilePage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
  const { data: roleData } = await supabase.from('role_users').select('role').eq('user_id', user.id).single();
  const role = roleData?.role || 'user';

  let addresses: Address[] = [];
  if (profile) {
    const { data: addressData } = await supabase.from('addresses').select('*').eq('profile_id', profile.id);
    if (addressData) {
      addresses = addressData;
    }
  }

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
  ];
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    try {
        // Adding a time to handle timezone issues and ensure it's parsed as local
        return format(new Date(`${dateString}T00:00:00`), 'yyyy-MM-dd');
    } catch (e) {
        console.warn(`Invalid date string received: ${dateString}`);
        return '';
    }
  }

  const formatLoginTime = (dateString: string | null) => {
    if (!dateString) return 'Не записывался';
    try {
      const loginDate = new Date(dateString);
      loginDate.setHours(loginDate.getHours() + 3);
      return format(loginDate, 'dd.MM.yyyy HH:mm');
    } catch (e) {
      console.warn(`Invalid login date string received: ${dateString}`);
      return 'Ошибка формата';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:px-8 space-y-4">
      {/* Horizontal Menu Bar */}
      <div className="flex flex-wrap items-center justify-center gap-2 -mt-4">
        {menuItems.map(item => (
          <Button
            key={item.href}
            variant="ghost"
            asChild
            className={cn(
                "bg-white/50 text-black hover:bg-white hover:text-black flex-1 min-w-[150px] transition-colors duration-200"
            )}
          >
            <Link href={item.href}>
              {item.icon}
              <span>{item.label}</span>
            </Link>
          </Button>
        ))}
        
        <DeleteAccountButton />

        <form action={handleLogout} className="flex-1 min-w-[150px]">
            <Button variant="ghost" className="w-full bg-white/50 text-black hover:bg-white hover:text-black font-bold">
                <LogOut className="mr-2 h-4 w-4" />
                Выйти
            </Button>
        </form>
      </div>

      {/* Main Profile Content */}
      <form action={updateProfile}>
        <Card className="bg-black/50 text-white border-none">
          <CardHeader className="py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <UserCircle className="w-10 h-10 text-primary" />
                <div>
                  <CardTitle className="font-headline text-2xl">Профиль пользователя</CardTitle>
                  <CardDescription className="text-gray-300">Ваша личная и контактная информация</CardDescription>
                </div>
              </div>
              <Button type="submit">
                <Save className="mr-2" />
                Сохранить
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0 pb-4">
              {/* Personal Info */}
              <div>
                  <h3 className="font-semibold text-md flex items-center gap-2 mb-2"><User className="w-5 h-5" />Личная информация</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                          <label htmlFor="first_name" className="text-xs font-medium text-gray-300">Имя</label>
                          <Input id="first_name" name="first_name" defaultValue={profile?.first_name || ''} className="h-9 text-sm bg-white/10 border-white/20 text-white" />
                      </div>
                      <div className="space-y-1">
                          <label htmlFor="last_name" className="text-xs font-medium text-gray-300">Фамилия</label>
                          <Input id="last_name" name="last_name" defaultValue={profile?.last_name || ''} className="h-9 text-sm bg-white/10 border-white/20 text-white" />
                      </div>
                      <div className="space-y-1">
                          <label htmlFor="birth_date" className="text-xs font-medium text-gray-300">Дата рождения</label>
                          <Input id="birth_date" name="birth_date" type="date" defaultValue={formatDate(profile?.birth_date)} className="h-9 text-sm bg-white/10 border-white/20 text-white" />
                      </div>
                       <div className="space-y-1">
                          <label htmlFor="gender" className="text-xs font-medium text-gray-300">Пол</label>
                          <Select name="gender" defaultValue={profile?.gender || 'not_selected'}>
                            <SelectTrigger id="gender" className="h-9 text-sm bg-white/10 border-white/20 text-white">
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
                  <h3 className="font-semibold text-md flex items-center gap-2 mb-2"><Mail className="w-5 h-5" />Контактные данные</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-300">Email</p>
                          <p className="text-sm">{user.email}</p>
                      </div>
                      <div className="space-y-1">
                          <label htmlFor="phone" className="text-xs font-medium text-gray-300">Телефон</label>
                          <Input id="phone" name="phone" defaultValue={profile?.phone || ''} placeholder="Например, +375291234567" className="h-9 text-sm bg-white/10 border-white/20 text-white"/>
                           <p className="text-xs text-gray-300">В формате E.164</p>
                      </div>
                       <div className="space-y-1">
                          <label htmlFor="telegram_link" className="text-xs font-medium text-gray-300">Telegram</label>
                          <Input id="telegram_link" name="telegram_link" defaultValue={profile?.telegram_link || ''} placeholder="@username" className="h-9 text-sm bg-white/10 border-white/20 text-white" />
                      </div>
                       <div className="space-y-1">
                          <label htmlFor="viber_phone" className="text-xs font-medium text-gray-300">Viber</label>
                          <Input id="viber_phone" name="viber_phone" defaultValue={profile?.viber_phone || ''} placeholder="Например, +375291234567" className="h-9 text-sm bg-white/10 border-white/20 text-white"/>
                          <p className="text-xs text-gray-300">В формате E.164</p>
                      </div>
                  </div>
              </div>

               {/* Statistics */}
              <div>
                  <h3 className="font-semibold text-md flex items-center gap-2 mb-2"><BarChart2 className="w-5 h-5" />Статистика и статус</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-300">Роль</p>
                          <p className="capitalize text-sm">{role}</p>
                      </div>
                      <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-300">Статус</p>
                          <p className="capitalize text-sm">{profile?.status || 'active'}</p>
                      </div>
                      <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-300">Всего покупок</p>
                          <p className="text-sm">{profile?.total_purchases || 0}</p>
                      </div>
                      <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-300">Последний вход</p>
                          <p className="text-sm">{formatLoginTime(profile?.last_login_at)}</p>
                      </div>
                  </div>
              </div>
          </CardContent>
        </Card>
      </form>
       {/* Addresses Block */}
      <Card className="bg-black/50 text-white border-none">
        <AddressManager initialAddresses={addresses} />
      </Card>
    </div>
  );
}

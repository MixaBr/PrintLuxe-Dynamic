import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { LogOut, UserCircle } from "lucide-react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

  return (
    <div className="container mx-auto px-4 py-12 md:px-8 md:py-16">
      <div className="max-w-2xl mx-auto">
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
            <form action={handleLogout} className="pt-4">
              <Button variant="destructive" className="w-full font-bold">
                <LogOut className="mr-2 h-4 w-4" />
                Выйти из аккаунта
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

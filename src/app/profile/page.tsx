import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  // Mock user data
  const user = {
    name: 'Иван Иванов',
    email: 'ivan.ivanov@example.com',
    avatarUrl: 'https://picsum.photos/seed/user1/100/100',
    initials: 'ИИ',
    memberSince: 'Январь 2023',
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-8 md:py-16">
      <h1 className="font-headline text-4xl md:text-5xl font-bold mb-8">Профиль пользователя</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>{user.initials}</AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold font-headline">{user.name}</h2>
              <p className="text-muted-foreground">{user.email}</p>
              <p className="text-sm text-muted-foreground mt-2">Участник с {user.memberSince}</p>
              <Button variant="outline" className="mt-4">Редактировать профиль</Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">История заказов</CardTitle>
              <CardDescription>Здесь будет отображаться история ваших заказов.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <p>У вас пока нет заказов.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

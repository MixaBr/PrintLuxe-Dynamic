'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { signIn, signUp } from '@/app/login/actions';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
  const [state, formAction] = useFormState(signIn, null);
  const { pending } = useFormStatus();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Вход в аккаунт</CardTitle>
        <CardDescription>
          Введите email и пароль для доступа к вашему профилю.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="example@email.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
            />
          </div>
          <Button type="submit" className="w-full font-bold" disabled={pending}>
            {pending ? 'Вход...' : 'Войти'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function RegisterForm() {
  const [state, formAction] = useFormState(signUp, null);
  const { pending } = useFormStatus();
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (state?.success) {
      setMessage({ type: 'success', text: 'Регистрация прошла успешно! Пожалуйста, проверьте свою почту для подтверждения.' });
    } else if (state?.error) {
      setMessage({ type: 'error', text: state.error });
    }
  }, [state]);

  return (
     <Card>
      <CardHeader>
        <CardTitle className="font-headline">Создание аккаунта</CardTitle>
        <CardDescription>Заполните форму для регистрации.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
           {message && (
            <div className={`${message.type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'} px-4 py-3 rounded relative`} role="alert">
              <span className="block sm:inline">{message.text}</span>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name-reg">Имя</Label>
            <Input id="name-reg" name="name" placeholder="Иван Иванов" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-reg">Email</Label>
            <Input id="email-reg" name="email" type="email" placeholder="example@email.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password-reg">Пароль</Label>
            <Input id="password-reg" name="password" type="password" required />
          </div>
          <Button type="submit" className="w-full font-bold" disabled={pending}>
            {pending ? 'Регистрация...' : 'Зарегистрироваться'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-15rem)] px-4 py-12">
      <Tabs defaultValue="login" className="w-[400px]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Вход</TabsTrigger>
          <TabsTrigger value="register">Регистрация</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <LoginForm />
        </TabsContent>
        <TabsContent value="register">
          <RegisterForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
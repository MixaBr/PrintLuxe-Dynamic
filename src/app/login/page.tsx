'use client'

import { useFormState } from 'react-dom';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp } from './actions';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const [signInState, signInAction] = useFormState(signIn, null);
  const [signUpState, signUpAction] = useFormState(signUp, null);

  const [isArchived, setIsArchived] = useState(false);
  const [activeTab, setActiveTab] = useState("signin"); // 'signin' or 'signup'

  useEffect(() => {
    if (signInState?.error === 'ACCOUNT_ARCHIVED') {
      setIsArchived(true);
    } else if (signInState?.error) {
        console.error("Sign In Error:", signInState.error);
    }
  }, [signInState]);

  useEffect(() => {
    if (signUpState?.success) {
      setActiveTab("signin");
    } else if (signUpState?.error) {
      console.error("Sign Up Error:", signUpState.error);
    }
  }, [signUpState]);

  const handleOkClick = () => {
    setIsArchived(false);
    router.push('/contact');
  };

  const getErrorMessage = (state: any) => {
      if (!state?.error || state.error === 'ACCOUNT_ARCHIVED') return null;
      return state.error;
  }

  const getSuccessMessage = (state: any) => {
      if (!state?.success) return null;
      return "Регистрация прошла успешно! Теперь вы можете войти.";
  }

  return (
    <div className="flex items-center justify-center min-h-full">
      <Card className={cn(
          "w-full max-w-md mx-4",
          "bg-card/80 backdrop-blur-sm border-white/20"
      )}>
        <CardHeader>
           <div className="flex justify-around mb-4 border-b">
            <Button variant={activeTab === 'signin' ? "default" : "ghost"} onClick={() => setActiveTab('signin')} className="flex-1 rounded-none">Вход</Button>
            <Button variant={activeTab === 'signup' ? "default" : "ghost"} onClick={() => setActiveTab('signup')} className="flex-1 rounded-none">Регистрация</Button>
          </div>
          <CardTitle className="text-2xl font-bold text-center">{activeTab === 'signin' ? 'Войти в аккаунт' : 'Создать аккаунт'}</CardTitle>
          <CardDescription className="text-center">
            {activeTab === 'signin' ? 'Введите свои данные для входа' : 'Заполните форму для регистрации'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeTab === 'signin' ? (
            <form action={signInAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="m@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              {getErrorMessage(signInState) && (
                <p className="text-sm font-medium text-destructive">{getErrorMessage(signInState)}</p>
              )}
              <Button type="submit" className="w-full">Войти</Button>
            </form>
          ) : (
            <form action={signUpAction} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Имя</Label>
                    <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email-signup">Email</Label>
                    <Input id="email-signup" name="email" type="email" placeholder="m@example.com" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password-signup">Пароль</Label>
                    <Input id="password-signup" name="password" type="password" required />
                </div>
                {getErrorMessage(signUpState) && (
                    <p className="text-sm font-medium text-destructive">{getErrorMessage(signUpState)}</p>
                )}
                {getSuccessMessage(signUpState) && (
                    <p className="text-sm font-medium text-green-600">{getSuccessMessage(signUpState)}</p>
                )}
                <Button type="submit" className="w-full">Зарегистрироваться</Button>
            </form>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isArchived} onOpenChange={setIsArchived}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Аккаунт заблокирован</AlertDialogTitle>
            <AlertDialogDescription>
                Ваш аккаунт помечен для удаления. Вы не можете его больше использовать. Если Вы все же хотите восстановить доступ к аккаунту, свяжитесь с нами любым доступным способом.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleOkClick}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from 'react';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/login');
    }, 5000); // 5 секунд

    return () => clearTimeout(timer); 
  }, [router]);


  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md mx-4 bg-card/80 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
            Email успешно подтвержден!
          </CardTitle>
          <CardDescription className="text-center pt-2 text-gray-800 dark:text-gray-200">
            Ваш аккаунт активирован. Теперь вы можете войти, используя свой email и пароль.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            Вы будете автоматически перенаправлены через 5 секунд.
          </p>
          <Button onClick={() => router.push('/login')} className="w-full">
            Перейти на страницу входа
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

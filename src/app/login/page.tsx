
'use client'

import { useFormState } from 'react-dom';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn, signUp } from './actions';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { RecaptchaWidget } from '@/components/ui/RecaptchaWidget';

export default function LoginPage() {
  const router = useRouter();
  const [signInState, signInAction] = useFormState(signIn, null);
  const [signUpState, signUpAction] = useFormState(signUp, null);

  const [isArchived, setIsArchived] = useState(false);
  const [modalState, setModalState] = useState<{ open: boolean; title: string; description: string; }>({ open: false, title: '', description: '' });

  const [activeTab, setActiveTab] = useState("signin");
  const [isRecaptchaVerified, setIsRecaptchaVerified] = useState(false);
  const [isConsentGiven, setIsConsentGiven] = useState(false);

  useEffect(() => {
    if (signInState && 'error' in signInState && signInState.error === 'ACCOUNT_ARCHIVED') {
      setIsArchived(true);
    } else if (signInState && 'error' in signInState && signInState.error) {
      console.error("Sign In Error:", signInState.error);
    }
  }, [signInState]);

  useEffect(() => {
    if (!signUpState) return;

    if ('success' in signUpState && signUpState.success) {
      setModalState({
        open: true,
        title: "Регистрация почти завершена",
        description: "Мы отправили вам письмо на указанный почтовый ящик. Пожалуйста, перейдите по ссылке в письме, чтобы подтвердить вашу регистрацию."
      });
    } else if ('error' in signUpState && signUpState.error) {
        const errorValue = signUpState.error;
        let errorMessage: string;

        if (typeof errorValue === 'string') {
            errorMessage = errorValue;
        } else if (errorValue && typeof errorValue === 'object' && 'message' in errorValue) {
            errorMessage = String((errorValue as { message: unknown }).message);
        } else {
            errorMessage = JSON.stringify(errorValue);
        }

        let description = "Произошла неизвестная ошибка. Попробуйте снова.";
        if (errorMessage.includes("уже существует, но не подтвержден")) {
            description = "Пользователь с таким email уже зарегистрирован, но его почта не подтверждена. Мы отправили повторное письмо с подтверждением на ваш email. Пожалуйста, проверьте почту.";
        } else if (errorMessage.includes("уже существует")) {
            description = "Пользователь с таким email уже существует. Пожалуйста, войдите в свой аккаунт.";
        } else if (errorMessage.includes("Validation error") || errorMessage.includes("is invalid")) {
            description = "Убедитесь, что вы ввели правильный email и пароль длиной не менее 6 символов.";
        } else if (errorMessage.includes("должны дать согласие")) {
            description = "Вы должны дать согласие на обработку персональных данных для продолжения.";
        }

        setModalState({
            open: true,
            title: "Ошибка регистрации",
            description: description,
        });
    }
  }, [signUpState]);

  const handleOkClick = () => {
    setIsArchived(false);
    router.push('/contact');
  };

  const handleModalClose = () => {
    setModalState({ open: false, title: '', description: '' });
    let shouldSwitch = false;

    if (signUpState && 'success' in signUpState && signUpState.success) {
        shouldSwitch = true;
    } else if (signUpState && 'error' in signUpState && signUpState.error) {
        const errorValue = signUpState.error;
        let errorMessage: string;

        if (typeof errorValue === 'string') {
            errorMessage = errorValue;
        } else if (errorValue && typeof errorValue === 'object' && 'message' in errorValue) {
            errorMessage = String((errorValue as { message: unknown }).message);
        } else {
            errorMessage = JSON.stringify(errorValue);
        }
        
        if (errorMessage.includes("уже существует")) {
            shouldSwitch = true;
        }
    }

    if (shouldSwitch) {
      setActiveTab("signin");
    }
    setIsRecaptchaVerified(false);
  };

 const getErrorMessage = (state: { error?: any } | null): string | null => {
    if (!state || !('error' in state) || !state.error || state.error === 'ACCOUNT_ARCHIVED') return null;

    const errorValue = state.error;

    if (typeof errorValue === 'string') {
        return errorValue;
    }

    if (Array.isArray(errorValue)) {
        return errorValue.map(e => e.message).join(', ');
    }

    if (typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue) {
        return String(errorValue.message);
    }

    return JSON.stringify(errorValue);
}

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsRecaptchaVerified(false);
    setIsConsentGiven(false);
  }

  return (
    <div className="flex items-center justify-center min-h-full">
      <Card className={cn(
          "w-full max-w-md mx-4",
          "bg-card/80 backdrop-blur-sm border-white/20"
      )}>
        <CardHeader>
          <div className="flex justify-around mb-4 border-b">
            <Button variant={activeTab === 'signin' ? "default" : "ghost"} onClick={() => handleTabChange('signin')} className="flex-1 rounded-none">Вход</Button>
            <Button variant={activeTab === 'signup' ? "default" : "ghost"} onClick={() => handleTabChange('signup')} className="flex-1 rounded-none">Регистрация</Button>
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
                {isConsentGiven && <input type="hidden" name="consent" value="true" />}
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

                <div className="my-4 flex justify-center">
                    <RecaptchaWidget onVerified={setIsRecaptchaVerified} />
                </div>

                <div className="flex items-start space-x-2.5 my-4 px-1">
                    <Checkbox id="consent-checkbox" checked={isConsentGiven} onCheckedChange={(checked) => setIsConsentGiven(checked as boolean)} className="mt-0.5" />
                    <Label htmlFor="consent-checkbox" className="text-xs peer-disabled:cursor-not-allowed peer-disabled:opacity-70 font-normal">
                        Нажимая кнопку «Зарегистрироваться», я даю согласие на обработку моих персональных данных и подтверждаю, что ознакомлен(а) с <Link href="/legal/privacy-policy" className="underline hover:text-primary" target="_blank">Политикой конфиденциальности</Link> и принимаю <Link href="/legal/terms-of-service" className="underline hover:text-primary" target="_blank">Условия использования</Link>.
                    </Label>
                </div>

                 {getErrorMessage(signUpState) && (
                    <p className="text-sm font-medium text-destructive">{getErrorMessage(signUpState)}</p>
                )}
                <Button type="submit" className="w-full" disabled={!isRecaptchaVerified || !isConsentGiven}>Зарегистрироваться</Button>
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

      <AlertDialog open={modalState.open} onOpenChange={(open) => !open && handleModalClose()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{modalState.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {modalState.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleModalClose}>Я понял</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

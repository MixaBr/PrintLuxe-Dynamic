'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const supabase = createSupabaseBrowserClient()

  const handleLogin = async () => {
    await supabase.auth.signInWithPassword({
      email,
      password,
    })
  }

  const handleRegister = async () => {
    await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
        emailRedirectTo: `${location.origin}/auth/callback`,
      }
    })
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-15rem)] px-4 py-12">
        <Tabs defaultValue="login" className="w-[400px]">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Вход</TabsTrigger>
                <TabsTrigger value="register">Регистрация</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
                <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Вход в аккаунт</CardTitle>
                    <CardDescription>
                    Введите email и пароль для доступа к вашему профилю.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="example@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="password">Пароль</Label>
                    <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <Button onClick={handleLogin} className="w-full font-bold">Войти</Button>
                </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="register">
                <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Создание аккаунта</CardTitle>
                    <CardDescription>
                    Заполните форму для регистрации.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                    <Label htmlFor="name-reg">Имя</Label>
                    <Input id="name-reg" placeholder="Иван Иванов" required value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="email-reg">Email</Label>
                    <Input id="email-reg" type="email" placeholder="example@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="password-reg">Пароль</Label>
                    <Input id="password-reg" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <Button onClick={handleRegister} className="w-full font-bold">Зарегистрироваться</Button>
                </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}

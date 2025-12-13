
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

interface ThankYouPageProps {
    params: {
        orderId: string;
    }
}

export default async function ThankYouPage({ params }: ThankYouPageProps) {
    const supabase = createClient();
    const { data: order, error } = await supabase
        .from('orders')
        .select('id, guest_email, guest_first_name')
        .eq('id', params.orderId)
        .single();
        
    if (error || !order) {
        return (
             <div className="container mx-auto h-full flex items-center justify-center p-4">
                <Card className="w-full max-w-lg">
                    <CardHeader className="items-center text-center">
                        <CheckCircle2 className="w-16 h-16 text-destructive mb-4" />
                        <CardTitle className="text-2xl">Ошибка</CardTitle>
                        <CardDescription>
                           Заказ с номером {params.orderId} не найден. Пожалуйста, проверьте правильность ссылки или свяжитесь с нами.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-4">
                        <Button asChild className="w-full">
                            <Link href="/">Вернуться на главную</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }


    return (
        <div className="container mx-auto h-full flex items-center justify-center p-4">
            <Card className="w-full max-w-lg bg-card/80 backdrop-blur-sm border-white/20">
                <CardHeader className="items-center text-center">
                    <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                    <CardTitle className="text-2xl text-white">Спасибо, {order.guest_first_name || 'клиент'}!</CardTitle>
                    <CardDescription className="text-white/80">
                        Ваш заказ №{order.id} успешно оформлен.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    <p className="text-center text-sm text-white/70">
                        Мы отправили подтверждение на ваш email ({order.guest_email}). 
                        Наш менеджер свяжется с вами в ближайшее время для уточнения деталей.
                    </p>
                    <Button asChild className="w-full">
                        <Link href="/catalog">Продолжить покупки</Link>
                    </Button>
                     <Button asChild variant="outline" className="w-full">
                        <Link href="/">Вернуться на главную</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

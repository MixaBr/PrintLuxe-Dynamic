
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserOrders, OrderWithItems } from "./actions";
import OrdersClient from "./OrdersClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function ProfileOrdersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { orders, error } = await getUserOrders();

  return (
    <div className="container mx-auto px-4 py-8 md:px-8">
      <Card className="bg-black/50 text-white border-white/20 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-4">
            <ShoppingCart className="w-8 h-8 text-primary" />
            <div>
              <CardTitle className="font-headline text-2xl">Мои заказы</CardTitle>
              <CardDescription>История всех ваших заказов, их статусы и содержимое.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <OrdersClient initialOrders={orders} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

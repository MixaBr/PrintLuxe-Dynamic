import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserInvoices } from "./actions";
import InvoicesClient from "./InvoicesClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function ProfileInvoicesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { invoices, error } = await getUserInvoices();

  return (
    <div className="container mx-auto px-4 py-8 md:px-8">
      <Card className="bg-black/50 text-white border-white/20 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-4">
            <FileText className="w-8 h-8 text-primary" />
            <div>
              <CardTitle className="font-headline text-2xl">Мои счета</CardTitle>
              <CardDescription>История всех ваших счетов, их статусы и суммы.</CardDescription>
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
            <InvoicesClient initialInvoices={invoices} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

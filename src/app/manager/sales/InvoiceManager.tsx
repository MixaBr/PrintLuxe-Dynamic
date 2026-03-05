
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useTransition, useRef } from 'react';
import { createInvoiceForOrder, registerPayment } from './actions';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const createInvoiceInitialState = { message: '', status: 'idle' as const };
const registerPaymentInitialState = { message: '', status: 'idle' as const };

function CreateInvoiceSubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Создать счет
        </Button>
    );
}

function RegisterPaymentSubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Зарегистрировать оплату
        </Button>
    );
}

interface InvoiceManagerProps {
    ordersToInvoice: { id: number; total_amount: number | null; }[];
    invoicesToPay: { id: number; invoice_number: string | null; order_id: number; invoice_amount: number | null; debt: number | null; status: string | null }[];
}

export function InvoiceManager({ ordersToInvoice, invoicesToPay }: InvoiceManagerProps) {
    const { toast } = useToast();
    const [createState, createAction] = useFormState(createInvoiceForOrder, createInvoiceInitialState);
    const [paymentState, paymentAction] = useFormState(registerPayment, registerPaymentInitialState);

    const createFormRef = useRef<HTMLFormElement>(null);
    const paymentFormRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (createState.status === 'success') {
            toast({ title: 'Успех!', description: createState.message });
            createFormRef.current?.reset();
        } else if (createState.status === 'error') {
            toast({ variant: 'destructive', title: 'Ошибка', description: createState.message });
        }
    }, [createState, toast]);

    useEffect(() => {
        if (paymentState.status === 'success') {
            toast({ title: 'Успех!', description: paymentState.message });
            paymentFormRef.current?.reset();
        } else if (paymentState.status === 'error') {
            toast({ variant: 'destructive', title: 'Ошибка', description: paymentState.message });
        }
    }, [paymentState, toast]);

    return (
        <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Создание счета</CardTitle>
                    <CardDescription>Выберите заказ, для которого нужно создать счет.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form ref={createFormRef} action={createAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="order_id">Заказ</Label>
                            <Select name="order_id" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Выберите заказ..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {ordersToInvoice.length > 0 ? (
                                        ordersToInvoice.map(order => (
                                            <SelectItem key={order.id} value={String(order.id)}>
                                                Заказ #{order.id} (Сумма: {order.total_amount?.toLocaleString('ru-RU') || 0} BYN)
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="none" disabled>Нет заказов без счета</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="invoice_number">Номер счета (из 1С)</Label>
                            <Input id="invoice_number" name="invoice_number" placeholder="Например, СЧ-001234" />
                        </div>
                        <CreateInvoiceSubmitButton />
                    </form>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Регистрация оплаты</CardTitle>
                    <CardDescription>Внесите поступившую оплату по счету.</CardDescription>
                </CardHeader>
                <CardContent>
                     <form ref={paymentFormRef} action={paymentAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="invoice_id">Счет</Label>
                             <Select name="invoice_id" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Выберите счет..." />
                                </SelectTrigger>
                                <SelectContent>
                                     {invoicesToPay.length > 0 ? (
                                        invoicesToPay.map(invoice => (
                                            <SelectItem key={invoice.id} value={String(invoice.id)}>
                                                {invoice.invoice_number || `Счет #${invoice.id}`} (Долг: {invoice.debt?.toLocaleString('ru-RU') || 0} BYN)
                                            </SelectItem>
                                        ))
                                    ) : (
                                         <SelectItem value="none" disabled>Нет счетов для оплаты</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="payment_sum">Сумма оплаты (BYN)</Label>
                            <Input id="payment_sum" name="payment_sum" type="number" step="0.01" placeholder="Например, 125.50" required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="payment_date">Дата оплаты</Label>
                            <Input id="payment_date" name="payment_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="payment_method">Метод оплаты</Label>
                            <Select name="payment_method" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Выберите метод..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Наличный расчет">Наличный расчет</SelectItem>
                                    <SelectItem value="Оплата банковской картой">Оплата банковской картой</SelectItem>
                                    <SelectItem value="Оплата через ЕРИП">Оплата через ЕРИП</SelectItem>
                                    <SelectItem value="Безналичный расчет">Безналичный расчет</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <RegisterPaymentSubmitButton />
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

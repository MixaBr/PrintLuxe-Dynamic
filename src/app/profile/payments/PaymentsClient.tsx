'use client';

import { useState, useMemo } from 'react';
import type { Payment } from './actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from 'next/link';
import ClientSideDate from '@/components/ui/ClientSideDate';

const paymentMethods = [
    "Наличный расчет",
    "Оплата банковской картой",
    "Оплата через ЕРИП",
    "Безналичный расчет"
];


interface PaymentsClientProps {
  initialPayments: Payment[];
}

export default function PaymentsClient({ initialPayments }: PaymentsClientProps) {
  const [filters, setFilters] = useState({
    date: '',
    method: 'all',
    amountMin: '',
    amountMax: '',
  });

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };
  
  const filteredPayments = useMemo(() => {
    return initialPayments.filter(payment => {
      const date = new Date(payment.payment_date);
      const amount = payment.payment_amount;

      const methodMatch = filters.method === 'all' ? true : payment.payment_method === filters.method;
      const dateMatch = filters.date ? new Date(date.toDateString()).toISOString().split('T')[0] === filters.date : true;
      const amountMinMatch = filters.amountMin ? amount >= parseFloat(filters.amountMin) : true;
      const amountMaxMatch = filters.amountMax ? amount <= parseFloat(filters.amountMax) : true;

      return methodMatch && dateMatch && amountMinMatch && amountMaxMatch;
    });
  }, [initialPayments, filters]);

  if (initialPayments.length === 0) {
    return <div className="text-center py-8 text-white/70">У вас еще нет ни одного платежа.</div>;
  }

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-white/20">
             <TableHead className="w-[160px]">
              <p className="mb-1 text-white">Дата платежа</p>
              <Input
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
                className="h-8 bg-white/10 border-white/20 text-white"
              />
            </TableHead>
            <TableHead className="min-w-[200px]">
              <p className="mb-1 text-white">Сумма (BYN)</p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="От"
                  value={filters.amountMin}
                  onChange={(e) => handleFilterChange('amountMin', e.target.value)}
                  className="h-8 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
                <Input
                  type="number"
                  placeholder="До"
                  value={filters.amountMax}
                  onChange={(e) => handleFilterChange('amountMax', e.target.value)}
                  className="h-8 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
            </TableHead>
            <TableHead className="w-[200px]">
              <p className="mb-1 text-white">Метод оплаты</p>
              <Select value={filters.method} onValueChange={(value) => handleFilterChange('method', value)}>
                <SelectTrigger className="h-8 bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все методы</SelectItem>
                  {paymentMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </TableHead>
            <TableHead>Счет</TableHead>
            <TableHead>Заказ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredPayments.length > 0 ? (
            filteredPayments.map(payment => (
              <TableRow key={payment.id} className="border-white/10">
                <TableCell>
                  <ClientSideDate dateString={payment.payment_date} />
                </TableCell>
                <TableCell className="font-medium">{payment.payment_amount.toLocaleString('ru-RU')} BYN</TableCell>
                <TableCell>{payment.payment_method}</TableCell>
                 <TableCell>
                    <Link href={`/profile/invoices`} className="hover:underline">
                        {payment.invoice_number || `#${payment.invoice_id}`}
                    </Link>
                </TableCell>
                <TableCell>
                    <Link href={`/profile/orders`} className="hover:underline">
                        #{payment.order_id}
                    </Link>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-white/70">
                Платежи, соответствующие фильтрам, не найдены.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

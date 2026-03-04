'use client';

import { useState, useMemo } from 'react';
import type { Invoice } from './actions';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import Link from 'next/link';

type Status = 'Оплачен' | 'Ожидает оплаты' | 'Частично оплачен';
const allStatuses: Status[] = ['Оплачен', 'Ожидает оплаты', 'Частично оплачен'];

const getStatusColor = (status: Status) => {
  switch (status) {
    case 'Оплачен': return 'bg-green-500 hover:bg-green-500';
    case 'Частично оплачен': return 'bg-yellow-500 hover:bg-yellow-500';
    case 'Ожидает оплаты': return 'bg-red-500 hover:bg-red-500';
    default: return 'bg-gray-500 hover:bg-gray-500';
  }
};

interface InvoicesClientProps {
  initialInvoices: Invoice[];
}

export default function InvoicesClient({ initialInvoices }: InvoicesClientProps) {
  const [filters, setFilters] = useState({
    number: '',
    orderId: '',
    date: '',
    status: 'all',
  });

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };
  
  const filteredInvoices = useMemo(() => {
    return initialInvoices.filter(invoice => {
      const date = new Date(invoice.invoice_date);

      const numberMatch = filters.number ? (invoice.invoice_number?.includes(filters.number) || String(invoice.id).includes(filters.number)) : true;
      const orderIdMatch = filters.orderId ? String(invoice.order_id).includes(filters.orderId) : true;
      const statusMatch = filters.status === 'all' ? true : invoice.status === filters.status;
      const dateMatch = filters.date ? format(date, 'yyyy-MM-dd') === filters.date : true;

      return numberMatch && statusMatch && dateMatch && orderIdMatch;
    });
  }, [initialInvoices, filters]);

  if (initialInvoices.length === 0) {
    return <div className="text-center py-8 text-white/70">У вас еще нет счетов для отображения.</div>;
  }

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-white/20">
            <TableHead className="w-[180px]">
              <p className="mb-1 text-white">Номер счета</p>
              <Input
                placeholder="Фильтр..."
                value={filters.number}
                onChange={(e) => handleFilterChange('number', e.target.value)}
                className="h-8 bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </TableHead>
            <TableHead className="w-[160px]">
              <p className="mb-1 text-white">Дата счета</p>
              <Input
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
                className="h-8 bg-white/10 border-white/20 text-white"
              />
            </TableHead>
            <TableHead className="w-[120px]">
              <p className="mb-1 text-white">Заказ</p>
               <Input
                placeholder="Фильтр..."
                value={filters.orderId}
                onChange={(e) => handleFilterChange('orderId', e.target.value)}
                className="h-8 bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </TableHead>
            <TableHead>Сумма</TableHead>
            <TableHead>Оплачено</TableHead>
            <TableHead>Остаток</TableHead>
            <TableHead className="w-[180px]">
              <p className="mb-1 text-white">Статус</p>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger className="h-8 bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  {allStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredInvoices.length > 0 ? (
            filteredInvoices.map(invoice => (
              <TableRow key={invoice.id} className="border-white/10">
                <TableCell className="font-medium">{invoice.invoice_number || `Счет #${invoice.id}`}</TableCell>
                <TableCell>{format(new Date(invoice.invoice_date), 'dd.MM.yyyy HH:mm')}</TableCell>
                <TableCell>
                    <Link href={`/profile/orders`} className="hover:underline">
                        #{invoice.order_id}
                    </Link>
                </TableCell>
                <TableCell>{invoice.invoice_amount.toLocaleString('ru-RU')} BYN</TableCell>
                <TableCell>{invoice.payment_amount.toLocaleString('ru-RU')} BYN</TableCell>
                <TableCell className="font-medium">{invoice.debt.toLocaleString('ru-RU')} BYN</TableCell>
                <TableCell>
                  <Badge className={cn('text-white', getStatusColor(invoice.status))}>
                    {invoice.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-white/70">
                Счета, соответствующие фильтрам, не найдены.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

'use client';

import { useState, useMemo, useTransition } from 'react';
import type { OrderWithItems, OrderItem } from './actions';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';

type Status = 'Новый' | 'В обработке' | 'В пути' | 'Доставлен' | 'Отменен';
const allStatuses: Status[] = ['Новый', 'В обработке', 'В пути', 'Доставлен', 'Отменен'];

const getStatusColor = (status: Status) => {
  switch (status) {
    case 'Новый': return 'bg-blue-500 hover:bg-blue-500';
    case 'В обработке': return 'bg-yellow-500 hover:bg-yellow-500';
    case 'В пути': return 'bg-orange-500 hover:bg-orange-500';
    case 'Доставлен': return 'bg-green-500 hover:bg-green-500';
    case 'Отменен': return 'bg-red-500 hover:bg-red-500';
    default: return 'bg-gray-500 hover:bg-gray-500';
  }
};

interface OrdersClientProps {
  initialOrders: OrderWithItems[];
}

export default function OrdersClient({ initialOrders }: OrdersClientProps) {
  const [filters, setFilters] = useState({
    number: '',
    date: '',
    status: 'all',
    amountMin: '',
    amountMax: '',
  });
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<number>>(new Set());

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const toggleOrderExpansion = (orderId: number) => {
    setExpandedOrderIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const filteredOrders = useMemo(() => {
    return initialOrders.filter(order => {
      const date = new Date(order.order_date);
      const amount = order.total_amount;

      const numberMatch = filters.number ? String(order.id).includes(filters.number) : true;
      const statusMatch = filters.status === 'all' ? true : order.status === filters.status;
      const dateMatch = filters.date ? format(date, 'yyyy-MM-dd') === filters.date : true;
      const amountMinMatch = filters.amountMin ? amount >= parseFloat(filters.amountMin) : true;
      const amountMaxMatch = filters.amountMax ? amount <= parseFloat(filters.amountMax) : true;

      return numberMatch && statusMatch && dateMatch && amountMinMatch && amountMaxMatch;
    });
  }, [initialOrders, filters]);

  if (initialOrders.length === 0) {
    return <div className="text-center py-8 text-white/70">У вас еще нет ни одного заказа.</div>;
  }

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-white/20">
            <TableHead className="w-[120px]">
              <p className="mb-1 text-white">Номер</p>
              <Input
                placeholder="Фильтр..."
                value={filters.number}
                onChange={(e) => handleFilterChange('number', e.target.value)}
                className="h-8 bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </TableHead>
            <TableHead className="w-[160px]">
              <p className="mb-1 text-white">Дата</p>
              <Input
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
                className="h-8 bg-white/10 border-white/20 text-white"
              />
            </TableHead>
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredOrders.length > 0 ? (
            filteredOrders.map(order => (
              <React.Fragment key={order.id}>
                <TableRow onDoubleClick={() => toggleOrderExpansion(order.id)} className="cursor-pointer border-white/10 hover:bg-white/5 data-[state=selected]:bg-white/10">
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>{format(new Date(order.order_date), 'dd.MM.yyyy HH:mm')}</TableCell>
                  <TableCell>
                    <Badge className={cn('text-white', getStatusColor(order.status))}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{order.total_amount.toLocaleString('ru-RU', { style: 'currency', currency: 'BYN' })}</TableCell>
                </TableRow>
                {expandedOrderIds.has(order.id) && (
                  <TableRow className="bg-black/20 hover:bg-black/20">
                    <TableCell colSpan={4} className="p-0">
                      <div className="p-4">
                        <h4 className="font-semibold mb-2 text-md">Состав заказа #{order.id}</h4>
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent border-white/10">
                              <TableHead className="text-white">Название товара</TableHead>
                              <TableHead className="text-center text-white">Кол-во</TableHead>
                              <TableHead className="text-right text-white">Цена за шт.</TableHead>
                              <TableHead className="text-right text-white">Сумма</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {order.items.map(item => (
                              <TableRow key={item.id} className="border-white/10">
                                <TableCell>{item.name}</TableCell>
                                <TableCell className="text-center">{item.quantity}</TableCell>
                                <TableCell className="text-right">{item.price.toLocaleString('ru-RU')} BYN</TableCell>
                                <TableCell className="text-right">{(item.price * item.quantity).toLocaleString('ru-RU')} BYN</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-white/70">
                Заказы, соответствующие фильтрам, не найдены.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// Dummy React import to satisfy the linter
import React from 'react';

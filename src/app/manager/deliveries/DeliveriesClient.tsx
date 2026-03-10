
'use client';

import { useState, useTransition } from "react";
import type { Delivery } from "./actions";
import { updateDeliveryStatus } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import ClientSideDate from "@/components/ui/ClientSideDate";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DeliveriesClientProps {
    initialDeliveries: Delivery[];
}

const deliveryStatuses = ['Ждет доставки', 'В пути', 'Доставлен', 'Отменен'];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Ждет доставки': return 'bg-yellow-500 hover:bg-yellow-500';
    case 'В пути': return 'bg-blue-500 hover:bg-blue-500';
    case 'Доставлен': return 'bg-green-500 hover:bg-green-500';
    case 'Отменен': return 'bg-red-500 hover:bg-red-500';
    default: return 'bg-gray-500 hover:bg-gray-500';
  }
};

export default function DeliveriesClient({ initialDeliveries }: DeliveriesClientProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
    
    if (initialDeliveries.length === 0) {
        return <div className="text-center py-12 text-muted-foreground">Нет заказов для доставки.</div>
    }

    const handleOpenDialog = (delivery: Delivery) => {
        setSelectedDelivery(delivery);
        setIsDialogOpen(true);
    };
    
    const handleFormSubmit = async (formData: FormData) => {
        if (!selectedDelivery) return;
        formData.append('orderId', String(selectedDelivery.id));

        startTransition(async () => {
            const result = await updateDeliveryStatus(formData);
            if (result.success) {
                toast({ title: "Успех", description: result.message });
                setIsDialogOpen(false);
                router.refresh();
            } else {
                toast({ variant: 'destructive', title: "Ошибка", description: result.message });
            }
        });
    };

    return (
        <>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Заказ №</TableHead>
                            <TableHead>Дата</TableHead>
                            <TableHead>Клиент</TableHead>
                            <TableHead>Адрес</TableHead>
                            <TableHead>Метод</TableHead>
                            <TableHead>Трек-номер</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead className="text-right">Действие</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialDeliveries.map(d => (
                            <TableRow key={d.id}>
                                <TableCell className="font-medium">#{d.id}</TableCell>
                                <TableCell><ClientSideDate dateString={d.order_date} formatString="dd.MM.yy" /></TableCell>
                                <TableCell>
                                    <div className="font-medium">{d.customer_name}</div>
                                    <div className="text-xs text-muted-foreground">{d.customer_phone}</div>
                                </TableCell>
                                <TableCell className="text-xs max-w-xs truncate">{d.delivery_address}</TableCell>
                                <TableCell>{d.delivery_method}</TableCell>
                                <TableCell>{d.tracking_number || '—'}</TableCell>
                                <TableCell>
                                    <Badge className={cn('text-white', getStatusColor(d.status))}>
                                        {d.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button size="sm" onClick={() => handleOpenDialog(d)}>Обновить</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <form action={handleFormSubmit}>
                        <DialogHeader>
                            <DialogTitle>Обновить статус доставки заказа #{selectedDelivery?.id}</DialogTitle>
                            <DialogDescription>
                                Выберите новый статус и укажите трек-номер, если необходимо.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="status">Новый статус</Label>
                                <Select name="status" defaultValue={selectedDelivery?.status}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {deliveryStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tracking_number">Трек-номер</Label>
                                <Input id="tracking_number" name="tracking_number" defaultValue={selectedDelivery?.tracking_number || ''} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Комментарий</Label>
                                <Textarea id="notes" name="notes" placeholder="Заметки для внутреннего использования..." />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary" disabled={isPending}>Отмена</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Сохранить
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

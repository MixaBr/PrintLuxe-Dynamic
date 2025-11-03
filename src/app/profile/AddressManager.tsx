'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { addOrUpdateAddress, deleteAddress } from './actions';
import type { Address } from '@/lib/definitions';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

interface AddressManagerProps {
    initialAddresses: Address[];
}

const addressTypeMap: { [key: string]: string } = {
    delivery: 'Доставка',
    billing: 'Оплата',
    other: 'Другой'
};

export default function AddressManager({ initialAddresses }: AddressManagerProps) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

    const handleFormSubmit = async (formData: FormData) => {
        startTransition(async () => {
            const result = await addOrUpdateAddress(formData);
            if (result.error) {
                toast({
                    variant: 'destructive',
                    title: 'Ошибка',
                    description: result.error,
                });
            } else {
                toast({
                    title: 'Успех!',
                    description: result.success,
                });
                // Optimistically update UI or simply close dialog and let revalidation handle it.
                setIsDialogOpen(false);
            }
        });
    };

    const handleDelete = (addressId: number) => {
        startTransition(async () => {
            const result = await deleteAddress(addressId);
            if (result.error) {
                toast({ variant: 'destructive', title: 'Ошибка', description: result.error });
            } else {
                toast({ title: 'Успех!', description: result.success });
                setAddresses(addresses.filter(addr => addr.id !== addressId));
            }
        });
    };

    const handleEdit = (address: Address) => {
        setSelectedAddress(address);
        setIsDialogOpen(true);
    };

    const handleAddNew = () => {
        setSelectedAddress(null);
        setIsDialogOpen(true);
    };

    return (
        <div>
            <div className="flex justify-end mb-2">
                <Button size="sm" onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4" /> Добавить адрес</Button>
            </div>
            <ScrollArea className="h-52 w-full rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Тип</TableHead>
                            <TableHead>Адрес</TableHead>
                            <TableHead className="w-[100px]">Действия</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {addresses.length > 0 ? (
                            addresses.map((address) => (
                                <TableRow key={address.id}>
                                    <TableCell className="text-xs">{addressTypeMap[address.address_type || 'other'] || 'Не указан'}</TableCell>
                                    <TableCell className="text-xs">
                                        {`${address.postal_code || ''}, ${address.country || ''}, г. ${address.city || ''}, ул. ${address.street || ''}, д. ${address.building || ''}${address.housing ? `, корп. ${address.housing}` : ''}${address.apartment ? `, кв. ${address.apartment}` : ''}`}
                                    </TableCell>
                                    <TableCell className="space-x-1">
                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleEdit(address)} disabled={isPending}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => handleDelete(address.id)} disabled={isPending}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24">У вас пока нет сохраненных адресов.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </ScrollArea>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[625px]">
                    <form action={handleFormSubmit}>
                        <DialogHeader>
                            <DialogTitle>{selectedAddress ? 'Редактировать адрес' : 'Добавить новый адрес'}</DialogTitle>
                            <DialogDescription>
                                Заполните детали адреса. Нажмите "Сохранить", когда закончите.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedAddress && <input type="hidden" name="id" value={selectedAddress.id} />}
                        
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="address_type" className="text-right">Тип адреса</Label>
                                <Select name="address_type" defaultValue={selectedAddress?.address_type || 'delivery'}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Выберите тип" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="delivery">Доставка</SelectItem>
                                        <SelectItem value="billing">Оплата</SelectItem>
                                        <SelectItem value="other">Другой</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="country" className="text-right">Страна</Label>
                                <Input id="country" name="country" defaultValue={selectedAddress?.country || ''} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="postal_code" className="text-right">Индекс</Label>
                                <Input id="postal_code" name="postal_code" defaultValue={selectedAddress?.postal_code || ''} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="city" className="text-right">Город</Label>
                                <Input id="city" name="city" defaultValue={selectedAddress?.city || ''} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="street" className="text-right">Улица</Label>
                                <Input id="street" name="street" defaultValue={selectedAddress?.street || ''} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="building" className="text-right">Дом</Label>
                                <Input id="building" name="building" defaultValue={selectedAddress?.building || ''} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="housing" className="text-right">Корпус</Label>
                                <Input id="housing" name="housing" defaultValue={selectedAddress?.housing || ''} className="col-span-3" />
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="apartment" className="text-right">Квартира</Label>
                                <Input id="apartment" name="apartment" defaultValue={selectedAddress?.apartment || ''} className="col-span-3" />
                            </div>
                        </div>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Отмена</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? 'Сохранение...' : 'Сохранить'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

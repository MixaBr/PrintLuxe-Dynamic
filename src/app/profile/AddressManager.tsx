'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { addOrUpdateAddress, deleteAddress } from './actions';
import type { Address } from '@/lib/definitions';
import { PlusCircle, Edit, Trash2, Home } from 'lucide-react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const [addressToDelete, setAddressToDelete] = useState<number | null>(null);
    const [isRecaptchaVerified, setIsRecaptchaVerified] = useState(false);

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
                setIsFormDialogOpen(false);
                router.refresh();
            }
        });
    };

    const handleDeleteAttempt = (addressId: number) => {
        setAddressToDelete(addressId);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async (formData: FormData) => {
        if (!addressToDelete) return;

        startTransition(async () => {
            const result = await deleteAddress(formData, addressToDelete);
            if (result.error) {
                toast({ variant: 'destructive', title: 'Ошибка', description: result.error });
            } else {
                toast({ title: 'Успех!', description: result.success });
                router.refresh();
            }
            setIsDeleteDialogOpen(false);
            setAddressToDelete(null);
            setIsRecaptchaVerified(false);
        });
    };

    const handleEdit = (address: Address) => {
        setSelectedAddress(address);
        setIsFormDialogOpen(true);
    };

    const handleAddNew = () => {
        setSelectedAddress(null);
        setIsFormDialogOpen(true);
    };

    const handleCaptchaVerify = () => {
        setIsRecaptchaVerified(true);
    };
    
    if (typeof window !== 'undefined') {
        (window as any).onCaptchaVerifyDelete = handleCaptchaVerify;
    }

    return (
        <>
             {isDeleteDialogOpen && (
                <Script src="https://www.google.com/recaptcha/api.js" async defer />
            )}
            <CardHeader className="flex flex-row items-start justify-between gap-4 py-4">
               <div className="flex items-center gap-4">
                 <Home className="w-8 h-8 text-primary" />
                 <div>
                   <CardTitle className="font-headline text-2xl">Адреса пользователя</CardTitle>
                   <CardDescription>Ваши сохраненные адреса доставки</CardDescription>
                 </div>
               </div>
               <Button size="sm" onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4" /> Добавить адрес</Button>
            </CardHeader>
            <CardContent className="pt-0 pb-4">
                <div className="h-52 w-full rounded-md border flex flex-col">
                    <div className="flex-shrink-0 border-b">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-transparent hover:bg-transparent">
                                    <TableHead className="w-[15%] text-white">Тип</TableHead>
                                    <TableHead className="w-[65%] text-white">Адрес</TableHead>
                                    <TableHead className="w-[20%] text-white text-right">Действия</TableHead>
                                </TableRow>
                            </TableHeader>
                        </Table>
                    </div>
                    <ScrollArea className="flex-grow">
                        <Table>
                            <TableBody>
                                {initialAddresses.length > 0 ? (
                                    initialAddresses.map((address) => (
                                        <TableRow key={address.id} className="border-white/10">
                                            <TableCell className="text-xs w-[15%]">{addressTypeMap[address.address_type || 'other'] || 'Не указан'}</TableCell>
                                            <TableCell className="text-xs w-[65%]">
                                                {`${address.postal_code || ''}, ${address.country || ''}, г. ${address.city || ''}, ул. ${address.street || ''}, д. ${address.building || ''}${address.housing ? `, корп. ${address.housing}` : ''}${address.apartment ? `, кв. ${address.apartment}` : ''}`}
                                            </TableCell>
                                            <TableCell className="w-[20%]">
                                                <div className="flex justify-end space-x-1">
                                                    <Button size="icon" className="h-7 w-7 bg-white text-black hover:bg-primary hover:text-white" onClick={() => handleEdit(address)} disabled={isPending}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => handleDeleteAttempt(address.id)} disabled={isPending}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow className="border-transparent">
                                        <TableCell colSpan={3} className="text-center h-24">У вас пока нет сохраненных адресов.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>

                {/* Edit/Add Dialog */}
                <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
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

                {/* Delete Confirmation Dialog */}
                 <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
                    setIsDeleteDialogOpen(open);
                    if (!open) {
                        setIsRecaptchaVerified(false);
                        setAddressToDelete(null);
                    }
                }}>
                    <AlertDialogContent>
                        <form action={handleDeleteConfirm}>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Это действие невозможно отменить. Адрес будет удален навсегда. 
                                    Пожалуйста, пройдите проверку, чтобы продолжить.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            
                             <div className="my-4 flex justify-center">
                                <div
                                    className="g-recaptcha"
                                    data-sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                                    data-callback="onCaptchaVerifyDelete"
                                ></div>
                            </div>

                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isPending}>Отмена</AlertDialogCancel>
                                <Button type="submit" variant="destructive" disabled={!isRecaptchaVerified || isPending}>
                                    {isPending ? "Удаление..." : "Удалить"}
                                </Button>
                            </AlertDialogFooter>
                        </form>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </>
    );
}

/**
 * @fileOverview System maintenance page for administrators.
 * Allows viewing and resetting database tables.
 */
'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { getDatabaseTables, resetTable } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, Trash2, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SystemAdminPage() {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [tables, setTables] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [tableToReset, setTableToReset] = useState<string | null>(null);

    useEffect(() => {
        startTransition(async () => {
            const result = await getDatabaseTables();
            if (result.error) {
                setError(result.error);
                toast({ variant: 'destructive', title: 'Ошибка', description: result.error });
            } else if (result.tables) {
                setTables(result.tables);
            }
        });
    }, [toast]);

    const handleResetClick = (tableName: string) => {
        setTableToReset(tableName);
    };

    const handleResetConfirm = () => {
        if (!tableToReset) return;
        
        startTransition(async () => {
            const result = await resetTable(tableToReset);
            if (result.error) {
                toast({ variant: 'destructive', title: 'Ошибка', description: result.error });
            } else {
                toast({ title: 'Успех', description: result.success });
                // Refresh the table list after reset
                const refreshResult = await getDatabaseTables();
                 if (refreshResult.tables) {
                    setTables(refreshResult.tables);
                }
            }
            setTableToReset(null);
        });
    };

    const menuItems = [
        { href: "/admin", label: "Панель управления" },
        { href: "/admin/content", label: "Содержимое" },
        { href: "/admin/products", label: "Товары" },
        { href: "/admin/users", label: "Пользователи" },
        { href: "/admin/settings/bot", label: "Настройки" },
        { href: "/admin/system", label: "Система" },
    ];

    return (
        <div className="container mx-auto px-4 py-12 md:px-8 md:py-16 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="font-headline text-3xl font-bold">Администрирование</h1>
                <nav className="hidden md:flex items-center gap-2">
                    {menuItems.map(item => (
                        <Button key={item.href} variant={item.href === '/admin/system' ? 'default' : 'outline'} asChild>
                            <Link href={item.href}>{item.label}</Link>
                        </Button>
                    ))}
                </nav>
            </div>
            
            <h2 className="font-headline text-2xl font-bold">Обслуживание Системы</h2>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle>Управление таблицами базы данных</CardTitle>
                            <CardDescription>Очистка данных из таблиц. Используйте с предельной осторожностью.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="text-center py-8 text-destructive bg-destructive/10 rounded-md">
                            <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
                            <p className="font-semibold">Не удалось загрузить данные</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}
                    {!error && isPending && tables.length === 0 && (
                         <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    )}
                    {!isPending && tables.length > 0 && (
                        <div className="border rounded-lg max-h-96">
                            <ScrollArea className="h-96">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm">
                                        <TableRow>
                                            <TableHead>Имя таблицы</TableHead>
                                            <TableHead className="text-right">Действие</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tables.map(table => (
                                            <TableRow key={table}>
                                                <TableCell className="font-mono text-sm">{table}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="destructive" size="sm" onClick={() => handleResetClick(table)} disabled={isPending}>
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Очистить
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={!!tableToReset} onOpenChange={(open) => !open && setTableToReset(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Вы собираетесь безвозвратно удалить все данные из таблицы 
                            <strong className="font-mono mx-1">{tableToReset}</strong>. 
                            Это действие невозможно отменить.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetConfirm} className="bg-destructive hover:bg-destructive/90" disabled={isPending}>
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Да, очистить таблицу
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

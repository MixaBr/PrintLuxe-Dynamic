import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAllProducts } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";


export default async function ManagerProductsPage() {
    const products = await getAllProducts();
    const menuItems = [
        { href: "/manager", label: "Панель управления" },
        { href: "/manager/orders", label: "Заказы" },
        { href: "/manager/products", label: "Товары" },
        { href: "/manager/clients", label: "Клиенты" },
    ]


    return (
         <div className="container mx-auto px-4 py-12 md:px-8 md:py-16 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="font-headline text-3xl font-bold">Панель менеджера</h1>
                <nav className="flex items-center gap-2">
                    {menuItems.map(item => (
                        <Button key={item.href} variant="outline" asChild>
                            <Link href={item.href}>{item.label}</Link>
                        </Button>
                    ))}
                </nav>
            </div>
            <div className="flex items-center justify-between">
                <h2 className="font-headline text-2xl font-bold">Товары</h2>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Добавить товар
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Список товаров</CardTitle>
                    <CardDescription>Управление каталогом продукции.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="hidden w-[100px] sm:table-cell">
                                    <span className="sr-only">Изображение</span>
                                </TableHead>
                                <TableHead>Название</TableHead>
                                <TableHead>Категория</TableHead>
                                <TableHead className="hidden md:table-cell">Цена</TableHead>
                                <TableHead>
                                    <span className="sr-only">Действия</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map(product => {
                                const image = PlaceHolderImages.find(p => p.id === product.imageId);
                                return (
                                    <TableRow key={product.id}>
                                        <TableCell className="hidden sm:table-cell">
                                            {image && <Image alt={product.name} className="aspect-square rounded-md object-cover" height="64" src={image.imageUrl} width="64" data-ai-hint={image.imageHint} />}
                                        </TableCell>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{product.category}</Badge>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">{product.price.toLocaleString('ru-RU')} ₽</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Меню</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Действия</DropdownMenuLabel>
                                                    <DropdownMenuItem>Редактировать</DropdownMenuItem>
                                                    <DropdownMenuItem>Удалить</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

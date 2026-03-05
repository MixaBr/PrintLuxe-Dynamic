'use client'; 

import { useFormState } from 'react-dom';
import { updateProduct } from './actions';
import type { Product } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

// Field descriptions for tooltips
const fieldDescriptions: Record<string, string> = {
    name: "Полное наименование товара, которое видит покупатель.",
    article_number: "Уникальный артикул или складской номер товара.",
    product_number: "Официальный номер продукта от производителя.",
    manufacturer: "Бренд или производитель товара.",
    category: "Категория, к которой относится товар.",
    price1: "Базовая розничная цена для гостей и неавторизованных пользователей.",
    price2: "Цена для авторизованных пользователей без специальных условий.",
    price3: "Цена для пользователей, достигших порога накопления.",
    price4: "Специальная VIP-цена.",
    accumulation: "Сумма покупок, после которой начинает действовать 'Цена 3'.",
    description: "Подробное описание товара. Можно использовать форматирование.",
    compatible_with_models: "Список совместимых моделей, разделенных точкой с запятой (;).",
    photo_url: "Ссылка на основное изображение товара.",
    image_urls: "Ссылки на дополнительные изображения, разделенные запятой.",
    weight: "Вес товара в граммах.",
    sizeW: "Ширина товара в миллиметрах.",
    sizeL: "Длина (глубина) товара в миллиметрах.",
    sizeH: "Высота товара в миллиметрах.",
    is_featured: "Отметьте, чтобы показать товар в блоке 'Рекомендуемые' на главной странице.",
    stock_quantity: 'Текущее количество товара на складе.'
};

// Form Field Component
function FormFieldRow({ fieldName, label, currentValue, inputType = 'text', isTextarea = false, isBoolean = false }: {
    fieldName: keyof Product;
    label: string;
    currentValue: any;
    inputType?: string;
    isTextarea?: boolean;
    isBoolean?: boolean;
}) {
    const description = fieldDescriptions[label] || "Нет описания.";
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start py-3 border-b border-muted">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <Label htmlFor={`new_${fieldName}`} className="font-semibold text-sm">{label}</Label>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button type="button" className="p-0 border-none bg-transparent cursor-help">
                                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs">{description}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <p className="text-sm text-muted-foreground break-words">{currentValue?.toString() || 'Не указано'}</p>
            </div>
            <div>
                {isBoolean ? (
                    <Select name={`new_${fieldName}`}>
                        <SelectTrigger><SelectValue placeholder="Не изменять" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="true">Да</SelectItem>
                            <SelectItem value="false">Нет</SelectItem>
                        </SelectContent>
                    </Select>
                ) : isTextarea ? (
                    <Textarea id={`new_${fieldName}`} name={`new_${fieldName}`} placeholder="Новое значение..." rows={4} />
                ) : (
                    <Input id={`new_${fieldName}`} name={`new_${fieldName}`} type={inputType} placeholder="Новое значение..." step={inputType === 'number' ? 'any' : undefined} />
                )}
            </div>
        </div>
    );
}

// Main Page Component
const initialState = { message: null, errors: null, status: 'idle' as const };

interface EditProductPageProps {
    params: { id: string };
}

export default function EditProductPage({ params }: EditProductPageProps) {
    const { toast } = useToast();
    const [state, formAction] = useFormState(updateProduct, initialState);
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function getProduct() {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', params.id)
                .single();
            if (error) {
                console.error(error);
                toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить данные товара.' });
            } else {
                setProduct(data);
            }
            setLoading(false);
        }
        getProduct();
    }, [params.id, toast]);

    useEffect(() => {
        if (state.status === 'success' && state.message) {
            toast({ title: "Успех!", description: state.message });
        } else if (state.status === 'error' && state.message) {
            toast({ variant: 'destructive', title: "Ошибка", description: state.message });
        }
    }, [state, toast]);

    if (loading) {
        return <div className="container mx-auto p-8 text-center">Загрузка...</div>;
    }

    if (!product) {
        return <div className="container mx-auto p-8 text-center text-destructive">Товар не найден.</div>;
    }
    
    const productFields: (keyof Product)[] = [
        'name', 'article_number', 'product_number', 'manufacturer', 'category',
        'price1', 'price2', 'price3', 'price4', 'accumulation', 'stock_quantity',
        'description', 'compatible_with_models', 'photo_url', 'image_urls',
        'weight', 'sizeW', 'sizeL', 'sizeH', 'is_featured'
    ];

    return (
        <div className="container mx-auto px-4 py-12 md:px-8 md:py-16 space-y-6">
            <form action={formAction}>
                <input type="hidden" name="id" value={product.id} />
                <div className="sticky top-[81px] z-10 bg-background/95 backdrop-blur-sm py-4 border-b -mx-4 px-4 mb-6">
                    <div className="container mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="font-headline text-2xl font-bold">Редактирование товара</h1>
                            <p className="text-muted-foreground text-lg font-mono">#{product.id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" asChild>
                                <Link href="/manager/products"><ArrowLeft className="mr-2 h-4 w-4" />Закрыть</Link>
                            </Button>
                            <Button type="submit"><Save className="mr-2 h-4 w-4" />Сохранить изменения</Button>
                        </div>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Поля товара</CardTitle>
                        <CardDescription>
                            Заполните только те поля, которые хотите изменить. Пустые поля останутся без изменений.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {productFields.map(key => {
                                const fieldKey = key as keyof typeof fieldDescriptions;
                                if (fieldDescriptions[fieldKey]) {
                                    return (
                                        <FormFieldRow 
                                            key={key}
                                            fieldName={key}
                                            label={fieldKey}
                                            currentValue={product[key]}
                                            inputType={typeof product[key] === 'number' ? 'number' : 'text'}
                                            isTextarea={key === 'description' || key === 'compatible_with_models'}
                                            isBoolean={key === 'is_featured'}
                                        />
                                    );
                                }
                                return null;
                            })}
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}

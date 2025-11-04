
'use client';

import { useEffect } from 'react';
import type { Product } from '@/lib/definitions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Image from 'next/image';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableRow } from '../ui/table';
import { incrementProductViewCount } from '@/app/catalog/actions';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductDetailModal({ product, isOpen, onClose }: ProductDetailModalProps) {
  
  useEffect(() => {
    if (isOpen && product) {
      // We don't need to wait for this to finish.
      // It can run in the background.
      incrementProductViewCount(product.id);
    }
  }, [isOpen, product]);

  if (!product) return null;

  const details = {
    "Артикул": product.article_number,
    "Номер продукта": product.product_number,
    "Производитель": product.manufacturer,
    "Количество на складе": product.stock_quantity,
    "Категория": product.category,
    "Вес, кг": product.weight,
    "Размеры (ШxДxВ), мм": `${product.sizeW || '-'}x${product.sizeL || '-'}x${product.sizeH || '-'}`,
    "Совместимость": product.compatible_with_models
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{product.name}</DialogTitle>
          <DialogDescription>
            {product.description}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                 <Image
                    src={product.photo_url || '/placeholder.png'}
                    alt={`Image of ${product.name}`}
                    fill
                    className="object-cover"
                />
            </div>
            <div>
                <h3 className="font-semibold mb-2">Детали</h3>
                <Table>
                    <TableBody>
                        {Object.entries(details).map(([key, value]) => (
                            value ? (
                                <TableRow key={key}>
                                    <TableCell className="font-medium text-muted-foreground text-xs w-1/3">{key}</TableCell>
                                    <TableCell className="text-sm">{String(value)}</TableCell>
                                </TableRow>
                            ) : null
                        ))}
                    </TableBody>
                </Table>
                 <div className="mt-4 flex justify-between items-center">
                    <div className="text-2xl font-bold">{(product.price1 || 0).toLocaleString('ru-RU')} BYN</div>
                    <Badge>{product.stock_quantity ? `В наличии: ${product.stock_quantity}` : 'Нет в наличии'}</Badge>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

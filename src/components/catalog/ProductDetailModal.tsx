
'use client';

import { useEffect } from 'react';
import type { Product } from '@/lib/definitions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Image from 'next/image';
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

  // The component now receives the final price, no logic needed here.
  const price = product.price;

  const details = {
    "Артикул": product.article_number,
    "Номер продукта": product.product_number,
    "Производитель": product.manufacturer,
    "Категория": product.category,
    "Вес, граммы": product.weight,
    "Размеры (ШxДxВ), мм": `${product.sizeW || '-'}x${product.sizeL || '-'}x${product.sizeH || '-'}`
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
                        {product.compatible_with_models && (
                            <TableRow>
                                <TableCell className="font-medium text-muted-foreground text-xs w-1/3 align-top">Совместимость</TableCell>
                                <TableCell className="text-sm">
                                  <p className="leading-relaxed break-words whitespace-pre-wrap">
                                      {product.compatible_with_models.replace(/;/g, '; ')}
                                  </p>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                 <div className="mt-4 flex justify-between items-center">
                    <div className="text-2xl font-bold">{price ? `${price.toLocaleString('ru-RU')} BYN` : 'Цена по запросу'}</div>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

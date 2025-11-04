
'use client';

import Image from 'next/image';
import type { Product } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';

interface ProductCarouselCardProps {
  product: Product;
}

export default function ProductCarouselCard({ product }: ProductCarouselCardProps) {
  return (
    <div className="p-1 h-full">
      <div className="border rounded-lg p-4 bg-card text-card-foreground flex flex-col h-full cursor-pointer">
        <div className="relative w-full h-32 mb-4 bg-muted rounded-md overflow-hidden">
          <Image
            src={product.photo_url || '/placeholder.png'}
            alt={`Image of ${product.name}`}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 hover:scale-110"
          />
        </div>
        <p className="text-xs text-muted-foreground">{product.article_number}</p>
        <h3 className="font-semibold text-sm leading-tight flex-grow mb-2" title={product.name}>
          {product.name}
        </h3>
        <div className="mt-auto flex justify-between items-center">
            <p className="text-lg font-bold">{(product.price1 || 0).toLocaleString('ru-RU')} BYN</p>
            <Button size="sm" variant="outline">
                <ShoppingCart className="h-4 w-4" />
            </Button>
        </div>
      </div>
    </div>
  );
}

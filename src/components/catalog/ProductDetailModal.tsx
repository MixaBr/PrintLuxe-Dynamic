
'use client';

import { useState, useEffect } from 'react';
import Autoplay from "embla-carousel-autoplay";
import type { Product } from '@/lib/definitions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableRow } from '../ui/table';
import { incrementProductViewCount } from '@/app/catalog/actions';
import { ScrollArea } from '../ui/scroll-area';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { Button } from '../ui/button';
import { ShoppingCart } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export default function ProductDetailModal({ product, isOpen, onClose, onAddToCart }: ProductDetailModalProps) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [api, setApi] = useState<CarouselApi | undefined>();
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      incrementProductViewCount(product.id);
    }
  }, [isOpen, product]);

  useEffect(() => {
    if (!api) {
      return;
    }
    if (lightboxImage || isHovering) {
      api.plugins().autoplay?.stop();
    } else {
      api.plugins().autoplay?.play();
    }
  }, [api, lightboxImage, isHovering]);

  if (!product) return null;

  const price = product.price;

  const details = {
    "Артикул": product.article_number,
    "Номер продукта": product.product_number,
    "Производитель": product.manufacturer,
    "Категория": product.category,
    "Вес, г": product.weight,
    "Размеры (ШxДxВ), мм": `${product.sizeW || '-'}x${product.sizeL || '-'}x${product.sizeH || '-'}`
  };
  
  let allImages: string[] = [];
    if (typeof product.image_urls === 'string') {
    allImages = (product.image_urls as string)
      .slice(1, -1) // Remove { and }
      .split('","') // Split by ","
      .map(url => url.replace(/^"|"$/g, '')); // Remove surrounding quotes from each URL
  } else if (Array.isArray(product.image_urls)) {
      allImages = product.image_urls;
  }
  
  if (allImages.length === 0 && product.photo_url) {
    allImages.push(product.photo_url);
  }

  const hasMultipleImages = allImages.length > 1;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl lg:max-w-6xl max-h-[90vh] flex flex-col">
          <DialogHeader className='p-6'>
            <DialogTitle className="font-headline text-2xl">{product.name}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 flex-1 overflow-y-auto p-6 pt-0">
            <div 
              className="md:col-span-2 relative bg-muted rounded-lg overflow-hidden min-h-[300px]"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
               {hasMultipleImages ? (
                 <Carousel
                    setApi={setApi}
                    plugins={[
                      Autoplay({
                        delay: 3000,
                        stopOnInteraction: true,
                      }),
                    ]}
                    opts={{ loop: true }}
                    className="w-full h-full"
                >
                    <CarouselContent>
                        {allImages.map((url, index) => (
                            <CarouselItem key={index} className="relative aspect-square" onDoubleClick={() => setLightboxImage(url)}>
                                <Image
                                    src={url}
                                    alt={`Image ${index + 1} of ${product.name}`}
                                    fill
                                    sizes="(min-width: 1360px) 583px, (min-width: 780px) calc(45.45vw - 33px), calc(100vw - 32px)"
                                    className="object-contain cursor-pointer"
                                />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2" />
                    <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2" />
                </Carousel>
               ) : (
                allImages.length > 0 && <Image
                    src={allImages[0]}
                    alt={`Image of ${product.name}`}
                    fill
                    sizes="(min-width: 1360px) 583px, (min-width: 780px) calc(45.45vw - 33px), calc(100vw - 32px)"
                    className="object-contain"
                    onDoubleClick={() => allImages[0] && setLightboxImage(allImages[0])}
                />
               )}
            </div>
            <div className='md:col-span-3'>
                {product.description && (
                    <ScrollArea className="max-h-[200px] w-full pr-4 mb-4">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {product.description}
                        </p>
                    </ScrollArea>
                )}
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
                 <Button onClick={() => onAddToCart(product)}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  В корзину
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox Dialog */}
      <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="max-w-5xl h-[90vh] bg-transparent border-none shadow-none">
           <DialogHeader>
              <DialogTitle className="sr-only">{`Увеличенное изображение: ${product.name}`}</DialogTitle>
              <DialogDescription className="sr-only">Это модальное окно отображает увеличенную версию изображения продукта для детального просмотра.</DialogDescription>
           </DialogHeader>
          {lightboxImage && (
              <Image
                src={lightboxImage}
                alt={`Увеличенное изображение ${product.name}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-contain"
            />
          )}
           <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white bg-black rounded-full p-2"
            aria-label="Закрыть увеличенное изображение"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}

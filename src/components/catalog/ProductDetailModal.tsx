
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

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductDetailModal({ product, isOpen, onClose }: ProductDetailModalProps) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [api, setApi] = useState<CarouselApi | undefined>();
  // New state to track hover status
  const [isHovering, setIsHovering] = useState(false);

  // Increment view count when the main modal opens
  useEffect(() => {
    if (isOpen && product) {
      incrementProductViewCount(product.id);
    }
  }, [isOpen, product]);

  // Centralized effect to control the autoplay
  useEffect(() => {
    if (!api) {
      return;
    }

    // If lightbox is open OR user is hovering, stop autoplay.
    if (lightboxImage || isHovering) {
      api.plugins().autoplay?.stop();
    } else {
      // Otherwise, play it.
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
      allImages = product.image_urls
          .slice(1, -1).split('","').map(url => url.replace(/^"|"$/g, '')); 
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
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">{product.name}</DialogTitle>
            <ScrollArea className="max-h-32 w-full pr-4">
              <DialogDescription className="text-sm text-muted-foreground whitespace-pre-wrap">
                {product.description}
              </DialogDescription>
            </ScrollArea>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Add mouse listeners to the container */}
            <div 
              className="relative aspect-square bg-muted rounded-lg overflow-hidden"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
               {hasMultipleImages ? (
                 <Carousel
                    setApi={setApi}
                    plugins={[
                      Autoplay({
                        delay: 3000,
                        stopOnInteraction: true, // Keep this to stop on manual drag/click
                        // stopOnMouseEnter is no longer needed, we control it manually
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
                sizes="calc(100vw - 48px)"
                className="object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

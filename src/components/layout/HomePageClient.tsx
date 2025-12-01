
'use client';

import type { HomePageData } from '@/lib/slide-data';
import type { Product } from '@/lib/data';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import ProductCarouselCard from '../catalog/ProductCarouselCard';
import { Sidebar } from './Sidebar';
import { getContactPageData } from '@/lib/contact-data';
import { useState, useEffect } from 'react';
import Autoplay from "embla-carousel-autoplay";
import { useCartStore } from '@/hooks/use-cart-store';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';
import Link from 'next/link';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface HomePageClientProps {
  homePageData: HomePageData;
  featuredProducts: Product[];
}

export default function HomePageClient({ homePageData, featuredProducts }: HomePageClientProps) {
  const [contactData, setContactData] = useState<Awaited<ReturnType<typeof getContactPageData>> | null>(null);
  const { addToCart } = useCartStore();
  const { toast } = useToast();

  useEffect(() => {
    getContactPageData().then(setContactData);
  }, []);

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    toast({
      title: 'Успех!',
      description: `Товар "${product.name}" добавлен в корзину.`,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8 h-full">
      
      {/* Sidebar - hidden on mobile */}
      <aside className="hidden md:block md:col-span-1 lg:col-span-1 px-4 md:px-0">
         {contactData && <Sidebar contactData={contactData} />}
      </aside>

      {/* Main Content */}
      <main className="md:col-span-3 lg:col-span-4 flex flex-col px-4 md:px-8 overflow-y-auto">
          {homePageData?.error ? (
               <div className="text-center text-white bg-red-500/20 p-8 rounded-lg">
                  <h2 className="text-2xl font-bold font-headline">Ошибка загрузки</h2>
                  <p className="mt-2">{homePageData.error}</p>
               </div>
          ) : (
              <div className="w-full">
                  <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold font-headline text-white">{homePageData.hero.title}</h1>
                    <p className="mt-2 max-w-2xl mx-auto text-lg md:text-xl text-white/90">
                      {homePageData.hero.subtitle}
                    </p>
                  </div>
                  <h2 className="text-2xl font-bold font-headline text-white text-center mb-4">{homePageData.featured.title}</h2>
                  {featuredProducts?.length > 0 ? (
                     <div className="flex w-full flex-col items-center justify-center">
                       <Carousel
                          opts={{ align: "start", loop: featuredProducts.length > 4 }}
                          plugins={[
                              Autoplay({
                                delay: 5000,
                              }),
                          ]}
                          className="w-full"
                      >
                          <CarouselContent className="-ml-2">
                              {featuredProducts.map((product) => (
                              <CarouselItem key={product.id} className="pl-2 basis-full sm:basis-1/2 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                                  <ProductCarouselCard product={product} onAddToCart={handleAddToCart} />
                              </CarouselItem>
                              ))}
                          </CarouselContent>
                          <div className="xl:hidden">
                              <CarouselPrevious className="absolute left-[-1.5rem] top-1/2 -translate-y-1/2" />
                              <CarouselNext className="absolute right-[-1.5rem] top-1/2 -translate-y-1/2" />
                          </div>
                     </Carousel>
                      <Button asChild variant="link" className="mt-4 text-white">
                          <Link href="/catalog">Посмотреть в каталоге подробней</Link>
                      </Button>
                     </div>
                  ) : (
                       <div className="flex items-center justify-center h-64 bg-black/20 rounded-lg">
                          <p className="text-white/70">Рекомендуемые товары скоро появятся.</p>
                       </div>
                  )}

                  <h2 className="text-2xl font-bold font-headline text-white text-center mt-8">Новости</h2>
                  <div className="mt-4">
                      <Card className="bg-black/20 border border-white/10 text-white h-96">
                          <CardContent className="p-0 h-full">
                              <ScrollArea className="h-full">
                                  <div className="p-4 space-y-4">
                                      {[...Array(10)].map((_, i) => (
                                          <div key={i} className="p-3 bg-white/5 rounded-md">
                                              <p className="font-semibold text-sm">Новость #{i + 1}</p>
                                              <p className="text-xs text-white/70">Краткое описание для новости, которое может занимать пару строк.</p>
                                          </div>
                                      ))}
                                  </div>
                              </ScrollArea>
                          </CardContent>
                      </Card>
                  </div>
              </div>
          )}
      </main>
    </div>
  );
}

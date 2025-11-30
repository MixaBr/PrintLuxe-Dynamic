
'use client';

import type { HomePageData } from '@/lib/slide-data';
import type { Product } from '@/lib/data';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import ProductCarouselCard from '../catalog/ProductCarouselCard';
import { Sidebar } from './Sidebar';
import { getContactPageData } from '@/lib/contact-data';
import { useState, useEffect } from 'react';
import Autoplay from "embla-carousel-autoplay";

interface HomePageClientProps {
  homePageData: HomePageData;
  featuredProducts: Product[];
}

export default function HomePageClient({ homePageData, featuredProducts }: HomePageClientProps) {
  const [contactData, setContactData] = useState<Awaited<ReturnType<typeof getContactPageData>> | null>(null);

  useEffect(() => {
    getContactPageData().then(setContactData);
  }, []);

  return (
    <div className="container mx-auto px-4 md:px-8 h-full">
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8 h-full pt-4">
        
        {/* Sidebar */}
        <aside className="hidden md:block md:col-span-1 lg:col-span-1">
           {contactData && <Sidebar contactData={contactData} />}
        </aside>

        {/* Main Content */}
        <div className="md:col-span-3 lg:col-span-4 flex flex-col">
            {homePageData?.error ? (
                 <div className="text-center text-white bg-red-500/20 p-8 rounded-lg">
                    <h2 className="text-2xl font-bold font-headline">Ошибка загрузки</h2>
                    <p className="mt-2">{homePageData.error}</p>
                 </div>
            ) : (
                <div className="w-full">
                    <h2 className="text-2xl font-bold font-headline text-white text-center mb-4">Витрина популярных позиций каталога</h2>
                    {featuredProducts?.length > 0 ? (
                        <Carousel
                            opts={{ align: "start", loop: featuredProducts.length > 4 }}
                            plugins={[
                                Autoplay({
                                  delay: 5000,
                                }),
                            ]}
                            className="w-full"
                        >
                            <CarouselContent>
                                {featuredProducts.map((product) => (
                                <CarouselItem key={product.id} className="sm:basis-1/2 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                                    <ProductCarouselCard product={product} onAddToCart={() => {}} />
                                </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious />
                            <CarouselNext />
                        </Carousel>
                    ) : (
                         <div className="flex items-center justify-center h-64 bg-black/20 rounded-lg">
                            <p className="text-white/70">Рекомендуемые товары скоро появятся.</p>
                         </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

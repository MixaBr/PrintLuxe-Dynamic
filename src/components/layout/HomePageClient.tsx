
'use client';

import { useState, useEffect } from 'react';
import type { HomePageData } from '@/lib/slide-data';
import type { Product } from '@/lib/data';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import ProductCarouselCard from '../catalog/ProductCarouselCard';
import ProductDetailModal from '../catalog/ProductDetailModal';
import { Sidebar } from './Sidebar';
import { getContactPageData } from '@/lib/contact-data';
import Autoplay from "embla-carousel-autoplay";
import { useCartStore } from '@/hooks/use-cart-store';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';
import Link from 'next/link';
import { Card, CardContent } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { getFullProductDetails } from '@/app/catalog/actions';
import { Footer } from '@/components/layout/Footer';
import type { News } from '@/lib/news-data';
import { formatNewsDate, getNewsBySlug } from '@/lib/news-data';
import NewsDetailModal from '../news/NewsDetailModal';

interface HomePageClientProps {
  homePageData: HomePageData;
  featuredProducts: Product[];
  recentNews: News[];
  error?: string; 
}

export default function HomePageClient({ homePageData, featuredProducts, recentNews, error }: HomePageClientProps) {
  const [contactData, setContactData] = useState<Awaited<ReturnType<typeof getContactPageData>> | null>(null);
  const { addToCart } = useCartStore();
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);

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

  const handleProductCardClick = async (product: Product) => {
    const fullProduct = await getFullProductDetails(product.id);
    setSelectedProduct(fullProduct || product);
  };
  
  const handleNewsClick = async (slug: string | undefined) => {
    if (!slug) return;
    const newsItem = await getNewsBySlug(slug);
    setSelectedNews(newsItem);
  };

  const hasContactError = contactData && 'error' in contactData;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8">
        
        <aside className="hidden md:flex flex-col md:col-span-1 lg:col-span-1 px-4 md:px-0 sticky top-20 self-start">
          {hasContactError ? (
            <div className="text-center text-white bg-red-500/20 p-4 rounded-lg">
                <p className="text-sm">Ошибка загрузки контактов</p>
            </div>
          ) : (
            contactData && <Sidebar contactData={contactData} />
          )}
        </aside>

        <main className="md:col-span-3 lg:col-span-4 flex flex-col px-4 md:px-8 space-y-8 py-8">
            {error ? (
                <div className="text-center text-white bg-red-500/20 p-8 rounded-lg">
                    <h2 className="text-2xl font-bold font-headline">Ошибка загрузки</h2>
                    <p className="mt-2">{error}</p>
                </div>
            ) : (
                <>
                    <div className="text-center">
                      <h1 className="text-3xl md:text-4xl font-bold font-headline text-white">{homePageData.hero.title}</h1>
                      <p className="mt-2 max-w-2xl mx-auto text-lg md:text-xl text-white/90">
                        {homePageData.hero.subtitle}
                      </p>
                    </div>
                    
                    <div className="pt-8">
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
                                      <ProductCarouselCard 
                                        product={product} 
                                        onAddToCart={handleAddToCart}
                                        onClick={() => handleProductCardClick(product)}
                                      />
                                  </CarouselItem>
                                  ))}
                              </CarouselContent>
                              <div className="xl:hidden">
                                  <CarouselPrevious className="absolute left-[-1.5rem] top-1/2 -translate-y-1/2" />
                                  <CarouselNext className="absolute right-[-1.5rem] top-1/2 -translate-y-1/2" />
                              </div>
                        </Carousel>
                          <Button asChild variant="link" className="mt-4 text-white text-2xl h-auto whitespace-normal text-center">
                            <Link href="/catalog">Посмотреть в каталоге подробней</Link>
                          </Button>
                        </div>
                      ) : (
                          <div className="flex items-center justify-center h-64 bg-black/20 rounded-lg">
                              <p className="text-white/70">Рекомендуемые товары скоро появятся.</p>
                          </div>
                      )}
                    </div>

                    <div className="pt-8">
                      <h2 className="text-2xl font-bold font-headline text-white text-center">Новости</h2>
                       <div className="mt-4">
                          <Card className="bg-black/20 border border-white/10 text-white">
                              <CardContent className="p-0">
                                  <ScrollArea className="h-[26rem]">
                                      <div className="p-4 space-y-4">
                                          {recentNews && recentNews.length > 0 ? (
                                            recentNews.map((newsItem) => (
                                                <div key={newsItem.id} className="p-3 bg-white/5 rounded-md hover:bg-white/10 transition-colors cursor-pointer" onClick={() => handleNewsClick(newsItem.slug)}>
                                                    <div className="flex justify-between items-baseline gap-4">
                                                      <p className="font-semibold text-lg">{newsItem.title}</p>
                                                      {newsItem.published_at && (
                                                          <p className="text-lg text-white/50 flex-shrink-0">{formatNewsDate(newsItem.published_at)}</p>
                                                      )}
                                                    </div>
                                                    <p className="text-lg text-white/70 mt-1">{newsItem.excerpt}</p>
                                                </div>
                                            ))
                                          ) : (
                                            <div className="flex items-center justify-center h-full p-8 min-h-[10rem]">
                                              <p className="text-white/50">Пока нет новостей.</p>
                                            </div>
                                          )}
                                      </div>
                                  </ScrollArea>
                              </CardContent>
                          </Card>
                      </div>
                    </div>
                </>
            )}
        </main>
        
        <div className="md:hidden">
          <Footer />
        </div>

      </div>
      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />
      <NewsDetailModal 
        newsItem={selectedNews}
        isOpen={!!selectedNews}
        onClose={() => setSelectedNews(null)}
      />
    </>
  );
}

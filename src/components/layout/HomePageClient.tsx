
'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link'; 
import Slide from '@/components/layout/Slide';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { HomePageData } from '@/lib/slide-data';
import type { Product } from '@/lib/data';
import ProductCard from '@/components/products/ProductCard';

interface HomePageClientProps {
  homePageData: HomePageData;
  featuredProducts: Product[];
}

export default function HomePageClient({ homePageData, featuredProducts }: HomePageClientProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const slide1Ref = useRef<HTMLDivElement>(null);
  const slide2Ref = useRef<HTMLDivElement>(null);
  const slide3Ref = useRef<HTMLDivElement>(null);
  const slide4Ref = useRef<HTMLDivElement>(null);

  const slideRefs = [slide1Ref, slide2Ref, slide3Ref, slide4Ref];
  const [visibleSlide, setVisibleSlide] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const slideIndex = slideRefs.findIndex((ref) => ref.current === entry.target);
            if (slideIndex !== -1) {
              setVisibleSlide(slideIndex);
            }
          }
        });
      },
      { root: scrollContainerRef.current, threshold: 0.7 }
    );

    slideRefs.forEach((ref) => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => {
      slideRefs.forEach((ref) => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      });
    };
  }, [slideRefs, scrollContainerRef]);

  const scrollToSlide = (slideIndex: number) => {
    if (slideIndex >= 0 && slideIndex < slideRefs.length) {
      slideRefs[slideIndex].current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative h-full">
      <div ref={scrollContainerRef} className="snap-y snap-mandatory h-full overflow-y-scroll no-scrollbar">

        {/* Slide 1 - Hero */}
        <div ref={slide1Ref} className="h-full w-full flex-shrink-0 snap-start">
          <Slide>
            <div className="text-center text-white px-4">
              {homePageData?.error ? (
                <>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-headline text-red-500">Ошибка загрузки</h1>
                  <p className="mt-4 text-lg md:text-xl">{homePageData.error}</p>
                </>
              ) : (
                <>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-headline">
                    Надежный сервис<br />для вашей техники
                  </h1>
                  <p className="mt-4 text-base sm:text-lg md:text-xl">
                    Профессиональный ремонт,<br />
                    обслуживание и качественные запчасти<br />
                    для бесперебойной работы вашего офиса
                  </p>
                </>
              )}
            </div>
          </Slide>
        </div>

        {/* Slide 2 - Featured Parts */}
        <div ref={slide2Ref} className="h-full w-full flex-shrink-0 snap-start flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center text-white w-full max-w-7xl mx-auto">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-headline">{homePageData?.featured?.title}</h2>
              <p className="mt-2 text-base sm:text-lg md:text-xl max-w-3xl mx-auto">{homePageData?.featured?.subtitle}</p>
              {featuredProducts?.length > 0 ? (
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                      {featuredProducts.map(product => (
                          <ProductCard key={product.id} product={product} />
                      ))}
                  </div>
              ) : (
                  <p className="mt-4">Рекомендуемые товары скоро появятся.</p>
              )}
              <div className="mt-8">
                  <Link href="/catalog" className="inline-block bg-white/20 border border-white/30 backdrop-blur-sm text-white font-bold py-3 px-8 rounded hover:bg-white/30 transition-colors duration-200 text-lg">
                      Перейти в каталог
                  </Link>
              </div>
          </div>
        </div>

        {/* Slide 3 - Services */}
        <div ref={slide3Ref} className="h-full w-full flex-shrink-0 snap-start flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white w-full max-w-5xl mx-auto">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-headline">{homePageData?.services?.title}</h2>
              <p className="mt-4 text-base sm:text-lg md:text-xl max-w-3xl mx-auto">{homePageData?.services?.subtitle}</p>
              {(homePageData?.services?.list || []).length > 0 && (
                  <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                      {(homePageData.services.list || []).map(service => (
                          <div key={service.title} className="bg-white/10 p-6 rounded-lg backdrop-blur-sm text-center">
                              <h3 className="font-bold text-xl">{service.title}</h3>
                              <p className="mt-2 opacity-80 text-base">{service.description}</p>
                          </div>
                      ))}
                  </div>
              )}
          </div>
        </div>

        {/* Slide 4 - Benefits */}
        <div ref={slide4Ref} className="h-full w-full flex-shrink-0 snap-start">
          <Slide>
            <div className="text-center text-white w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-headline">{homePageData?.benefits?.title}</h2>
                <p className="mt-4 text-base sm:text-lg md:text-xl">{homePageData?.benefits?.subtitle}</p>
                {(homePageData?.benefits?.list || []).length > 0 && (
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                        {(homePageData.benefits.list || []).map(benefit => (
                            <div key={benefit.title} className="bg-white/10 p-6 rounded-lg text-center">
                                <h3 className="font-bold text-xl">{benefit.title}</h3>
                                <p className="mt-2 opacity-80">{benefit.description}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          </Slide>
        </div>

      </div>

      {/* Fixed Navigation Buttons */}
      <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 hidden md:flex flex-col space-y-4 z-20">
        {visibleSlide > 0 && (
          <button
            onClick={() => scrollToSlide(visibleSlide - 1)}
            className={`p-2 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-sm hover:bg-white/40 hover:scale-110 animate-bounce-up`}
            aria-label="Прокрутить вверх"
          >
            <ChevronUp className="w-6 h-6" />
          </button>
        )}
        {visibleSlide < slideRefs.length - 1 && (
          <button
            onClick={() => scrollToSlide(visibleSlide + 1)}
            className={`p-2 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-sm hover:bg-white/40 hover:scale-110 animate-bounce-down`}
            aria-label="Прокрутить вниз"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}

'use client';

import { useRef, useState, useEffect } from 'react';
import Slide from '@/components/layout/Slide';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { Product } from '@/lib/data';

interface HomePageClientProps {
  featuredProducts: Product[];
}

export default function HomePageClient({ featuredProducts }: HomePageClientProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const slide1Ref = useRef<HTMLDivElement>(null);
  const slide2Ref = useRef<HTMLDivElement>(null);
  const slide3Ref = useRef<HTMLDivElement>(null);

  const slideRefs = [slide1Ref, slide2Ref, slide3Ref];
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
        {/* Slide 1 */}
        <div ref={slide1Ref} className="h-full w-full flex-shrink-0 snap-start">
          <Slide>
            <div className="text-center text-white">
              <h1 className="text-4xl md:text-6xl font-bold font-headline">Добро пожаловать в PrintLuxe</h1>
              <p className="mt-4 text-lg md:text-xl">Ваш надежный партнер в мире дизайна и печати.</p>
            </div>
          </Slide>
        </div>

        {/* Slide 2 */}
        <div ref={slide2Ref} className="h-full w-full flex-shrink-0 snap-start">
          <Slide>
            <div className="text-center text-white">
              <h2 className="text-3xl md:text-5xl font-bold font-headline">Наши лучшие предложения</h2>
              {/* Featured products will be displayed here */}
            </div>
          </Slide>
        </div>

        {/* Slide 3 */}
        <div ref={slide3Ref} className="h-full w-full flex-shrink-0 snap-start">
          <Slide>
            <div className="text-center text-white">
              <h2 className="text-3xl md:text-5xl font-bold font-headline">Свяжитесь с нами</h2>
              <p className="mt-4 text-lg md:text-xl">Готовы начать проект? Мы всегда на связи.</p>
            </div>
          </Slide>
        </div>
      </div>

      {/* Fixed Navigation Buttons */}
      <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 flex flex-col space-y-4 z-20">
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

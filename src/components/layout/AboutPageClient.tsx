
/* eslint-disable max-len */
"use client";

import Image from 'next/image';
import { Award, Users, Target, ChevronUp, ChevronDown } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import type { AboutPageData } from '@/lib/about-data';

interface AboutPageClientProps {
  aboutData: AboutPageData;
}

export default function AboutPageClient({ aboutData }: AboutPageClientProps) {
  const values = [
    { icon: <Award className="h-10 w-10 text-primary" />, title: "Качество", description: "Мы стремимся к совершенству в каждой детали, от выбора материалов до финального продукта." },
    { icon: <Users className="h-10 w-10 text-primary" />, title: "Клиенты", description: "Наши клиенты — наш главный приоритет. Мы строим долгосрочные и доверительные отношения." },
    { icon: <Target className="h-10 w-10 text-primary" />, title: "Инновации", description: "Мы постоянно ищем и внедряем новые технологии для достижения наилучших результатов." },
  ];

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const slide1Ref = useRef<HTMLDivElement>(null);
  const slide2Ref = useRef<HTMLDivElement>(null);

  const slideRefs = [slide1Ref, slide2Ref];
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
  }, [slideRefs]);

  const scrollToSlide = (slideIndex: number) => {
    if (slideIndex >= 0 && slideIndex < slideRefs.length) {
      slideRefs[slideIndex].current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (aboutData.error) {
    return (
        <div className="h-full flex items-center justify-center text-white text-center px-4">
             <h1 className="text-3xl font-bold text-red-500">Ошибка</h1>
             <p className="text-xl mt-4">{aboutData.error}</p>
        </div>
    );
  }

  return (
    <div className="relative h-full">
      <div ref={scrollContainerRef} className="snap-y snap-mandatory h-full overflow-y-scroll no-scrollbar">

        {/* Slide 1: Story and Mission */}
        <div ref={slide1Ref} className="h-full w-full flex-shrink-0 snap-start flex flex-col justify-center">
            <div className="container mx-auto h-full flex flex-col justify-center py-8 md:py-12">
                <div className="text-center text-white mb-8">
                    <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold">{aboutData.main_title}</h1>
                    <p className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-white/80">
                        {aboutData.main_subtitle}
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 flex-grow items-stretch">
                <div className="text-white prose-lg max-w-none text-justify flex flex-col justify-center">
                    <div>
                        <h2 className="font-headline text-3xl font-semibold text-white">{aboutData.history_title}</h2>
                        <p>{aboutData.history_p1}</p>
                    </div>
                    <div className="mt-8">
                        <h2 className="font-headline text-3xl font-semibold text-white">{aboutData.mission_title}</h2>
                        <p>{aboutData.mission_description}</p>
                    </div>
                </div>
                <div className="min-h-[300px] md:min-h-0 h-full w-full relative rounded-lg overflow-hidden shadow-2xl">
                    {aboutData.workshop_image_url && (
                    <Image
                        src={aboutData.workshop_image_url}
                        alt="Our Workshop"
                        fill
                        className="object-cover"
                        priority
                        sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    )}
                </div>
                </div>
            </div>
        </div>

        {/* Slide 2: Values */}
        <div ref={slide2Ref} className="h-full w-full flex-shrink-0 snap-start flex flex-col justify-center">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center text-white">
                <div className="text-center">
                    <h2 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold">{aboutData.values_title}</h2>
                    <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-white/80">{aboutData.values_description}</p>
                </div>
                <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
                    {values.map(value => (
                        <div key={value.title} className="bg-black/20 p-8 rounded-xl shadow-lg text-center backdrop-blur-sm border border-white/10">
                        <div className="flex justify-center items-center h-16 w-16 bg-white/10 mx-auto rounded-full">
                            {value.icon}
                        </div>
                        <h3 className="mt-6 font-headline text-2xl font-semibold">{value.title}</h3>
                        <p className="mt-4 text-white/80">{value.description}</p>
                        </div>
                    ))}
                </div>
            </div>
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
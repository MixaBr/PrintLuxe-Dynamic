
'use client';

import Image from 'next/image';
import { Award, Users, Target } from 'lucide-react';
import type { AboutPageData } from '@/lib/about-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AboutPageClientProps {
  aboutData: AboutPageData;
}

export default function AboutPageClient({ aboutData }: AboutPageClientProps) {
  if (aboutData.error) {
    return (
      <div className="h-full flex items-center justify-center text-white text-center px-4">
        <h1 className="text-3xl font-bold text-red-500">Ошибка</h1>
        <p className="text-xl mt-4">{aboutData.error}</p>
      </div>
    );
  }

  const values = [
    { 
      icon: <Award className="h-8 w-8 text-white" />, 
      title: "Качество", 
      description: "Мы стремимся к совершенству в каждой детали, от выбора материалов до финального продукта." 
    },
    { 
      icon: <Users className="h-8 w-8 text-white" />, 
      title: "Клиенты", 
      description: "Наши клиенты — наш главный приоритет. Мы строим долгосрочные и доверительные отношения." 
    },
    { 
      icon: <Target className="h-8 w-8 text-white" />, 
      title: "Инновации", 
      description: "Мы постоянно ищем и внедряем новые технологии для достижения наилучших результатов." 
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12 md:px-8 md:py-16 text-white">
      {/* Hero Section */}
      <div className="text-center mb-12 md:mb-16">
        <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold">{aboutData.main_title}</h1>
        <p className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-white/80">
          {aboutData.main_subtitle}
        </p>
      </div>

      {/* History and Mission Section */}
      <Card className="bg-black/30 border-white/20 backdrop-blur-sm mb-12 md:mb-16">
        <div className="grid md:grid-cols-2 items-center">
          <div className="p-6 md:p-8 order-2 md:order-1">
            <h2 className="font-headline text-3xl font-semibold mb-4 text-white">{aboutData.history_title}</h2>
            <p className="text-white/80 leading-relaxed mb-8">{aboutData.history_p1}</p>
            
            <h2 className="font-headline text-3xl font-semibold mb-4 text-white">{aboutData.mission_title}</h2>
            <p className="text-white/80 leading-relaxed">{aboutData.mission_description}</p>
          </div>
          <div className="relative h-64 md:h-full w-full order-1 md:order-2">
            {aboutData.workshop_image_url && (
              <Image
                src={aboutData.workshop_image_url}
                alt="Our Workshop"
                fill
                className="object-cover rounded-t-lg md:rounded-r-lg md:rounded-l-none"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            )}
          </div>
        </div>
      </Card>

      {/* Values Section */}
      <div className="text-center mb-12">
        <h2 className="font-headline text-4xl md:text-5xl font-bold text-white">{aboutData.values_title}</h2>
        <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-white/80">{aboutData.values_description}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {values.map((value) => (
          <Card key={value.title} className="bg-black/30 border-white/20 backdrop-blur-sm text-center p-6 hover:bg-black/50 transition-colors">
            <CardHeader className="p-0 items-center">
              <div className="flex justify-center items-center h-16 w-16 bg-white/10 rounded-full mb-4">
                {value.icon}
              </div>
              <CardTitle className="font-headline text-2xl text-white">{value.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 mt-4">
              <p className="text-white/80">{value.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

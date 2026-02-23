
'use client';

import type { ServicesPageData } from '@/lib/services-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer, Droplets, Wrench, Scan, Laptop, DatabaseBackup } from 'lucide-react';
import { ComponentType } from 'react';

interface ServicesPageClientProps {
  servicesData: ServicesPageData;
}

const iconMap: Record<string, ComponentType<{className?: string}>> = {
  'Ремонт принтеров и МФУ': Printer,
  'Заправка и восстановление картриджей': Droplets,
  'Техническое обслуживание': Wrench,
  'Ремонт сканеров': Scan,
  'Ремонт ноутбуков': Laptop,
  'Восстановление данных': DatabaseBackup,
};

const getIconForService = (title: string): ComponentType<{className?: string}> => {
    const matchingKey = Object.keys(iconMap).find(key => title.includes(key));
    return matchingKey ? iconMap[matchingKey] : Wrench;
};


export default function ServicesPageClient({ servicesData }: ServicesPageClientProps) {
  if (servicesData.error) {
    return (
      <div className="h-full flex items-center justify-center text-white text-center px-4">
        <h1 className="text-3xl font-bold text-red-500">Ошибка</h1>
        <p className="text-xl mt-4">{servicesData.error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:px-8 md:py-16 text-white">
      <div className="text-center mb-12 md:mb-16">
        <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold text-white">
          {servicesData.main_title}
        </h1>
        <p className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-white/80">
          {servicesData.main_subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {servicesData.services.map((service, index) => {
          const Icon = getIconForService(service.title);
          return (
            <Card key={index} className="bg-black/30 border-white/20 backdrop-blur-sm text-center p-6 hover:bg-black/50 transition-colors flex flex-col">
              <CardHeader className="p-0 items-center">
                <div className="flex justify-center items-center h-16 w-16 bg-white/10 rounded-full mb-4">
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="font-headline text-2xl text-white">{service.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-0 mt-4 flex-grow">
                <p className="text-white/80">{service.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  );
}

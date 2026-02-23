
'use client';

import type { FaqPageData } from '@/lib/faq-data';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from '@/components/ui/card';

interface FaqPageClientProps {
  faqData: FaqPageData;
}

export default function FaqPageClient({ faqData }: FaqPageClientProps) {
  if (faqData.error) {
    return (
      <div className="h-full flex items-center justify-center text-white text-center px-4">
        <h1 className="text-3xl font-bold text-red-500">Ошибка</h1>
        <p className="text-xl mt-4">{faqData.error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:px-8 md:py-16 text-white">
      <div className="text-center mb-12 md:mb-16">
        <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold text-white">
          {faqData.main_title}
        </h1>
        <p className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-white/80">
          {faqData.main_subtitle}
        </p>
      </div>

      <Card className="w-full max-w-4xl mx-auto bg-black/30 border-white/20 backdrop-blur-sm">
        <CardContent className="p-6">
          {faqData.faqs.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {faqData.faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-white/20">
                  <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-base text-white/80 pt-2">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-8 text-white/70">
              <p>Вопросы и ответы скоро появятся.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

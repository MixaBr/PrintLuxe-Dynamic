
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useState } from 'react'; // Added useState
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin, Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { submitContactForm, type ContactFormState } from '@/app/contact/actions';
import type { ContactPageData } from '@/lib/contact-data';
import Link from 'next/link';
import GoogleMaps from './GoogleMaps';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RecaptchaWidget } from '@/components/ui/RecaptchaWidget'; // Import RecaptchaWidget

// ... (Icon components remain the same)
const ViberIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props} fill="currentColor"><title>Viber</title><path d="M15.409 24c-1.846 0-3.34-1.493-3.34-3.34v-3.326c0-1.846 1.494-3.34 3.34-3.34h3.326c1.847 0 3.34 1.494 3.34 3.34v3.326c0 1.847-1.493 3.34-3.34 3.34h-3.326zm-1.89-3.34c0 .99.803 1.794 1.795 1.794h3.326c.99 0 1.794-.803 1.794-1.794v-3.326c0-.99-.803-1.794-1.794-1.794h-3.326c-.99 0-1.794.803-1.794 1.794v3.326h-.001zm-3.83-12.787c.215.42.33.88.33 1.37v.006c0 2.21-1.79 4-4 4s-4-1.79-4-4c0-2.21 1.79-4 4-4 .49 0 .95.085 1.37.245V0H.18A.18.18 0 0 0 0 .18v23.64c0 .099.08.18.18.18H8.88V9.126c.39.095.8.15 1.21.15.26 0 .52-.02.77-.06zm-4.11-6.195c-1.105 0-2 .895-2 2s.895 2 2 2 2-.895 2-2-.895-2-2-2z"/></svg>
);

const TelegramIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M48 24C48 37.2548 37.2548 48 24 48C10.7452 48 0 37.2548 0 24C0 10.7452 10.7452 0 24 0C37.2548 0 48 10.7452 48 24Z" fill="#2AABEE"/>
        <path d="M34.4299 14.8C33.7299 14.73 32.8499 14.9 32.4999 15.01L13.8899 22.39C12.3499 23.01 12.3599 23.95 13.5099 24.31L18.4299 25.82L21.0199 35.3C21.3699 36.64 22.2199 36.93 23.1499 36.23L26.9699 33.15L31.7599 37.03C32.9699 37.84 33.7599 37.49 34.0599 36.08L37.8199 18.02C38.1999 16.2 37.1299 15.3 36.1299 15.35L34.4299 14.8Z" fill="white"/>
        <path d="M18.89 31.06L21.01 25.81L32.41 17.51C33.11 17.06 32.56 16.71 31.96 17.1L20.21 24.61" fill="#C8DAEA"/>
    </svg>
);

const initialState: ContactFormState = {
  message: '',
  status: 'idle',
};

function SubmitButton({ isRecaptchaVerified }: { isRecaptchaVerified: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" className="w-full font-bold text-lg" disabled={pending || !isRecaptchaVerified}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Отправка...
        </>
      ) : (
        'Отправить'
      )}
    </Button>
  );
}

interface ContactPageClientProps {
    contactData: ContactPageData;
}

export default function ContactPageClient({ contactData }: ContactPageClientProps) {
  const [state, formAction] = useFormState(submitContactForm, initialState);
  const { toast } = useToast();
  const [isRecaptchaVerified, setIsRecaptchaVerified] = useState(false); // State for reCAPTCHA

  useEffect(() => {
    if (state.status === 'success') {
      toast({
        title: "Успех!",
        description: state.message,
      });
      setIsRecaptchaVerified(false); // Reset reCAPTCHA on success
    } else if (state.status === 'error' && state.message) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: state.message,
      });
       setIsRecaptchaVerified(false); // Reset reCAPTCHA on error
    }
  }, [state, toast]);

  if (contactData.error) {
      return (
          <div className="h-full flex items-center justify-center text-white text-center px-4">
              <div>
                  <h1 className="text-3xl font-bold text-destructive">Ошибка</h1>
                  <p className="text-xl mt-4">{contactData.error}</p>
              </div>
          </div>
      )
  }

  const lat = contactData.map_lat;
  const lng = contactData.map_lng;
  const zoom = contactData.map_zoom;
  const markerText = contactData.map_marker_text;

  return (
    <div className="text-white">
       <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 text-center">
        <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold text-white">{contactData.main_title}</h1>
        <p className="mt-4 max-w-3xl mx-auto text-base sm:text-lg text-gray-300">
          {contactData.main_subtitle}
        </p>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8 md:pb-12">
        
        {/* Contact Info Section */}
        <div className="mb-8">
            <h2 className="font-headline text-2xl sm:text-3xl font-semibold mb-6 text-white text-center">{contactData.info_title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
                
                {/* Address */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-4 group cursor-pointer"
                      >
                        <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center group-hover:bg-primary/30 transition-colors duration-300">
                          <MapPin className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-white">Наш адрес</h3>
                          <p className="text-gray-300 group-hover:text-white transition-colors duration-300 text-sm">{contactData.address}</p>
                        </div>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Кликните, чтобы проложить маршрут</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Phone */}
                {(contactData.phone_1 || contactData.phone_2) && (
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                            <Phone className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-white">Телефон</h3>
                            {contactData.phone_1 && <p className="text-gray-300 text-sm">{contactData.phone_1}</p>}
                            {contactData.phone_2 && <p className="text-gray-300 text-sm">{contactData.phone_2}</p>}
                        </div>
                    </div>
                )}

                {/* Email */}
                {contactData.email_main && (
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                            <Mail className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-white">Email</h3>
                            <a href={`mailto:${contactData.email_main}`} className="text-gray-300 hover:text-white transition text-sm">{contactData.email_main}</a>
                        </div>
                    </div>
                )}

                {/* Messengers */}
                 {(contactData.telegram_link || contactData.viber_link) && (
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                            <Send className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-white">Мессенджеры</h3>
                            <div className="flex items-center gap-3 mt-1">
                                {contactData.telegram_link && (
                                    <Link href={contactData.telegram_link} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition">
                                        <TelegramIcon className="w-10 h-10" />
                                        <span className="sr-only">Telegram</span>
                                    </Link>
                                )}
                                {contactData.viber_link && (
                                    <Link href={contactData.viber_link} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition">
                                        <ViberIcon className="w-10 h-10 text-white" />
                                        <span className="sr-only">Viber</span>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                 )}
            </div>
        </div>

        {/* Map and Form Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:items-stretch">
            {/* Map */}
            <div className="flex flex-col space-y-4">
                <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-white text-center lg:text-left">Мы на карте</h2>
                {lat && lng && (
                    <div className="flex-grow w-full rounded-lg shadow-lg overflow-hidden">
                        <GoogleMaps lat={lat} lng={lng} zoom={zoom} markerText={markerText} />
                    </div>
                )}
            </div>

            {/* Form */}
            <div className="flex flex-col space-y-4">
                 <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-white text-center lg:text-left">Напишите нам</h2>
                <Card className="bg-white/10 border-white/20 text-white rounded-xl shadow-lg w-full flex-grow flex flex-col">
                    <CardContent className="pt-6 flex-grow flex flex-col">
                        <form action={formAction} className="space-y-4 flex-grow flex flex-col">
                            <div className='flex-grow'>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                    <label htmlFor="name" className="font-medium text-gray-200">Ваше имя</label>
                                    <Input id="name" name="name" placeholder="Иван Иванов" className="bg-white/5 border-white/20 placeholder:text-white/50 text-white" />
                                    {state.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
                                    </div>
                                    <div className="space-y-2">
                                    <label htmlFor="email" className="font-medium text-gray-200">Email</label>
                                    <Input id="email" name="email" type="email" placeholder="example@email.com" className="bg-white/5 border-white/20 placeholder:text-white/50 text-white"/>
                                    {state.errors?.email && <p className="text-sm text-destructive">{state.errors.email[0]}</p>}
                                    </div>
                                </div>
                                <div className="space-y-2 mt-4">
                                    <label htmlFor="message" className="font-medium text-gray-200">Сообщение</label>
                                    <Textarea id="message" name="message" placeholder="Ваш вопрос или предложение..." rows={4} className="bg-white/5 border-white/20 placeholder:text-white/50 text-white"/>
                                    {state.errors?.message && <p className="text-sm text-destructive">{state.errors.message[0]}</p>}
                                </div>
                            </div>

                            <div className="flex justify-center mt-4">
                                <RecaptchaWidget onVerified={setIsRecaptchaVerified} />
                            </div>

                            <div className="mt-4">
                                <SubmitButton isRecaptchaVerified={isRecaptchaVerified} />
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>

      </div>
    </div>
  );
}

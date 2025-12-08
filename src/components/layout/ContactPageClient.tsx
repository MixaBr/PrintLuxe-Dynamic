
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useState, useRef } from 'react';
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
import { RecaptchaWidget } from '@/components/ui/RecaptchaWidget';
import { ViberIcon } from '../icons/ViberIcon';

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
  const [isRecaptchaVerified, setIsRecaptchaVerified] = useState(false);
  const [recaptchaKey, setRecaptchaKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.status === 'success') {
      toast({
        title: "Успех!",
        description: state.message,
      });
      formRef.current?.reset();
      setIsRecaptchaVerified(false);
      setRecaptchaKey(prevKey => prevKey + 1);
    } else if (state.status === 'error' && state.message) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: state.message,
      });
      setIsRecaptchaVerified(false);
      setRecaptchaKey(prevKey => prevKey + 1);
    }
  }, [state, toast]);
  
  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    const maxSize = 10 * 1024 * 1024; // 10 MB

    if (file && file.size > maxSize) {
        toast({
            variant: "destructive",
            title: "Ошибка",
            description: "Размер файла не должен превышать 10 МБ.",
        });
        return; 
    }
    
    const formData = new FormData(event.currentTarget);
    formAction(formData);
  };


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

  const { map_lat, map_lng, map_zoom, map_marker_text } = contactData;

  return (
    <div className="h-full overflow-y-auto">
        <div className="text-white p-4 md:p-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8 text-center">
                <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold text-white">{contactData.main_title}</h1>
                <p className="mt-3 max-w-3xl mx-auto text-base sm:text-lg text-gray-300">
                {contactData.main_subtitle}
                </p>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
                
                <div className="mb-6">
                    <h2 className="font-headline text-2xl sm:text-3xl font-semibold mb-5 text-white text-center">{contactData.info_title}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-y-6 gap-x-8 items-start">
                        
                        <div className="md:col-span-2">
                        <TooltipProvider>
                            <Tooltip>
                            <TooltipTrigger asChild>
                                <Link
                                href={`https://www.google.com/maps/dir/?api=1&destination=${map_lat},${map_lng}`}
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
                        </div>

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

                        {(contactData.telegram_link || contactData.viber_link) && (
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                                     <svg viewBox="0 0 50.8 50.8" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white" fill="none">
                                        <path d="M22.754 9.128h19.843c1.413 0 2.382 1.113 2.382 2.381v14.553c.031 1.397-.959 2.38-2.382 2.38h-4.762v4.499l-6.615-4.498h-8.466c-1.39.002-2.4-1.04-2.381-2.381V11.509c0-1.12.766-2.38 2.38-2.38zm-8.626 10.054H8.202c-1.375 0-2.381 1.021-2.381 2.382v13.493c0 1.492 1.204 2.382 2.381 2.382h3.969v4.233l6.085-4.233h7.937c1.225 0 2.382-.954 2.382-2.382v-.529" style={{opacity:1, fill:'none', fillRule:'evenodd', stroke:'currentColor', strokeWidth:3.175, strokeLinecap:'round', strokeLinejoin:'round', strokeMiterlimit:0, strokeDasharray:'none'}}/>
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg text-white">Мессенджеры</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        {contactData.telegram_link && (
                                            <Link href={contactData.telegram_link} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg>
                                                <span className="sr-only">Telegram</span>
                                            </Link>
                                        )}
                                        {contactData.viber_link && (
                                            <Link href={contactData.viber_link} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition">
                                                <ViberIcon />
                                                <span className="sr-only">Viber</span>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:items-stretch">
                    <div className="flex flex-col space-y-4">
                        <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-white text-center lg:text-left">Мы на карте</h2>
                        {map_lat && map_lng && (
                            <div className="flex-grow w-full rounded-lg shadow-lg overflow-hidden min-h-[400px]">
                                <GoogleMaps lat={map_lat} lng={map_lng} zoom={map_zoom} markerText={map_marker_text} />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col space-y-4">
                        <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-white text-center lg:text-left">Напишите нам</h2>
                        <Card className="bg-white/10 border-white/20 text-white rounded-xl shadow-lg w-full h-full flex flex-col">
                            <CardContent className="pt-6 flex-grow flex flex-col">
                                <form ref={formRef} action={formAction} onSubmit={handleFormSubmit} className="space-y-4 flex-grow flex flex-col">
                                    <div className="flex-grow space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                            <label htmlFor="name" className="font-medium text-gray-200">Ваше имя</label>
                                            <Input id="name" name="name" placeholder="Иван Иванов" className="bg-white/5 border-white/20 placeholder:text-white/50 text-white" required />
                                            {state.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
                                            </div>
                                            <div className="space-y-2">
                                            <label htmlFor="email" className="font-medium text-gray-200">Email</label>
                                            <Input id="email" name="email" type="email" placeholder="example@email.com" className="bg-white/5 border-white/20 placeholder:text-white/50 text-white" required/>
                                            {state.errors?.email && <p className="text-sm text-destructive">{state.errors.email[0]}</p>}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="message" className="font-medium text-gray-200">Сообщение</label>
                                            <Textarea id="message" name="message" placeholder="Ваш вопрос или предложение..." rows={4} className="bg-white/5 border-white/20 placeholder:text-white/50 text-white" required/>
                                            {state.errors?.message && <p className="text-sm text-destructive">{state.errors.message[0]}</p>}
                                        </div>
                                         <div className="space-y-2">
                                            <label htmlFor="file" className="font-medium text-gray-200">Прикрепить файл</label>
                                            <Input id="file" name="file" type="file" ref={fileInputRef} className="bg-white/5 border-white/20 placeholder:text-white/50 text-white file:text-white" />
                                            <p className="text-xs text-gray-400">Максимальный размер файла: 10 МБ.</p>
                                            <p className="text-xs text-gray-400">Допустимые типы: JPG, PNG, WEBP, PDF, DOC, DOCX.</p>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4 space-y-4">
                                        <div className="flex justify-center">
                                            <RecaptchaWidget key={recaptchaKey} onVerified={setIsRecaptchaVerified} />
                                        </div>
                                        <SubmitButton isRecaptchaVerified={isRecaptchaVerified} />
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
}

    
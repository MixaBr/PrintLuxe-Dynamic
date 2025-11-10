
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { submitContactForm, type ContactFormState } from '@/app/contact/actions';
import type { ContactPageData } from '@/lib/contact-data';
import Link from 'next/link';

const ViberIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M14.47,15.5c-1.34,0-2.68-0.54-3.68-1.54s-1.54-2.34-1.54-3.68c0-0.34,0.04-0.67,0.1-1H7.17 C7.06,9.61,7,9.94,7,10.28c0,4.36,3.54,7.9,7.9,7.9c0.34,0,0.67-0.02,1-0.08v-2.18C15.14,15.46,14.81,15.5,14.47,15.5z M19.92,10.08v2.18c0.68-0.3,1.18-0.98,1.18-1.78S20.6,8.98,19.92,8.68 M17.3,7.56C17.74,7.66,18.1,8,18.3,8.44 c0.48,1.12,0.22,2.4-0.66,3.28s-2.16,1.14-3.28,0.66c-0.44-0.2-0.78-0.56-0.88-1c-0.24-1.1,0.02-2.28,0.8-3.06S16.2,6.96,17.3,7.56z M16.84,5.46C14.5,4.5,11.78,5.16,10,6.94s-2.44,4.5-1.5,6.84c0.8,2.02,2.78,3.28,5,3.28c0.5,0,1-0.08,1.5-0.22l3.72,3.72 c0.2,0.2,0.46,0.3,0.72,0.3s0.52-0.1,0.72-0.3c0.4-0.4,0.4-1.04,0-1.44L16.44,15.4c2.22-1.4,3.24-4.14,2.48-6.64 C18.38,6.96,17.68,6.08,16.84,5.46z"/>
    </svg>
);


const initialState: ContactFormState = {
  message: '',
  status: 'idle',
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" className="w-full font-bold text-lg" disabled={pending}>
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

  useEffect(() => {
    if (state.status === 'success') {
      toast({
        title: "Успех!",
        description: state.message,
      });
    } else if (state.status === 'error' && state.message && !state.errors) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: state.message,
      });
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

  return (
    <div className="text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
        <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">{contactData.main_title}</h1>
        <p className="mt-4 max-w-3xl mx-auto text-base sm:text-lg md:text-xl text-white/80">
          {contactData.main_subtitle}
        </p>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          <div className="space-y-8">
            <h2 className="font-headline text-2xl sm:text-3xl font-semibold mb-6">{contactData.info_title}</h2>
            <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Наш адрес</h3>
                    <p className="text-white/70">{contactData.address}</p>
                  </div>
                </div>
                {(contactData.phone_1 || contactData.phone_2) && (
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                            <Phone className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Телефон</h3>
                            {contactData.phone_1 && <p className="text-white/70">{contactData.phone_1}</p>}
                            {contactData.phone_2 && <p className="text-white/70">{contactData.phone_2}</p>}
                        </div>
                    </div>
                )}
                {contactData.email_main && (
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                            <Mail className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Email</h3>
                            <a href={`mailto:${contactData.email_main}`} className="text-white/70 hover:text-white transition">{contactData.email_main}</a>
                        </div>
                    </div>
                )}
                 {(contactData.telegram_link || contactData.viber_link) && (
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                            <Send className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Мессенджеры</h3>
                            <div className="flex items-center gap-4 mt-2">
                                {contactData.telegram_link && (
                                    <Link href={contactData.telegram_link} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition">
                                        <Send className="w-7 h-7" />
                                        <span className="sr-only">Telegram</span>
                                    </Link>
                                )}
                                {contactData.viber_link && (
                                    <Link href={contactData.viber_link} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition">
                                        <ViberIcon className="w-7 h-7" />
                                        <span className="sr-only">Viber</span>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                 )}
            </div>

            {contactData.map_embed_url && (
                <div className="aspect-video w-full mt-8">
                    <iframe
                        src={contactData.map_embed_url}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen={false}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="rounded-lg shadow-lg"
                    ></iframe>
                </div>
            )}
          </div>

          <div className="flex items-center">
            <Card className="bg-white/10 border-white/20 text-white rounded-xl shadow-lg w-full">
              <CardHeader>
                <CardTitle className="font-headline text-2xl sm:text-3xl">{contactData.form_title}</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={formAction} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="font-medium text-white/90">Ваше имя</label>
                      <Input id="name" name="name" placeholder="Иван Иванов" className="bg-white/5 border-white/20 placeholder:text-white/50" />
                      {state.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="font-medium text-white/90">Email</label>
                      <Input id="email" name="email" type="email" placeholder="example@email.com" className="bg-white/5 border-white/20 placeholder:text-white/50"/>
                       {state.errors?.email && <p className="text-sm text-destructive">{state.errors.email[0]}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="message" className="font-medium text-white/90">Сообщение</label>
                    <Textarea id="message" name="message" placeholder="Ваш вопрос или предложение..." rows={6} className="bg-white/5 border-white/20 placeholder:text-white/50"/>
                    {state.errors?.message && <p className="text-sm text-destructive">{state.errors.message[0]}</p>}
                  </div>
                  <SubmitButton />
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

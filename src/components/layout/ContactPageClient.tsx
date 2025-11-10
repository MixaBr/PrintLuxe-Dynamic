
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
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" id="Viber--Streamline-Simple-Icons" {...props}>
        <title>Viber</title>
        <path d="M11.4 0C9.473 0.028 5.333 0.344 3.02 2.467 1.302 4.187 0.696 6.7 0.633 9.817 0.57 12.933 0.488 18.776 6.12 20.36h0.003l-0.004 2.416s-0.037 0.977 0.61 1.177c0.777 0.242 1.234 -0.5 1.98 -1.302 0.407 -0.44 0.972 -1.084 1.397 -1.58 3.85 0.326 6.812 -0.416 7.15 -0.525 0.776 -0.252 5.176 -0.816 5.892 -6.657 0.74 -6.02 -0.36 -9.83 -2.34 -11.546 -0.596 -0.55 -3.006 -2.3 -8.375 -2.323 0 0 -0.395 -0.025 -1.037 -0.017zm0.058 1.693c0.545 -0.004 0.88 0.017 0.88 0.017 4.542 0.02 6.717 1.388 7.222 1.846 1.675 1.435 2.53 4.868 1.906 9.897v0.002c-0.604 4.878 -4.174 5.184 -4.832 5.395 -0.28 0.09 -2.882 0.737 -6.153 0.524 0 0 -2.436 2.94 -3.197 3.704 -0.12 0.12 -0.26 0.167 -0.352 0.144 -0.13 -0.033 -0.166 -0.188 -0.165 -0.414l0.02 -4.018c-4.762 -1.32 -4.485 -6.292 -4.43 -8.895 0.054 -2.604 0.543 -4.738 1.996 -6.173 1.96 -1.773 5.474 -2.018 7.11 -2.03zm0.38 2.602c-0.167 0 -0.303 0.135 -0.304 0.302 0 0.167 0.133 0.303 0.3 0.305 1.624 0.01 2.946 0.537 4.028 1.592 1.073 1.046 1.62 2.468 1.633 4.334 0.002 0.167 0.14 0.3 0.307 0.3 0.166 -0.002 0.3 -0.138 0.3 -0.304 -0.014 -1.984 -0.618 -3.596 -1.816 -4.764 -1.19 -1.16 -2.692 -1.753 -4.447 -1.765zm-3.96 0.695c-0.19 -0.032 -0.4 0.005 -0.616 0.117l-0.01 0.002c-0.43 0.247 -0.816 0.562 -1.146 0.932 -0.002 0.004 -0.006 0.004 -0.008 0.008 -0.267 0.323 -0.42 0.638 -0.46 0.948 -0.008 0.046 -0.01 0.093 -0.007 0.14 0 0.136 0.022 0.27 0.065 0.4l0.013 0.01c0.135 0.48 0.473 1.276 1.205 2.604 0.42 0.768 0.903 1.5 1.446 2.186 0.27 0.344 0.56 0.673 0.87 0.984l0.132 0.132c0.31 0.308 0.64 0.6 0.984 0.87 0.686 0.543 1.418 1.027 2.186 1.447 1.328 0.733 2.126 1.07 2.604 1.206l0.01 0.014c0.13 0.042 0.265 0.064 0.402 0.063 0.046 0.002 0.092 0 0.138 -0.008 0.31 -0.036 0.627 -0.19 0.948 -0.46 0.004 0 0.003 -0.002 0.008 -0.005 0.37 -0.33 0.683 -0.72 0.93 -1.148l0.003 -0.01c0.225 -0.432 0.15 -0.842 -0.18 -1.12 -0.004 0 -0.698 -0.58 -1.037 -0.83 -0.36 -0.255 -0.73 -0.492 -1.113 -0.71 -0.51 -0.285 -1.032 -0.106 -1.248 0.174l-0.447 0.564c-0.23 0.283 -0.657 0.246 -0.657 0.246 -3.12 -0.796 -3.955 -3.955 -3.955 -3.955s-0.037 -0.426 0.248 -0.656l0.563 -0.448c0.277 -0.215 0.456 -0.737 0.17 -1.248 -0.217 -0.383 -0.454 -0.756 -0.71 -1.115 -0.25 -0.34 -0.826 -1.033 -0.83 -1.035 -0.137 -0.165 -0.31 -0.265 -0.502 -0.297zm4.49 0.88c-0.158 0.002 -0.29 0.124 -0.3 0.282 -0.01 0.167 0.115 0.312 0.282 0.324 1.16 0.085 2.017 0.466 2.645 1.15 0.63 0.688 0.93 1.524 0.906 2.57 -0.002 0.168 0.13 0.306 0.3 0.31 0.166 0.003 0.305 -0.13 0.31 -0.297 0.025 -1.175 -0.334 -2.193 -1.067 -2.994 -0.74 -0.81 -1.777 -1.253 -3.05 -1.346h-0.024zm0.463 1.63c-0.16 0.002 -0.29 0.127 -0.3 0.287 -0.008 0.167 0.12 0.31 0.288 0.32 0.523 0.028 0.875 0.175 1.113 0.422 0.24 0.245 0.388 0.62 0.416 1.164 0.01 0.167 0.15 0.295 0.318 0.287 0.167 -0.008 0.295 -0.15 0.287 -0.317 -0.03 -0.644 -0.215 -1.178 -0.58 -1.557 -0.367 -0.378 -0.893 -0.574 -1.52 -0.607h-0.018z" fill="#FFFFFF" strokeWidth="1"></path>
    </svg>
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
                                        <TelegramIcon className="w-11 h-11" />
                                        <span className="sr-only">Telegram</span>
                                    </Link>
                                )}
                                {contactData.viber_link && (
                                    <Link href={contactData.viber_link} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition">
                                        <ViberIcon className="w-11 h-11" />
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

    
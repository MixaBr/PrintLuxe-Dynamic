
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
    <svg viewBox="0 0 256 257" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M189.442 216.521C187.16 217.11 184.774 217.394 182.35 217.502C181.213 217.576 180.063 217.576 178.925 217.502C146.402 215.688 116.568 199.98 96.6573 174.831C76.7462 149.682 68.5484 117.765 74.1594 87.2838C79.7703 56.8023 98.6293 31.396 126.353 17.1866C154.076 2.9772 187.433 1.41626 217.893 12.8258C248.353 24.2353 271.853 47.9899 281.752 77.8396C291.651 107.69 286.902 140.285 269.155 166.529C251.408 192.773 222.614 209.914 189.845 214.869L189.442 216.521Z" fill="#7360F2"/>
        <path d="M162.067 104.721C161.381 103.774 160.793 102.913 160.354 101.992C153.581 87.6657 152.748 71.3045 158.054 56.5501C160.407 49.9929 164.508 44.2708 169.943 40.063C172.848 37.9439 176.173 36.303 179.764 35.214C195.776 30.3475 212.848 32.6888 226.633 40.9634C240.418 49.238 249.577 62.3912 251.434 77.2023C253.291 91.9568 247.68 106.83 236.438 117.065C232.522 120.352 228.012 123.003 222.998 124.846L245.748 149.008C247.93 151.22 247.93 154.764 245.748 156.976C243.565 159.188 240.24 159.188 238.058 156.976L215.308 132.813C199.769 141.652 180.669 142.83 163.666 135.59C162.067 134.904 147.76 128.291 147.76 128.291C139.914 124.616 134.108 117.589 132.251 109.314C130.394 100.815 132.513 91.8926 137.948 85.2289C143.383 78.5652 151.488 75.321 160.016 77.0374C161.615 77.3557 163.138 77.8617 164.603 78.5082L169.581 81.0426C168.324 86.2057 168.324 91.6848 169.581 96.8479C170.707 102.011 173.06 106.812 176.391 110.767C177.754 112.41 176.391 112.999 174.926 112.352C169.998 110.14 165.704 106.134 163.351 101.127L162.067 104.721Z" fill="#fff"/>
        <path d="M190.627 180.126C187.818 180.126 185.008 179.537 182.409 178.36C174.267 174.636 168.038 167.731 164.933 159.232C163.076 154.12 162.479 148.57 163.19 143.14C164.655 131.902 170.461 121.996 179.293 115.78C183.708 112.547 188.72 110.428 194.155 109.566C200.435 108.489 206.822 109.566 212.454 112.7C220.808 117.009 226.614 124.288 229.213 133.013C231.332 139.918 230.956 146.993 228.258 153.535C223.843 163.441 214.678 171.055 204.26 174.88C199.845 176.545 195.178 178.36 190.627 180.126V180.126Z" fill="white"/>
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

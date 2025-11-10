
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
    <svg viewBox="0 0 28 29" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M15.7233 22.8665C15.5318 22.9263 15.3195 22.9644 15.1018 22.9789C15.0002 22.9856 14.8975 22.9856 14.7959 22.9789C11.5303 22.8131 8.54433 21.2186 6.55105 18.6653C4.55776 16.112 3.7371 12.8711 4.29891 9.77331C4.86073 6.67554 6.74411 4.09459 9.51861 2.6517C12.2931 1.20881 15.6321 1.05062 18.6816 2.22863C21.7311 3.40665 24.0834 5.81977 25.0747 8.84093C26.066 11.8621 25.5905 15.1763 23.8242 17.842C22.0579 20.5077 19.186 22.2599 15.9048 22.7533L15.7233 22.8665Z" fill="#7360F2"/>
        <path d="M15.823 18.1799C15.5417 18.1799 15.2604 18.1201 15.0002 18.0005C14.1849 17.6231 13.5614 16.9209 13.2505 16.0594C13.0645 15.5398 13.0047 14.9758 13.0759 14.4244C13.2227 13.2847 13.8039 12.2747 14.6881 11.6424C15.1302 11.3142 15.6321 11.0992 16.1764 11.0117C16.8053 10.9021 17.4448 11.0117 18.0088 11.3268C18.8453 11.7538 19.4265 12.4938 19.6867 13.3774C19.899 14.0796 19.8613 14.8196 19.5902 15.485C19.1481 16.495 18.2301 17.265 17.187 17.6424C16.7448 17.8065 16.2778 17.9893 15.823 18.1799V18.1799Z" fill="white"/>
        <path d="M12.9628 10.5186C12.8941 10.4245 12.8362 10.3371 12.7913 10.245C12.1132 8.78783 12.0298 7.12644 12.5492 5.62676C12.7845 4.96131 13.1953 4.38015 13.7396 3.95315C14.0304 3.73809 14.3635 3.57399 14.7231 3.46438C16.3263 2.97098 18.036 3.20863 19.4184 4.04803C20.8008 4.88744 21.7188 6.22013 21.9048 7.72513C22.0908 9.23013 21.529 10.7424 20.3995 11.7745C20.0073 12.1101 19.5501 12.3789 19.0482 12.5635L21.3283 15.0005C21.5406 15.2253 21.5406 15.5849 21.3283 15.8096C21.116 16.0344 20.7828 16.0344 20.5705 15.8096L18.2904 13.3727C16.7351 14.2859 14.8226 14.4055 13.1233 13.6702C12.9628 13.6015 11.5303 12.9263 11.5303 12.9263C10.7448 12.5516 10.1636 11.8368 9.97762 10.9754C9.79164 10.1139 9.99881 9.20073 10.5431 8.52292C11.0874 7.84511 11.9028 7.51953 12.7569 7.69803C12.915 7.73031 13.0676 7.78152 13.2144 7.84511L13.7131 8.0938C13.5874 8.61868 13.5874 9.17868 13.7131 9.70357C13.8389 10.2285 14.0754 10.709 14.4093 11.109C14.5458 11.2766 14.4093 11.3364 14.2625 11.2766C13.7504 11.0492 13.3188 10.6384 13.0823 10.1365L12.9628 10.5186Z" fill="#9381FF"/>
        <path d="M21.2933 6.94274C21.2933 6.94274 21.2933 6.94274 21.2933 6.94274Z" fill="#7360F2"/>
        <circle cx="21.5" cy="6.5" r="4.5" fill="#FF1D1D"/>
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
                                        <Send className="w-9 h-9" />
                                        <span className="sr-only">Telegram</span>
                                    </Link>
                                )}
                                {contactData.viber_link && (
                                    <Link href={contactData.viber_link} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition">
                                        <ViberIcon className="w-9 h-9" />
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

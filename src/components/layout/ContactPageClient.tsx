
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { submitContactForm, type ContactFormState } from '@/app/contact/actions';
import type { ContactPageData } from '@/lib/contact-data';

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
                            <p className="text-white/70">{contactData.email_main}</p>
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

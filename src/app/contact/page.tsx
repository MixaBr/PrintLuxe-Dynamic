
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { submitContactForm, type ContactFormState } from './actions';

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


export default function ContactPage() {
  const [state, formAction] = useFormState(submitContactForm, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.status === 'success') {
      toast({
        title: "Успех!",
        description: state.message,
      });
      // Optionally reset form here if needed, but Server Actions don't reset automatically
    } else if (state.status === 'error' && state.message && !state.errors) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: state.message,
      });
    }
  }, [state, toast]);

  return (
    <div className="text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
        <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">Свяжитесь с нами</h1>
        <p className="mt-4 max-w-3xl mx-auto text-base sm:text-lg md:text-xl text-white/80">
          Мы всегда рады помочь вам. Задайте вопрос или сделайте заказ.
        </p>
      </div>

      {/* Contact Form and Info Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Left Column: Contact Info & Map */}
          <div className="space-y-8">
            <h2 className="font-headline text-2xl sm:text-3xl font-semibold mb-6">Контактная информация</h2>
            <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Наш адрес</h3>
                    <p className="text-white/70">123456, г. Москва, ул. Центральная, д. 1, офис 101</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Телефон</h3>
                    <p className="text-white/70">+7 (495) 123-45-67</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Email</h3>
                    <p className="text-white/70">contact@printlux.com</p>
                  </div>
                </div>
            </div>

            {/* Google Maps Embed */}
            <div className="aspect-video w-full mt-8">
                <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2245.38533819864!2d37.6155613159307!3d55.75222098055453!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x46b54a50b315e573%3A0xa66eb1a3c1b5a57b!2sRed%20Square!5e0!3m2!1sen!2sru!4v1622033321487!5m2!1sen!2sru"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="rounded-lg shadow-lg"
                ></iframe>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="flex items-center">
            <Card className="bg-white/10 border-white/20 text-white rounded-xl shadow-lg w-full">
              <CardHeader>
                <CardTitle className="font-headline text-2xl sm:text-3xl">Отправить сообщение</CardTitle>
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

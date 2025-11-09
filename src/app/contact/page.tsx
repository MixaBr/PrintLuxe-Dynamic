import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin } from "lucide-react";

export default function ContactPage() {
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-8">
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
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="bg-white/10 border-white/20 text-white rounded-xl shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-2xl sm:text-3xl">Отправить сообщение</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="font-medium text-white/90">Ваше имя</label>
                      <Input id="name" placeholder="Иван Иванов" className="bg-white/5 border-white/20 placeholder:text-white/50" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="font-medium text-white/90">Email</label>
                      <Input id="email" type="email" placeholder="example@email.com" className="bg-white/5 border-white/20 placeholder:text-white/50"/>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="message" className="font-medium text-white/90">Сообщение</label>
                    <Textarea id="message" placeholder="Ваш вопрос или предложение..." rows={6} className="bg-white/5 border-white/20 placeholder:text-white/50"/>
                  </div>
                  <Button type="submit" size="lg" className="w-full font-bold text-lg bg-white/80 text-black hover:bg-white">
                    Отправить
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

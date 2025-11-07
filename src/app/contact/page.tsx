import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:px-8 md:py-16">
      <div className="text-center">
        <h1 className="font-headline text-4xl md:text-5xl font-bold">Свяжитесь с нами</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Мы всегда рады помочь вам. Задайте вопрос или сделайте заказ.
        </p>
      </div>

      <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <h2 className="font-headline text-2xl md:text-3xl font-semibold mb-6">Контактная информация</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Наш адрес</h3>
                <p className="text-muted-foreground">123456, г. Москва, ул. Центральная, д. 1, офис 101</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Телефон</h3>
                <p className="text-muted-foreground">+7 (495) 123-45-67</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Email</h3>
                <p className="text-muted-foreground">contact@printlux.com</p>
              </div>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Отправить сообщение</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name">Ваше имя</label>
                <Input id="name" placeholder="Иван Иванов" />
              </div>
              <div className="space-y-2">
                <label htmlFor="email">Email</label>
                <Input id="email" type="email" placeholder="example@email.com" />
              </div>
              <div className="space-y-2">
                <label htmlFor="message">Сообщение</label>
                <Textarea id="message" placeholder="Ваш вопрос или предложение..." rows={5} />
              </div>
              <Button type="submit" className="w-full font-bold">Отправить</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

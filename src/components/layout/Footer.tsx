import Link from 'next/link';
import { Wrench, Twitter, Facebook, Instagram } from 'lucide-react';

const footerNavs = [
  { href: '/about', label: 'О нас' },
  { href: '/catalog', label: 'Каталог' },
  { href: '/contact', label: 'Контакты' },
  { href: '/profile', label: 'Профиль' },
];

const socialLinks = [
  { href: '#', icon: <Twitter className="h-5 w-5" />, label: 'Twitter' },
  { href: '#', icon: <Facebook className="h-5 w-5" />, label: 'Facebook' },
  { href: '#', icon: <Instagram className="h-5 w-5" />, label: 'Instagram' },
];

export function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 py-12 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Wrench className="h-7 w-7 text-primary" />
              <span className="font-headline text-2xl font-bold text-primary">PrintLuxe</span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Ваш надежный партнер в мире качественной полиграфии. От идеи до готового продукта.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Навигация</h3>
              <ul className="space-y-2">
                {footerNavs.map(nav => (
                  <li key={nav.label}>
                    <Link href={nav.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {nav.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
             <div>
              <h3 className="font-semibold mb-4">Правовая информация</h3>
              <ul className="space-y-2">
                  <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Политика конфиденциальности</Link></li>
                  <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Условия использования</Link></li>
              </ul>
            </div>
             <div>
              <h3 className="font-semibold mb-4">Контакты</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Email: contact@printluxe.com</li>
                  <li>Телефон: +7 (495) 123-45-67</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} PrintLuxe. Все права защищены.</p>
            <div className="flex items-center gap-4">
                {socialLinks.map(social => (
                    <Link key={social.label} href={social.href} aria-label={social.label} className="text-muted-foreground hover:text-primary transition-colors">
                        {social.icon}
                    </Link>
                ))}
            </div>
        </div>
      </div>
    </footer>
  );
}

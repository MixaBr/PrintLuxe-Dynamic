'use client';

import Link from 'next/link';
import { Button } from '../ui/button';

type NavLinkItem = {
  href: string;
  label: string;
};

const navLinks: NavLinkItem[] = [
    { href: '/', label: 'Главная' },
    { href: '/catalog', label: 'Каталог' },
    { href: '/services', label: 'Наши услуги' },
    { href: '/about', label: 'О нас' },
    { href: '/contact', label: 'Контакты' },
    { href: '/user-info', label: 'Информация для пользователя' },
    { href: '/legal', label: 'Юридическая информация' },
    { href: '/faq', label: 'Вопросы и ответы' },
];

interface SidebarNavProps {
    onLinkClick?: () => void;
}

export function SidebarNav({ onLinkClick }: SidebarNavProps) {
    return (
        <nav className="flex flex-col items-start gap-3">
            {navLinks.map((link) => (
                <Button 
                    key={link.href} 
                    variant="link" 
                    asChild 
                    className="p-0 text-lg text-white/80 hover:text-white h-auto"
                    onClick={onLinkClick}
                >
                    <Link href={link.href} prefetch={false}>
                         {link.href === '/legal' ? (
                            <div className="text-left leading-tight">Юридическая<br/>информация</div>
                         ) : link.href === '/user-info' ? (
                            <div className="text-left leading-tight">Информация для<br/>пользователя</div>
                        ) : (
                            link.label
                        )}
                    </Link>
                </Button>
            ))}
        </nav>
    );
}

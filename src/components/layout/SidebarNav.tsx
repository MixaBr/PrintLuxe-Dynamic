
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
    { href: '/about', label: 'О нас' },
    { href: '/contact', label: 'Контакты' },
    { href: '/user-info', label: 'Информация для пользователя' },
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
                    <Link href={link.href}>
                         {link.href === '/user-info' ? (
                            <div className="text-left leading-tight">Информация<br/>для пользователя</div>
                        ) : (
                            link.label
                        )}
                    </Link>
                </Button>
            ))}
        </nav>
    );
}

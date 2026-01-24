
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
    { href: '/legal', label: 'Юридическая информация' },
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
                         {link.href === '/legal' ? (
                            <div className="text-left leading-tight">Юридическая<br/>информация</div>
                        ) : (
                            link.label
                        )}
                    </Link>
                </Button>
            ))}
        </nav>
    );
}

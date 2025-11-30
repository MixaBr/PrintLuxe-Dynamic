
'use client';

import type { ContactPageData } from '@/lib/contact-data';
import Link from 'next/link';
import { Button } from '../ui/button';
import { ChevronRight, Mail, Phone, MapPin } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from 'react';

type NavLinkItem = {
  href: string;
  label: string;
};

const navLinks: NavLinkItem[] = [
    { href: '/', label: 'Главная' },
    { href: '/catalog', label: 'Каталог' },
    { href: '/about', label: 'О нас' },
    { href: '/contact', label: 'Контакты' },
];

interface SidebarProps {
  contactData: ContactPageData;
}

export function Sidebar({ contactData }: SidebarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  return (
    <div className="space-y-6">
        {/* Menu Section */}
        <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-4 text-white">
            <Collapsible open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between text-lg font-bold">
                        Меню
                        <ChevronRight className={`h-5 w-5 transition-transform ${isMenuOpen ? 'rotate-90' : ''}`} />
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <nav className="mt-4 flex flex-col gap-2">
                        {navLinks.map(link => (
                            <Button key={link.href} variant="ghost" asChild className="justify-start">
                                <Link href={link.href}>
                                    {link.label}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </CollapsibleContent>
            </Collapsible>
        </div>

        {/* Contacts Section */}
        <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-4 text-white">
            <h3 className="text-lg font-bold mb-4">Контакты</h3>
            <div className="space-y-3 text-sm">
                {contactData.address && (
                     <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-1 flex-shrink-0 text-primary" />
                        <Link href="/contact" className="hover:text-primary transition-colors duration-200">
                            {contactData.address}
                        </Link>
                    </div>
                )}
                {(contactData.phone_1 || contactData.phone_2) && (
                    <div className="flex items-center gap-2">
                         <Phone className="h-4 w-4 flex-shrink-0 text-primary" />
                         <div>
                            {contactData.phone_1 && <a href={`tel:${contactData.phone_1.replace(/\s/g, '')}`} className="hover:text-primary">{contactData.phone_1}</a>}
                            {contactData.phone_2 && <span className="block">{contactData.phone_2}</span>}
                         </div>
                    </div>
                )}
                {contactData.email_main && (
                     <div className="flex items-center gap-2">
                         <Mail className="h-4 w-4 flex-shrink-0 text-primary" />
                         <a href={`mailto:${contactData.email_main}`} className="hover:text-primary break-all">{contactData.email_main}</a>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}

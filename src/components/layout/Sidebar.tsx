
'use client';

import type { ContactPageData } from '@/lib/contact-data';
import Link from 'next/link';
import { Button } from '../ui/button';
import { ChevronRight, Mail, Phone, MapPin, Clock } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col h-full gap-6">
        {/* Menu Section */}
        <div className="flex-shrink-0 bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-4 text-white">
            <Collapsible open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between text-lg font-bold hover:bg-white/30 focus-visible:bg-white/30">
                        Меню
                        <ChevronRight className={`h-5 w-5 transition-transform ${isMenuOpen ? 'rotate-90' : ''}`} />
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <nav className="mt-4 flex flex-col gap-2">
                        {navLinks.map(link => (
                            <Button 
                              key={link.href} 
                              variant="ghost" 
                              asChild 
                              className={cn(
                                "justify-start",
                                "hover:bg-white/30 focus-visible:bg-white/30"
                              )}
                            >
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
        <div className="flex-1 min-h-0 bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg text-white flex flex-col">
            <h3 className="text-lg font-bold p-4 flex-shrink-0 border-b border-white/10">Контакты</h3>
            <div className="overflow-y-auto px-4 py-4">
                <div className="space-y-3 text-sm">
                    {contactData.address && (
                        <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-1 flex-shrink-0 text-white" />
                            <Link href="/contact" className="transition-colors duration-200 hover:underline">
                                {contactData.address}
                            </Link>
                        </div>
                    )}
                    {contactData.working_hours && (
                        <div className="flex items-start gap-2">
                            <Clock className="h-4 w-4 mt-1 flex-shrink-0 text-white" />
                            <div>
                                {contactData.working_hours.split(';').map((line, index) => (
                                    <span key={index} className="block text-white">
                                        {line}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {(contactData.phone_1 || contactData.phone_2) && (
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 flex-shrink-0 text-white" />
                            <div>
                                {contactData.phone_1 && (
                                    isMobile ? (
                                        <a href={`tel:${contactData.phone_1.replace(/[\s()-]/g, '')}`} className="block text-white hover:underline">
                                            {contactData.phone_1}
                                        </a>
                                    ) : (
                                        <span className="block text-white cursor-default hover:underline">
                                            {contactData.phone_1}
                                        </span>
                                    )
                                )}
                                {contactData.phone_2 && (
                                    isMobile ? (
                                        <a href={`tel:${contactData.phone_2.replace(/[\s()-]/g, '')}`} className="block text-white hover:underline">
                                            {contactData.phone_2}
                                        </a>
                                    ) : (
                                        <span className="block text-white cursor-default hover:underline">
                                            {contactData.phone_2}
                                        </span>
                                    )
                                )}
                            </div>
                        </div>
                    )}
                    {contactData.email_main && (
                        <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 flex-shrink-0 text-white" />
                            <a href={`mailto:${contactData.email_main}`} className="break-all hover:underline">{contactData.email_main}</a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}

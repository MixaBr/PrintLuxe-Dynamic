
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
import { ScrollArea } from '../ui/scroll-area';

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

  // On mobile, use a different layout that doesn't need this flex logic
  if (isMobile) {
    return (
        <div className="h-full w-full space-y-6">
            {/* Menu Section */}
            <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-4 text-white">
                <Collapsible open={isMenuOpen} onOpenChange={setIsMenuOpen} className="w-full">
                    <CollapsibleTrigger asChild>
                        <button className="flex w-full items-center justify-between text-lg font-bold">
                            <span>Меню</span>
                            <ChevronRight className={cn("h-5 w-5 transition-transform duration-200", isMenuOpen && "rotate-90")} />
                        </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <nav className="mt-4 flex flex-col items-start gap-3">
                            {navLinks.map((link) => (
                            <Button key={link.href} variant="link" asChild className="p-0 text-lg text-white/80 hover:text-white">
                                <Link href={link.href}>{link.label}</Link>
                            </Button>
                            ))}
                        </nav>
                    </CollapsibleContent>
                </Collapsible>
            </div>

            {/* Contacts Section */}
            <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-4 text-white">
                 <h3 className="text-lg font-bold mb-4 flex-shrink-0">Контакты</h3>
                 <div className="space-y-3 text-sm">
                    {contactData.address && (
                        <div className="flex items-start gap-3">
                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>{contactData.address}</span>
                        </div>
                    )}
                    {(contactData.phone_1 || contactData.phone_2) && (
                        <div className="flex items-start gap-3">
                            <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div className="flex flex-col">
                                {contactData.phone_1 && <span>{contactData.phone_1}</span>}
                                {contactData.phone_2 && <span>{contactData.phone_2}</span>}
                            </div>
                        </div>
                    )}
                    {contactData.email_main && (
                        <div className="flex items-start gap-3">
                            <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <a href={`mailto:${contactData.email_main}`} className="break-all hover:underline">{contactData.email_main}</a>
                        </div>
                    )}
                    {contactData.working_hours && (
                        <div className="flex items-start gap-3">
                            <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div className='whitespace-pre-wrap'>{contactData.working_hours}</div>
                        </div>
                    )}
                 </div>
            </div>
        </div>
    )
  }

  // Desktop layout with flexbox to push contacts to the bottom
  return (
    <div className="flex flex-col h-full w-full gap-6">
        {/* Menu Section */}
        <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-4 text-white">
            <Collapsible open={isMenuOpen} onOpenChange={setIsMenuOpen} className="w-full">
                <CollapsibleTrigger asChild>
                    <button className="flex w-full items-center justify-between text-lg font-bold">
                        <span>Меню</span>
                        <ChevronRight className={cn("h-5 w-5 transition-transform duration-200", isMenuOpen && "rotate-90")} />
                    </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <nav className="mt-4 flex flex-col items-start gap-3">
                        {navLinks.map((link) => (
                        <Button key={link.href} variant="link" asChild className="p-0 text-lg text-white/80 hover:text-white">
                            <Link href={link.href}>{link.label}</Link>
                        </Button>
                        ))}
                    </nav>
                </CollapsibleContent>
            </Collapsible>
        </div>

        {/* Contacts Section - pushed to the bottom */}
        <div className="mt-auto bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-4 text-white">
             <h3 className="text-lg font-bold mb-4 flex-shrink-0">Контакты</h3>
             <div className="space-y-3 text-sm">
                {contactData.address && (
                    <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{contactData.address}</span>
                    </div>
                )}
                {(contactData.phone_1 || contactData.phone_2) && (
                    <div className="flex items-start gap-3">
                        <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div className="flex flex-col">
                            {contactData.phone_1 && <span>{contactData.phone_1}</span>}
                            {contactData.phone_2 && <span>{contactData.phone_2}</span>}
                        </div>
                    </div>
                )}
                {contactData.email_main && (
                    <div className="flex items-start gap-3">
                        <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <a href={`mailto:${contactData.email_main}`} className="break-all hover:underline">{contactData.email_main}</a>
                    </div>
                )}
                {contactData.working_hours && (
                    <div className="flex items-start gap-3">
                        <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div className='whitespace-pre-wrap'>{contactData.working_hours}</div>
                    </div>
                )}
             </div>
        </div>
    </div>
  );
}


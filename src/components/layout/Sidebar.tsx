
'use client';

import type { ContactPageData } from '@/lib/contact-data';
import Link from 'next/link';
import { Button } from '../ui/button';
import { ChevronRight, Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
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
                    {(contactData.telegram_link || contactData.viber_link) && (
                        <div className="flex items-start gap-3">
                            <Send className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div className="flex items-center gap-4">
                                {contactData.telegram_link && (
                                    <Link href={contactData.telegram_link} target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white transition">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg>
                                        <span className="sr-only">Telegram</span>
                                    </Link>
                                )}
                                {contactData.viber_link && (
                                    <Link href={contactData.viber_link} target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white transition">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.17 10.32c-1.59 2.24-2.83 5.15-2.83 6.13 0 .74.45 1.11 1.13 1.11s1.3-.64 2.26-1.92c.9-1.2 1.95-2.68 1.95-3.32 0-.6-.31-.93-1.04-.93-.5 0-1.12.28-1.47.63Z"></path><path d="M19.78 12.37a7.66 7.66 0 0 1-5.8 8.84c-3.1.88-8.3-1.22-9.6-5.5-.32-1.07-.32-3.18.04-4.22.6-1.8 1.83-3.22 3.6-4.28 2.5-1.5 6.3-1.9 8.6-1.1 1.7.5 3.3 2.1 3.8 3.9.4 1.5.4 4.3 0 5.8Z"></path><path d="m15.5 6.5-1.5 2.5"></path></svg>
                                        <span className="sr-only">Viber</span>
                                    </Link>
                                )}
                            </div>
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
        <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-4 text-white flex-shrink-0">
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
                {(contactData.telegram_link || contactData.viber_link) && (
                  <div className="flex items-start gap-3">
                      <Send className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="flex items-center gap-4">
                          {contactData.telegram_link && (
                              <Link href={contactData.telegram_link} target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white transition">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg>
                                  <span className="sr-only">Telegram</span>
                              </Link>
                          )}
                          {contactData.viber_link && (
                              <Link href={contactData.viber_link} target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white transition">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.17 10.32c-1.59 2.24-2.83 5.15-2.83 6.13 0 .74.45 1.11 1.13 1.11s1.3-.64 2.26-1.92c.9-1.2 1.95-2.68 1.95-3.32 0-.6-.31-.93-1.04-.93-.5 0-1.12.28-1.47.63Z"></path><path d="M19.78 12.37a7.66 7.66 0 0 1-5.8 8.84c-3.1.88-8.3-1.22-9.6-5.5-.32-1.07-.32-3.18.04-4.22.6-1.8 1.83-3.22 3.6-4.28 2.5-1.5 6.3-1.9 8.6-1.1 1.7.5 3.3 2.1 3.8 3.9.4 1.5.4 4.3 0 5.8Z"></path><path d="m15.5 6.5-1.5 2.5"></path></svg>
                                  <span className="sr-only">Viber</span>
                              </Link>
                          )}
                      </div>
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

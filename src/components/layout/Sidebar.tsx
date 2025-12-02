
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
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.435 3.327C15.42 2.503 12.985 2 10.5 2 4.698 2 2 4.698 2 10.5c0 5.49 2.455 8.95 7.63 8.95.83 0 1.25-.333 1.25-1.127 0-.916-1.583-2.327-2.083-2.994-.375-.5-1.125-1.792-1.125-2.75 0-1.042.875-1.875 1.917-1.875.916 0 1.458.334 2.25 1.25.958 1.084 2.042 2.667 2.917 2.667.875 0 1.333-.417 1.333-.917 0-.5-.25-.916-.834-1.625-.75-1-1.75-2.208-1.75-3.375 0-1.25.792-2.042 1.708-2.042.75 0 1.292.5 1.542 1.25.292.916-.25 2.583-.75 3.75-.458.958.292 2.042.792 2.042.5 0 .792-.25.916-.417l.713-3.26C20.66 6.64 20.355 4.54 17.435 3.327zM9.417 12.75c-.292 0-.5.208-.5.5s.208.5.5.5.5-.208.5-.5-.208-.5-.5-.5zm2.75 0c-.292 0-.5.208-.5.5s.208.5.5.5.5-.208.5-.5-.208-.5-.5-.5zm2.833 0c-.291 0-.5.208-.5.5s.209.5.5.5.5-.208.5-.5-.209-.5-.5-.5z"/></svg>
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
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.435 3.327C15.42 2.503 12.985 2 10.5 2 4.698 2 2 4.698 2 10.5c0 5.49 2.455 8.95 7.63 8.95.83 0 1.25-.333 1.25-1.127 0-.916-1.583-2.327-2.083-2.994-.375-.5-1.125-1.792-1.125-2.75 0-1.042.875-1.875 1.917-1.875.916 0 1.458.334 2.25 1.25.958 1.084 2.042 2.667 2.917 2.667.875 0 1.333-.417 1.333-.917 0-.5-.25-.916-.834-1.625-.75-1-1.75-2.208-1.75-3.375 0-1.25.792-2.042 1.708-2.042.75 0 1.292.5 1.542 1.25.292.916-.25 2.583-.75 3.75-.458.958.292 2.042.792 2.042.5 0 .792-.25.916-.417l.713-3.26C20.66 6.64 20.355 4.54 17.435 3.327zM9.417 12.75c-.292 0-.5.208-.5.5s.208.5.5.5.5-.208.5-.5-.208-.5-.5-.5zm2.75 0c-.292 0-.5.208-.5.5s.208.5.5.5.5-.208.5-.5-.208-.5-.5-.5zm2.833 0c-.291 0-.5.208-.5.5s.209.5.5.5.5-.208.5-.5-.209-.5-.5-.5z"/></svg>
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

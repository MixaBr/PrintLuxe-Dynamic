
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

  return (
    <div className="flex flex-col h-full w-full gap-6">
        {/* Menu Section */}
        <div className="flex-shrink-0 bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-4 text-white">
            <Collapsible open={isMenuOpe ...
'''}
  
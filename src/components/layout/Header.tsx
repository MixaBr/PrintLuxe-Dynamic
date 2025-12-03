
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wrench, ShoppingCart, User, Menu, Briefcase, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCartStore } from '@/hooks/use-cart-store';
import { Input } from '../ui/input';
import { useRouter } from 'next/navigation';
import { useSidebarStore } from '@/hooks/use-sidebar-store';


type NavLinkItem = {
  href: string;
  label: string;
};

const baseLinks: NavLinkItem[] = [
  { href: '/', label: 'Главная' },
  { href: '/catalog', label: 'Каталог' },
  { href: '/about', label: 'О нас' },
  { href: '/contact', label: 'Контакты' },
];

const managerLink: NavLinkItem = { href: '/manager', label: 'Панель менеджера' };
const adminLink: NavLinkItem = { href: '/admin', label: 'Панель админа' };


export function Header({ isAuthenticated, userRole }: { isAuthenticated: boolean, userRole: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const { toggle: toggleSidebar, close: closeSidebar } = useSidebarStore();
  
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  const showDropdown = userRole === 'admin' || userRole === 'manager';

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleanedSearchTerm = searchTerm.trim().toLowerCase();
    if (!cleanedSearchTerm) return;
  
    const availablePages: { [key: string]: string } = {
        'главная': '/',
        'каталог': '/catalog',
        'о нас': '/about',
        'контакты': '/contact',
    };
  
    const foundPageKey = Object.keys(availablePages).find(key => cleanedSearchTerm.includes(key));

    if (foundPageKey) {
        const targetPage = availablePages[foundPageKey];
        router.push(targetPage);
    } else {
        console.log(`Страница по запросу "${searchTerm}" не найдена.`);
    }

    closeSidebar();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/20 backdrop-blur-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-8 gap-4">
        
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hover:bg-white/20 h-12 w-12 text-white" onClick={toggleSidebar}>
                <Wrench className="h-8 w-8 text-white" />
                <span className="sr-only">Открыть меню</span>
            </Button>
            <button onClick={toggleSidebar} className="hidden sm:inline font-headline text-2xl md:text-3xl font-bold text-white">
                PrintLux
            </button>
        </div>


        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-lg">
            <form onSubmit={handleSearch} className="w-full relative">
                <Input 
                    placeholder="Поиск по приложению..."
                    className="h-10 pr-12 bg-white/20 border-white/30 text-white placeholder:text-white/70"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button type="submit" size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-white hover:bg-white/30">
                    <Search className="h-5 w-5"/>
                </Button>
            </form>
        </div>

        {/* Icons (Right) */}
        <div className="flex items-center justify-self-end gap-1 sm:gap-2">
           {showDropdown && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="group rounded-full hover:bg-white/20 transition-colors h-10 w-10 sm:h-12 sm:w-12 text-white">
                   <Briefcase className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2} />
                   <span className="sr-only">Панели</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {userRole === 'manager' && (
                  <DropdownMenuItem asChild>
                    <Link href="/manager">
                      <Briefcase className="mr-2 h-4 w-4" />
                      <span>Панель менеджера</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                 {userRole === 'admin' && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/manager">
                        <Briefcase className="mr-2 h-4 w-4" />
                        <span>Панель менеджера</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <Wrench className="mr-2 h-4 w-4" />
                        <span>Панель админа</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
           )}
          <Button variant="ghost" size="icon" asChild className="relative group rounded-full hover:bg-white/20 transition-colors h-10 w-10 sm:h-12 sm:w-12 text-white">
            <Link href="/cart">
              <ShoppingCart className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2} />
              <span className="sr-only">Корзина</span>
              {isMounted && totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                  {totalItems}
                </span>
              )}
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild className="group rounded-full hover:bg-white/20 transition-colors h-10 w-10 sm:h-12 sm:w-12">
            <Link href={isAuthenticated ? "/profile" : "/login"}>
              <User 
                className={cn(
                  "h-6 w-6 sm:h-7 sm:w-7 transition-colors",
                   isAuthenticated ? "text-destructive" : "text-white"
                )} 
                strokeWidth={2} 
              />
              <span className="sr-only">Профиль</span>
            </Link>
          </Button>
        </div>
      </div>
       {/* Search Bar for mobile */}
       <div className="md:hidden px-4 pb-4">
            <form onSubmit={handleSearch} className="w-full relative">
                <Input 
                    placeholder="Поиск по приложению..."
                    className="h-10 pr-12 bg-white/20 border-white/30 text-white placeholder:text-white/70"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button type="submit" size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-white hover:bg-white/30">
                    <Search className="h-5 w-5"/>
                </Button>
            </form>
        </div>
    </header>
  );
}


'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wrench, ShoppingCart, User, Menu, Briefcase, Wrench as AdminIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCartStore } from '@/hooks/use-cart-store';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);


  const navLinks = useMemo(() => {
    const links = [...baseLinks];
    if (userRole === 'manager') {
      links.push(managerLink);
    }
    if (userRole === 'admin') {
      links.push(managerLink, adminLink);
    }
    return links;
  }, [userRole]);

  const showDropdown = userRole === 'admin' || userRole === 'manager';

  const NavLink = ({ href, label }: { href: string; label: string }) => (
    <Link
      href={href}
      className={cn(
        "text-lg font-medium transition-colors hover:text-white",
        pathname === href ? "text-white" : "text-gray-300"
      )}
      onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-transparent shadow-sm">
      <div className="container mx-auto grid h-16 grid-cols-3 items-center px-4 md:px-8">
        
        {/* Sandwich Menu (Left) */}
        <div className="justify-self-start">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-white/20 h-12 w-12">
                <Menu className="h-8 w-8 text-white" strokeWidth={3} />
                <span className="sr-only">Открыть меню</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-[rgba(0,0,0,0.6)] text-white backdrop-blur-sm">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <SheetDescription className="sr-only">Main navigation menu</SheetDescription>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                  <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                    <Wrench className="h-8 w-8 text-white" />
                    <span className="font-headline text-2xl font-bold">PrintLux</span>
                  </Link>
                </div>
                <nav className="flex flex-col gap-6 p-4">
                  {navLinks.map((link) => (
                    <NavLink key={link.href} {...link} />
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo (Center) */}
        <div className="justify-self-center">
          <Link href="/" className="flex items-center gap-2">
            <Wrench className="h-8 w-8 text-white" />
            <span className="font-headline text-4xl md:text-5xl font-bold text-white">PrintLux</span>
          </Link>
        </div>

        {/* Icons (Right) */}
        <div className="flex items-center justify-self-end gap-1 sm:gap-2">
           {showDropdown && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="group rounded-full hover:bg-white/90 transition-colors h-10 w-10 sm:h-12 sm:w-12">
                   <Briefcase className="h-6 w-6 sm:h-8 sm:w-8 text-white group-hover:text-blue-900 transition-colors" strokeWidth={3} />
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
                        <AdminIcon className="mr-2 h-4 w-4" />
                        <span>Панель админа</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
           )}
          <Button variant="ghost" size="icon" asChild className="relative group rounded-full hover:bg-white/90 transition-colors h-10 w-10 sm:h-12 sm:w-12">
            <Link href="/cart">
              <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-white group-hover:text-blue-900 transition-colors" strokeWidth={3} />
              <span className="sr-only">Корзина</span>
              {isMounted && totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                  {totalItems}
                </span>
              )}
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild className="group rounded-full hover:bg-white/90 transition-colors h-10 w-10 sm:h-12 sm:w-12">
            <Link href={isAuthenticated ? "/profile" : "/login"}>
              <User 
                className={cn(
                  "h-6 w-6 sm:h-8 sm:w-8 group-hover:text-blue-900 transition-colors",
                  isAuthenticated ? "text-destructive" : "text-white"
                )} 
                strokeWidth={3} 
              />
              <span className="sr-only">Профиль</span>
            </Link>
          </Button>
        </div>

      </div>
    </header>
  );
}

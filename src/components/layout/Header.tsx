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
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


const navLinks = [
  { href: '/', label: 'Главная' },
  { href: '/catalog', label: 'Каталог' },
  { href: '/about', label: 'О нас' },
  { href: '/contact', label: 'Контакты' },
];

const panelLinks = [
    { href: '/manager', label: 'Панель менеджера' },
    { href: '/admin', label: 'Панель админа' },
];

export function Header({ isAuthenticated }: { isAuthenticated: boolean }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      <div className="container relative mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        
        {/* Sandwich Menu (Left) */}
        <div>
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-white/20">
                <Menu className="h-8 w-8 text-white" strokeWidth={3} />
                <span className="sr-only">Открыть меню</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-gray-900 bg-opacity-90 text-white backdrop-blur-sm">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <SheetDescription className="sr-only">Main navigation menu</SheetDescription>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                  <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                    <Wrench className="h-6 w-6 text-white" />
                    <span className="font-headline text-xl font-bold">PrintLuxe</span>
                  </Link>
                </div>
                <nav className="flex flex-col gap-6 p-4">
                  {navLinks.map((link) => (
                    <NavLink key={link.href} {...link} />
                  ))}
                </nav>
                <div className="mt-auto p-4 border-t border-gray-700">
                    <h3 className="text-gray-400 text-sm font-semibold mb-4">Панели управления</h3>
                    <nav className="flex flex-col gap-4">
                        {panelLinks.map((link) => (
                            <NavLink key={link.href} {...link} />
                        ))}
                    </nav>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo (Center) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Link href="/" className="flex items-center gap-2">
            <Wrench className="h-7 w-7 text-white" />
            <span className="font-headline text-2xl font-bold text-white">PrintLuxe</span>
          </Link>
        </div>

        {/* Icons (Right) */}
        <div className="flex items-center gap-2">
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="group rounded-full hover:bg-white/90 transition-colors">
                 <Briefcase className="h-6 w-6 text-white group-hover:text-blue-900 transition-colors" strokeWidth={3} />
                 <span className="sr-only">Панели</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
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
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" asChild className="group rounded-full hover:bg-white/90 transition-colors">
            <Link href="/cart">
              <ShoppingCart className="h-6 w-6 text-white group-hover:text-blue-900 transition-colors" strokeWidth={3} />
              <span className="sr-only">Корзина</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild className="group rounded-full hover:bg-white/90 transition-colors">
            <Link href={isAuthenticated ? "/profile" : "/login"}>
              <User 
                className={cn(
                  "h-6 w-6 group-hover:text-blue-900 transition-colors",
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


'use client';

import Link from 'next/link';
import { Menu, ShoppingCart, User, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { useCartStore } from '@/hooks/use-cart-store';
import { useSidebarStore } from '@/hooks/use-sidebar-store';
import { SidebarNav } from './SidebarNav';

interface HeaderProps {
  isAuthenticated: boolean;
  userRole: string | null;
  runningLineText: string | null;
}

export function Header({ isAuthenticated, userRole, runningLineText }: HeaderProps) {
  const { isOpen, toggle: toggleSidebar, close: closeSidebar } = useSidebarStore();
  
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  const showDropdown = userRole === 'admin' || userRole === 'manager';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/20 backdrop-blur-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-8 gap-4">
        
        <DropdownMenu open={isOpen} onOpenChange={toggleSidebar}>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer">
              <Button variant="ghost" size="icon" className="hover:bg-white/20 h-12 w-12 text-white">
                  <Menu className="h-8 w-8 text-white" />
                  <span className="sr-only">Открыть меню</span>
              </Button>
              <span className="hidden sm:inline font-headline text-2xl md:text-3xl font-bold text-white">
                  PrintLux
              </span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 border-white/20">
            <SidebarNav onLinkClick={closeSidebar} />
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Running Line */}
        {runningLineText && (
          <div className="hidden md:flex flex-1 items-center h-10 rounded-md bg-white/20 border border-white/30 overflow-hidden">
            <div className="relative flex w-full h-full items-center">
              <div className="absolute flex items-center whitespace-nowrap animate-marquee">
                <span className="mx-8 text-white/90 text-sm font-medium">{runningLineText}</span>
                <span className="mx-8 text-white/90 text-sm font-medium">{runningLineText}</span>
              </div>
            </div>
          </div>
        )}

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
              <DropdownMenuContent className="border-white/20">
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
                        <Menu className="mr-2 h-4 w-4" />
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
    </header>
  );
}

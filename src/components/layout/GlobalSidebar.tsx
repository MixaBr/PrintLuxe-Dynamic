
'use client';

import { useSidebarStore } from '@/hooks/use-sidebar-store';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SidebarNav } from './SidebarNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export function GlobalSidebar() {
  const { isOpen, close } = useSidebarStore();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={close}>
        <SheetContent side="left" className="bg-black/80 text-white backdrop-blur-md w-[80vw] max-w-sm p-4 border-white/20">
            <h2 className="text-xl font-bold mb-4">Меню</h2>
            <SidebarNav onLinkClick={close} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className={cn(
        "hidden md:block fixed top-0 left-0 h-full z-40 transition-transform duration-300 ease-in-out",
        "bg-black/50 backdrop-blur-sm border-r border-white/20",
        isOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"
      )}
    >
      <div className="flex flex-col h-full p-4">
        <h2 className="text-xl font-bold mb-4">Меню</h2>
        <SidebarNav onLinkClick={close} />
      </div>
    </div>
  );
}

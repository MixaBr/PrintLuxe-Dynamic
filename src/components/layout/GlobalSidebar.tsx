
'use client';

import { useSidebarStore } from '@/hooks/use-sidebar-store';
import { SidebarNav } from './SidebarNav';

export function GlobalSidebar() {
  const { isOpen, close } = useSidebarStore();
  // Этот компонент больше не управляет отображением, а просто предоставляет навигацию
  // для использования в других компонентах, например, в DropdownMenu в Header.
  // Вся логика отображения перенесена в Header.
  // При необходимости можно вернуть сложную логику, но сейчас она не требуется.
  return <SidebarNav onLinkClick={close} />;
}

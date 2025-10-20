import Link from "next/link"
import {
  Home,
  ShoppingCart,
  Package,
  Users,
  Wrench
} from "lucide-react"

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

const menuItems = [
    { href: "/admin", label: "Панель управления", icon: <Home /> },
    { href: "/admin/products", label: "Товары", icon: <Package /> },
    { href: "/admin/sales", label: "Продажи", icon: <ShoppingCart /> },
    { href: "/admin/users", label: "Пользователи", icon: <Users /> },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar>
          <SidebarHeader>
             <Link href="/" className="flex items-center gap-2">
                <Wrench className="h-6 w-6 text-primary" />
                <span className="font-headline text-xl font-bold">PrintLuxe</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
                {menuItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                        <Link href={item.href} className="w-full">
                            <SidebarMenuButton tooltip={item.label}>
                                {item.icon}
                                <span>{item.label}</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
            <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6">
                <SidebarTrigger className="md:hidden" />
                <div className="flex-1">
                    <h1 className="text-lg font-semibold">Администрирование</h1>
                </div>
            </header>
            <main className="flex-1 p-6">
                {children}
            </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

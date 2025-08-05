"use client"

import type * as React from "react"
import { useState } from "react"
import { Home, PieChart } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

// Simplificar os buckets para o menu
const menuItems = [
  {
    id: "dashboard",
    nome: "Dashboard",
    icon: Home,
  },
  {
    id: "buckets",
    nome: "Todos os Buckets",
    icon: PieChart,
  },
]

interface SidebarLayoutProps {
  children: React.ReactNode
  selectedPage: string
  onPageChange: (pageId: string) => void
}

export function SidebarLayout({ children, selectedPage, onPageChange }: SidebarLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <AppSidebar />
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
          <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}

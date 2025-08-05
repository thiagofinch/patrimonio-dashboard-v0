"use client"

import type { ReactNode } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "@/components/header"

interface AppContainerProps {
  children: ReactNode
}

export function AppContainer({ children }: AppContainerProps) {
  return (
    <div className="flex min-h-screen bg-dark">
      {/* Sidebar (Desktop) */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col">
        {/* Header Horizontal */}
        <Header />

        {/* Área de Conteúdo */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

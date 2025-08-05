"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import {
  Plus,
  Bell,
  Menu,
  ShieldHalf,
  ScrollText,
  PlusCircle,
  Pencil,
  Trash2,
  ArrowRightLeft,
  HandCoins,
  Info,
} from "lucide-react"
import { useBuckets } from "@/context/buckets-context"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { AppSidebar } from "./app-sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { LogEntry, LogType } from "@/types/patrimonio"
import { formatRelativeTime } from "@/lib/format-date"

const logIconMap: Record<LogType, React.ElementType> = {
  CREATE: PlusCircle,
  UPDATE: Pencil,
  DELETE: Trash2,
  TRANSFER: ArrowRightLeft,
  PAYMENT: HandCoins,
  SYSTEM: Info,
}

function LogItem({ log }: { log: LogEntry }) {
  const Icon = logIconMap[log.type] || Info
  return (
    <div className="flex items-start gap-4 p-3 hover:bg-white/5 rounded-lg">
      <div className="mt-1">
        <Icon className="h-4 w-4 text-white/50" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-white/90">{log.description}</p>
        <p className="text-xs text-white/50">{formatRelativeTime(log.timestamp)}</p>
      </div>
    </div>
  )
}

export function Header() {
  const { setIsGlobalModalOpen, logs = [] } = useBuckets()
  const pathname = usePathname()

  const navigationItems = [
    { label: "Dashboard", href: "/" },
    { label: "Buckets", href: "/buckets" },
    { label: "Dívidas", href: "/dividas" },
    { label: "Extratos", href: "/extratos" },
  ]

  return (
    <header className="h-16 border-b border-white/10 bg-dark/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-8">
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-dark border-r-white/10">
              <AppSidebar />
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <ShieldHalf className="h-7 w-7 text-blue-500" />
            <h1 className="hidden sm:block text-xl font-bold text-white">Patrimônio</h1>
          </Link>

          {/* Navegação Principal (Desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  "hover:bg-white/10",
                  pathname === item.href ? "bg-white/10 text-white" : "text-gray-400 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Ações do lado direito */}
        <div className="flex items-center gap-2 md:gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {logs.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-dark" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-96 mr-4" align="end">
              <DropdownMenuLabel className="flex items-center gap-2">
                <ScrollText className="h-4 w-4" />O Raio da Verdade (Logs)
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-[70vh] overflow-y-auto pr-2">
                {logs.length > 0 ? (
                  logs.map((log) => <LogItem key={log.id} log={log} />)
                ) : (
                  <div className="text-center text-sm text-white/60 py-8">Nenhuma atividade registrada.</div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => setIsGlobalModalOpen(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova Transação</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button>
                <Avatar className="h-9 w-9">
                  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                  <AvatarFallback>TB</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* Add items like Profile, Settings, Logout here */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

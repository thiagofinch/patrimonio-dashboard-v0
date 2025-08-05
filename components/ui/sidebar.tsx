"use client"

import * as React from "react"
import { useSyncExternalStore } from "react"
import { PanelLeft } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sheet, SheetContent } from "@/components/ui/sheet"

// --- Vanilla JS Store for robust state management ---
type State = { isExpanded: boolean }
type Listener = (state: State) => void

let storeState: State = { isExpanded: true }
const listeners = new Set<Listener>()

const sidebarStore = {
  init: () => {
    try {
      const storedState = localStorage.getItem("sidebar-expanded")
      if (storedState !== null) {
        storeState = { ...storeState, isExpanded: JSON.parse(storedState) }
      }
    } catch (e) {
      console.error("Could not parse sidebar state from localStorage", e)
    }
  },
  subscribe: (listener: Listener): (() => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  setExpanded: (value: boolean | ((prev: boolean) => boolean)) => {
    const newValue = typeof value === "function" ? value(storeState.isExpanded) : value
    if (storeState.isExpanded !== newValue) {
      storeState = { ...storeState, isExpanded: newValue }
      try {
        localStorage.setItem("sidebar-expanded", JSON.stringify(storeState.isExpanded))
      } catch (e) {
        console.error("Could not save sidebar state to localStorage", e)
      }
      listeners.forEach((l) => l(storeState))
    }
  },
  getSnapshot: (): State => {
    return storeState
  },
}

// Initialize store on client
if (typeof window !== "undefined") {
  sidebarStore.init()
}

// --- React Hook to interface with the store ---
function useSidebarStore() {
  const isExpanded = useSyncExternalStore(
    sidebarStore.subscribe,
    () => sidebarStore.getSnapshot().isExpanded,
    () => true, // Server-side default
  )
  return { isExpanded, setExpanded: sidebarStore.setExpanded }
}

// --- Context for Mobile state and toggle function ---
type SidebarContextType = {
  isExpanded: boolean
  toggle: () => void
  isMobile: boolean
  isMobileSheetOpen: boolean
  setMobileSheetOpen: (open: boolean) => void
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined)

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

// --- Custom Hook for Mobile Detection ---
const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(false)
  React.useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768)
    checkIsMobile()
    window.addEventListener("resize", checkIsMobile)
    return () => window.removeEventListener("resize", checkIsMobile)
  }, [])
  return isMobile
}

// --- Sidebar Provider (manages mobile state and provides toggle) ---
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const { isExpanded, setExpanded } = useSidebarStore()
  const [isMobileSheetOpen, setMobileSheetOpen] = React.useState(false)
  const isMobile = useIsMobile()

  const toggle = React.useCallback(() => {
    if (isMobile) {
      setMobileSheetOpen((prev) => !prev)
    } else {
      setExpanded((prev) => !prev)
    }
  }, [isMobile, setExpanded])

  // Keyboard shortcut
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "b" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        toggle()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggle])

  const value = {
    isExpanded: isMobile ? true : isExpanded,
    toggle,
    isMobile,
    isMobileSheetOpen,
    setMobileSheetOpen,
  }

  return (
    <SidebarContext.Provider value={value}>
      <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
    </SidebarContext.Provider>
  )
}

// --- Main Sidebar Component ---
export const Sidebar = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, children, ...props }, ref) => {
    const { isExpanded, isMobile, isMobileSheetOpen, setMobileSheetOpen } = useSidebar()

    if (isMobile) {
      return (
        <Sheet open={isMobileSheetOpen} onOpenChange={setMobileSheetOpen}>
          <SheetContent side="left" className="w-64 bg-sidebar p-0 text-sidebar-foreground border-r-0">
            <div className="flex h-full flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      )
    }

    return (
      <aside
        ref={ref}
        data-expanded={isExpanded}
        className={cn(
          "group hidden md:flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out",
          "bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-800",
          isExpanded ? "w-64" : "w-20",
          className,
        )}
        {...props}
      >
        {children}
      </aside>
    )
  },
)
Sidebar.displayName = "Sidebar"

// --- Sidebar Trigger (for mobile) ---
export const SidebarTrigger = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
  ({ className, ...props }, ref) => {
    const { toggle } = useSidebar()
    return (
      <Button ref={ref} variant="ghost" size="icon" className={cn("md:hidden", className)} onClick={toggle} {...props}>
        <PanelLeft className="h-5 w-5" />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
    )
  },
)
SidebarTrigger.displayName = "SidebarTrigger"

// --- Other Components (simplified and adapted) ---
export const SidebarHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { isExpanded } = useSidebar()
    return (
      <div
        ref={ref}
        className={cn(
          "flex h-16 items-center border-b border-gray-200 dark:border-gray-800",
          isExpanded ? "px-4" : "justify-center",
          className,
        )}
        {...props}
      />
    )
  },
)
SidebarHeader.displayName = "SidebarHeader"

export const SidebarContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex-1 overflow-y-auto overflow-x-hidden", className)} {...props} />
  ),
)
SidebarContent.displayName = "SidebarContent"

export const SidebarFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { isExpanded } = useSidebar()
    return (
      <div
        ref={ref}
        className={cn("mt-auto border-t border-gray-200 dark:border-gray-800", isExpanded ? "p-4" : "p-2", className)}
        {...props}
      />
    )
  },
)
SidebarFooter.displayName = "SidebarFooter"

export const SidebarMenu = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn("flex flex-col gap-1 px-2 py-4", className)} {...props} />
  ),
)
SidebarMenu.displayName = "SidebarMenu"

export const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>((props, ref) => (
  <li ref={ref} {...props} />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { isActive?: boolean; tooltip?: string }
>(({ className, children, isActive, tooltip, ...props }, ref) => {
  const { isExpanded } = useSidebar()

  const buttonContent = (
    <button
      ref={ref}
      className={cn(
        "flex items-center w-full gap-3 rounded-md text-sm font-medium transition-colors",
        "hover:bg-gray-100 dark:hover:bg-gray-900",
        isActive
          ? "bg-blue-500/10 text-blue-500"
          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50",
        isExpanded ? "px-3 py-2" : "h-10 w-10 justify-center",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )

  if (isExpanded || !tooltip) {
    return buttonContent
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
      <TooltipContent side="right" align="center">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
})
SidebarMenuButton.displayName = "SidebarMenuButton"

export const SidebarGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex flex-col", className)} {...props} />,
)
SidebarGroup.displayName = "SidebarGroup"

export const SidebarGroupLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { isExpanded } = useSidebar()
    if (!isExpanded) return null
    return (
      <div
        ref={ref}
        className={cn("px-4 pt-4 pb-2 text-xs font-semibold tracking-wider uppercase text-gray-400", className)}
        {...props}
      />
    )
  },
)
SidebarGroupLabel.displayName = "SidebarGroupLabel"

export const SidebarGroupContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex flex-col gap-1", className)} {...props} />,
)
SidebarGroupContent.displayName = "SidebarGroupContent"

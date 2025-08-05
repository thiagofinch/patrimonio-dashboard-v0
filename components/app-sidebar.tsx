"use client"

import type React from "react"
import { Wallet, TrendingUp, Briefcase, Home, EyeOff } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useBuckets } from "@/context/buckets-context"
import { Badge } from "@/components/ui/badge"

export function AppSidebar() {
  const pathname = usePathname()
  const { buckets } = useBuckets()

  const bucketsByCategory = buckets.reduce(
    (acc, bucket) => {
      const category = bucket.categoria || "Outros"
      if (!acc[category]) acc[category] = []
      acc[category].push(bucket)
      return acc
    },
    {} as Record<string, typeof buckets>,
  )

  const categoryIcons: { [key: string]: React.ElementType } = {
    "Investimentos Líquidos": TrendingUp,
    Empréstimos: Briefcase,
    "Ativos Imobilizados": Home,
    Outros: Wallet,
  }

  return (
    <aside className="hidden md:block w-64 bg-dark border-r border-white/10 min-h-screen overflow-y-auto">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">Meus Buckets</h2>

        <div className="space-y-6">
          {Object.entries(bucketsByCategory).map(([category, categoryBuckets]) => {
            const Icon = categoryIcons[category as keyof typeof categoryIcons] || Wallet

            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-2 text-xs font-medium text-gray-500 px-3">
                  <Icon className="h-4 w-4" />
                  <span>{category}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {categoryBuckets.length}
                  </Badge>
                </div>

                <div className="space-y-1">
                  {categoryBuckets.map((bucket) => {
                    const bucketPath = `/buckets/${bucket.id}`
                    const isActivePath = pathname === bucketPath
                    const BucketIcon = bucket.icon || Wallet

                    return (
                      <Link
                        key={bucket.id}
                        href={bucketPath}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-lg transition-colors",
                          "hover:bg-white/10",
                          isActivePath ? "bg-white/10 text-white" : "text-gray-400 hover:text-white",
                          bucket.isActive === false && "opacity-50",
                        )}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <BucketIcon className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate text-sm">{bucket.nome}</span>
                          {bucket.isActive === false && <EyeOff className="h-3 w-3 text-gray-500 flex-shrink-0" />}
                        </div>

                        <span className="text-xs text-gray-500 ml-2">{bucket.moedaPrincipal}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-8 pt-4 border-t border-white/10">
          <div className="text-xs text-gray-500 px-3 space-y-1">
            <div className="flex justify-between">
              <span>Buckets Ativos:</span>
              <span className="font-medium text-green-400">{buckets.filter((b) => b.isActive !== false).length}</span>
            </div>
            <div className="flex justify-between">
              <span>Buckets Inativos:</span>
              <span className="font-medium text-gray-400">{buckets.filter((b) => b.isActive === false).length}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total:</span>
              <span className="font-medium text-white">{buckets.length}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

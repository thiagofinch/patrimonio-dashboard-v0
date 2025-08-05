"use client"

import { useState, useEffect } from "react"
import { Calendar, TrendingUp, Tag, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import type { Bucket } from "@/types/patrimonio"

interface FiltersPanelProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilters: (filters: any) => void
  buckets: Bucket[]
  currentFilters: any
}

export function ExtratoFiltersPanel({ isOpen, onClose, onApplyFilters, buckets, currentFilters }: FiltersPanelProps) {
  const [filters, setFilters] = useState(currentFilters)

  useEffect(() => {
    setFilters(currentFilters)
  }, [currentFilters])

  // Opções de período rápido
  const quickPeriods = [
    { label: "Hoje", value: "1d", days: 1 },
    { label: "7 dias", value: "7d", days: 7 },
    { label: "15 dias", value: "15d", days: 15 },
    { label: "30 dias", value: "30d", days: 30 },
    { label: "60 dias", value: "60d", days: 60 },
    { label: "90 dias", value: "90d", days: 90 },
    { label: "6 meses", value: "6m", months: 6 },
    { label: "1 ano", value: "12m", months: 12 },
    { label: "Este mês", value: "thisMonth", special: true },
    { label: "Mês passado", value: "lastMonth", special: true },
  ]

  // Status disponíveis
  const statusOptions = [
    { value: "Confirmado", label: "Confirmado", color: "bg-green-500" },
    { value: "Pendente", label: "Pendente", color: "bg-yellow-500" },
    { value: "Cancelado", label: "Cancelado", color: "bg-red-500" },
  ]

  // Tipos de transação
  const transactionTypes = [
    { value: "entrada", label: "Entradas", icon: "↑", color: "text-green-500" },
    { value: "saida_despesa", label: "Saídas", icon: "↓", color: "text-red-500" },
    { value: "saida_emprestimo", label: "Empréstimos", icon: "→", color: "text-orange-500" },
    { value: "transferencia", label: "Transferências", icon: "↔", color: "text-blue-500" },
  ]

  // Categorias
  const categories = [
    "Investimentos",
    "Empréstimos",
    "Ativos Imobilizados",
    "Rendimento",
    "Despesa",
    "Transferência",
    "Outros",
  ]

  const handleQuickPeriod = (period: any) => {
    let from = new Date()
    let to = new Date()

    if (period.special) {
      if (period.value === "thisMonth") {
        from = startOfMonth(new Date())
        to = endOfMonth(new Date())
      } else if (period.value === "lastMonth") {
        const lastMonth = subMonths(new Date(), 1)
        from = startOfMonth(lastMonth)
        to = endOfMonth(lastMonth)
      }
    } else if (period.days) {
      from = subDays(new Date(), period.days)
    } else if (period.months) {
      from = subMonths(new Date(), period.months)
    }

    setFilters({
      ...filters,
      dateRange: { from, to },
      selectedPeriod: period.value,
    })
  }

  const toggleBucket = (bucketId: string) => {
    setFilters((prev: any) => {
      const selected = prev.selectedBuckets || []
      if (selected.includes(bucketId)) {
        return { ...prev, selectedBuckets: selected.filter((id: string) => id !== bucketId) }
      } else {
        return { ...prev, selectedBuckets: [...selected, bucketId] }
      }
    })
  }

  const handleApply = () => {
    onApplyFilters(filters)
    onClose()
  }

  const handleReset = () => {
    const defaultFilters = {
      searchTerm: "",
      selectedBuckets: [],
      selectedTypes: [],
      dateRange: { from: new Date(new Date().getFullYear(), 0, 1), to: new Date() },
      valueRange: [0, Number.POSITIVE_INFINITY],
      selectedCategories: [],
      selectedStatus: [],
      currency: "all",
      selectedPeriod: "all",
    }
    setFilters(defaultFilters)
    onApplyFilters(defaultFilters)
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Filtros Avançados</SheetTitle>
          <SheetDescription>Refine a visualização do seu extrato consolidado.</SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 py-6">
            {/* Período */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <Label className="text-base font-medium">Período</Label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-400">De</Label>
                  <Input
                    type="date"
                    value={format(filters.dateRange?.from || new Date(), "yyyy-MM-dd")}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        dateRange: {
                          ...filters.dateRange,
                          from: new Date(e.target.value),
                        },
                      })
                    }
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Até</Label>
                  <Input
                    type="date"
                    value={format(filters.dateRange?.to || new Date(), "yyyy-MM-dd")}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        dateRange: {
                          ...filters.dateRange,
                          to: new Date(e.target.value),
                        },
                      })
                    }
                    className="h-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-400">Atalhos</Label>
                <div className="grid grid-cols-3 gap-2">
                  {quickPeriods.map((period) => (
                    <Button
                      key={period.value}
                      variant={filters.selectedPeriod === period.value ? "secondary" : "outline"}
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleQuickPeriod(period)}
                    >
                      {period.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Buckets */}
            <div>
              <Label className="text-base font-semibold">Buckets</Label>
              <div className="mt-2 space-y-2">
                {buckets.map((bucket) => (
                  <label
                    key={bucket.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer"
                  >
                    <Switch
                      checked={(filters.selectedBuckets || []).includes(bucket.id)}
                      onCheckedChange={() => toggleBucket(bucket.id)}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      {bucket.icon && <bucket.icon className="h-4 w-4" />}
                      <span className="text-sm">{bucket.nome}</span>
                      {bucket.isActive === false && (
                        <Badge variant="outline" className="text-xs">
                          Inativo
                        </Badge>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <Separator />

            {/* Tipo de Transação */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gray-400" />
                <Label className="text-base font-medium">Tipo de Transação</Label>
              </div>

              <div className="space-y-2">
                {transactionTypes.map((type) => (
                  <label
                    key={type.value}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer"
                  >
                    <Switch
                      checked={(filters.selectedTypes || []).includes(type.value)}
                      onCheckedChange={(checked) => {
                        const types = filters.selectedTypes || []
                        if (checked) {
                          setFilters({ ...filters, selectedTypes: [...types, type.value] })
                        } else {
                          setFilters({
                            ...filters,
                            selectedTypes: types.filter((t: string) => t !== type.value),
                          })
                        }
                      }}
                    />
                    <span className={cn("text-lg", type.color)}>{type.icon}</span>
                    <span className="text-sm">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Separator />

            {/* Status */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Status</Label>
              <div className="space-y-2">
                {statusOptions.map((status) => (
                  <label
                    key={status.value}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer"
                  >
                    <Switch
                      checked={(filters.selectedStatus || []).includes(status.value)}
                      onCheckedChange={(checked) => {
                        const statuses = filters.selectedStatus || []
                        if (checked) {
                          setFilters({ ...filters, selectedStatus: [...statuses, status.value] })
                        } else {
                          setFilters({
                            ...filters,
                            selectedStatus: statuses.filter((s: string) => s !== status.value),
                          })
                        }
                      }}
                    />
                    <div className={cn("h-2 w-2 rounded-full", status.color)} />
                    <span className="text-sm">{status.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Separator />

            {/* Categorias */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-gray-400" />
                <Label className="text-base font-medium">Categorias</Label>
              </div>

              <div className="space-y-2">
                {categories.map((category) => (
                  <label
                    key={category}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer"
                  >
                    <Switch
                      checked={(filters.selectedCategories || []).includes(category)}
                      onCheckedChange={(checked) => {
                        const cats = filters.selectedCategories || []
                        if (checked) {
                          setFilters({ ...filters, selectedCategories: [...cats, category] })
                        } else {
                          setFilters({
                            ...filters,
                            selectedCategories: cats.filter((c: string) => c !== category),
                          })
                        }
                      }}
                    />
                    <span className="text-sm">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            <Separator />

            {/* Faixa de Valores */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <Label className="text-base font-medium">Faixa de Valores</Label>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs text-gray-400">Mínimo</Label>
                    <Input
                      type="number"
                      placeholder="R$ 0"
                      value={filters.valueRange?.[0] || 0}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          valueRange: [Number(e.target.value), filters.valueRange?.[1] || Number.POSITIVE_INFINITY],
                        })
                      }
                      className="h-9"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-gray-400">Máximo</Label>
                    <Input
                      type="number"
                      placeholder="R$ 1.000.000"
                      value={filters.valueRange?.[1] || Number.POSITIVE_INFINITY}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          valueRange: [filters.valueRange?.[0] || 0, Number(e.target.value)],
                        })
                      }
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Moeda */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Moeda</Label>
              <RadioGroup
                value={filters.currency || "all"}
                onValueChange={(value) => setFilters({ ...filters, currency: value })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="text-sm font-normal cursor-pointer">
                    Todas
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="BRL" id="brl" />
                  <Label htmlFor="brl" className="text-sm font-normal cursor-pointer">
                    Apenas BRL
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="USD" id="usd" />
                  <Label htmlFor="usd" className="text-sm font-normal cursor-pointer">
                    Apenas USD
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </ScrollArea>
        <SheetFooter>
          <Button variant="outline" onClick={handleReset}>
            Limpar
          </Button>
          <Button onClick={handleApply}>Aplicar Filtros</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

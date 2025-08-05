"use client"

import { useState, useMemo } from "react"
import { useBuckets } from "@/context/buckets-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Search,
  TrendingUp,
  TrendingDown,
  CalendarIcon,
  Eye,
  FileSpreadsheet,
  FileText,
  MoreVertical,
  SlidersHorizontal,
} from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { cn } from "@/lib/utils"
import { BucketBadge } from "@/components/bucket-badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ExtratoFiltersPanel } from "@/components/extrato-filters-panel"

export default function ExtratosPage() {
  const { buckets, exchangeRate } = useBuckets()

  // Estados de filtros
  const [isFiltersPanelOpen, setIsFiltersPanelOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBuckets, setSelectedBuckets] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string[]>([])
  const [currency, setCurrency] = useState<string>("all")
  const [selectedPeriod, setSelectedPeriod] = useState("thisMonth")

  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })
  const [minValue, setMinValue] = useState<number>(0)
  const [maxValue, setMaxValue] = useState<number>(Number.POSITIVE_INFINITY)
  const [groupBy, setGroupBy] = useState<"none" | "day" | "month" | "bucket">("none")
  const [showRunningBalance, setShowRunningBalance] = useState(true)
  const [selectedTab, setSelectedTab] = useState("all")

  // Consolidar todas as transações de buckets ATIVOS
  const allTransactions = useMemo(() => {
    if (!buckets || !exchangeRate) return []
    const activeBuckets = buckets.filter((b) => b.isActive !== false)
    return activeBuckets
      .flatMap((bucket) =>
        bucket.extratos.map((extrato) => ({
          ...extrato,
          bucketId: bucket.id,
          bucketNome: bucket.nome,
          bucketMoeda: bucket.moedaPrincipal,
          bucketIcon: bucket.icon,
          bucketCategoria: bucket.categoria,
          valorConvertido:
            bucket.moedaPrincipal === "USD" ? (extrato.valorUSD || 0) * exchangeRate : extrato.valorBRL || 0,
        })),
      )
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
  }, [buckets, exchangeRate])

  // Aplicar filtros
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((transaction) => {
      const transactionDate = new Date(transaction.data)

      if (
        searchTerm &&
        !transaction.descricao.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !transaction.finalidade?.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false
      }
      if (selectedBuckets.length > 0 && !selectedBuckets.includes(transaction.bucketId)) {
        return false
      }
      if (selectedTypes.length > 0 && !selectedTypes.includes(transaction.transacao)) {
        return false
      }
      if (transactionDate < dateRange.from || transactionDate > dateRange.to) {
        return false
      }
      if (transaction.valorConvertido < minValue || transaction.valorConvertido > maxValue) {
        return false
      }
      if (selectedTab === "income" && transaction.transacao !== "entrada") return false
      if (selectedTab === "expense" && !["saida_despesa", "saida_emprestimo"].includes(transaction.transacao))
        return false
      if (selectedTab === "loans" && !transaction.loanId) return false
      if (selectedCategories.length > 0 && !selectedCategories.includes(transaction.categoria)) {
        return false
      }
      if (selectedStatus.length > 0 && !selectedStatus.includes(transaction.status)) {
        return false
      }
      if (currency !== "all" && transaction.bucketMoeda !== currency) {
        return false
      }

      return true
    })
  }, [
    allTransactions,
    searchTerm,
    selectedBuckets,
    selectedTypes,
    dateRange,
    minValue,
    maxValue,
    selectedTab,
    selectedCategories,
    selectedStatus,
    currency,
  ])

  // Calcular métricas
  const metrics = useMemo(() => {
    const entradas = filteredTransactions
      .filter((t) => t.transacao === "entrada")
      .reduce((sum, t) => sum + t.valorConvertido, 0)
    const saidas = filteredTransactions
      .filter((t) => t.transacao.startsWith("saida"))
      .reduce((sum, t) => sum + t.valorConvertido, 0)
    const emprestimos = filteredTransactions.filter((t) => t.loanId).reduce((sum, t) => sum + t.valorConvertido, 0)
    return {
      total: filteredTransactions.length,
      entradas,
      saidas,
      saldo: entradas - saidas,
      emprestimos,
      mediaDiaria:
        filteredTransactions.length > 0
          ? (entradas - saidas) /
            (Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) || 1)
          : 0,
    }
  }, [filteredTransactions, dateRange])

  const exportToExcel = () => console.log("Exportando para Excel...")
  const exportToPDF = () => console.log("Exportando para PDF...")

  const renderTransactionRow = (transaction: any, index: number, runningBalance?: number) => {
    const isIncome = transaction.transacao === "entrada"
    const isLoan = !!transaction.loanId
    return (
      <TableRow key={transaction.id} className="hover:bg-white/5">
        <TableCell className="text-xs text-gray-400">{format(new Date(transaction.data), "dd/MM/yyyy")}</TableCell>
        <TableCell>
          <BucketBadge bucketName={transaction.bucketNome} />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {isIncome ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={cn("text-sm font-medium", isIncome ? "text-green-500" : "text-red-500")}>
              {transaction.transacao === "entrada"
                ? "Entrada"
                : transaction.transacao === "saida_despesa"
                  ? "Saída"
                  : "Empréstimo"}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <div>
            <p className="font-medium">{transaction.descricao}</p>
            {transaction.finalidade && <p className="text-xs text-gray-400">{transaction.finalidade}</p>}
          </div>
        </TableCell>
        <TableCell>
          {transaction.categoria && (
            <Badge variant="secondary" className="text-xs">
              {transaction.categoria}
            </Badge>
          )}
        </TableCell>
        <TableCell className="text-right">
          <span className={cn("font-mono font-semibold", isIncome ? "text-green-500" : "text-red-500")}>
            {isIncome ? "+" : "-"} {formatCurrency(transaction.valorConvertido)}
          </span>
          {transaction.bucketMoeda === "USD" && (
            <p className="text-xs text-gray-400">${(transaction.valorUSD || 0).toFixed(2)}</p>
          )}
        </TableCell>
        {showRunningBalance && (
          <TableCell className="text-right font-mono">
            {runningBalance !== undefined && formatCurrency(runningBalance)}
          </TableCell>
        )}
        <TableCell>
          <Badge variant={transaction.status === "Confirmado" ? "default" : "secondary"} className="text-xs">
            {transaction.status}
          </Badge>
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalhes
              </DropdownMenuItem>
              <DropdownMenuItem>Editar</DropdownMenuItem>
              {isLoan && <DropdownMenuItem>Ver empréstimo</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    )
  }

  const activeFilterCount =
    selectedBuckets.length + selectedTypes.length + selectedCategories.length + selectedStatus.length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Extrato Consolidado</h1>
          <p className="text-gray-400 mt-1">Visualize todas as transações de todos os seus buckets</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsFiltersPanelOpen(true)}>
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filtros
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportToPDF}>
            <FileText className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Total de Transações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.total}</p>
          </CardContent>
        </Card>
        <Card className="glass border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Entradas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-500">{formatCurrency(metrics.entradas)}</p>
          </CardContent>
        </Card>
        <Card className="glass border-red-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Saídas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">{formatCurrency(metrics.saidas)}</p>
          </CardContent>
        </Card>
        <Card className="glass border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Saldo do Período</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn("text-2xl font-bold", metrics.saldo >= 0 ? "text-blue-500" : "text-red-500")}>
              {formatCurrency(metrics.saldo)}
            </p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Média Diária</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(metrics.mediaDiaria)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por descrição ou finalidade..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <div className="p-4 space-y-4">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })}
                      >
                        Este mês
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setDateRange({
                            from: startOfMonth(subMonths(new Date(), 1)),
                            to: endOfMonth(subMonths(new Date(), 1)),
                          })
                        }
                      >
                        Mês passado
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Agrupar por..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem agrupamento</SelectItem>
                  <SelectItem value="day">Por dia</SelectItem>
                  <SelectItem value="month">Por mês</SelectItem>
                  <SelectItem value="bucket">Por bucket</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={showRunningBalance}
                  onCheckedChange={(checked) => setShowRunningBalance(Boolean(checked))}
                />
                <label className="text-sm">Mostrar saldo acumulado</label>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto bg-transparent"
                onClick={() => {
                  setSearchTerm("")
                  setSelectedBuckets([])
                  setSelectedTypes([])
                  setMinValue(0)
                  setMaxValue(Number.POSITIVE_INFINITY)
                }}
              >
                Limpar filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4 glass">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="income">Entradas</TabsTrigger>
          <TabsTrigger value="expense">Saídas</TabsTrigger>
          <TabsTrigger value="loans">Empréstimos</TabsTrigger>
        </TabsList>
        <TabsContent value={selectedTab} className="mt-4">
          <Card className="glass">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Bucket</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      {showRunningBalance && <TableHead className="text-right">Saldo</TableHead>}
                      <TableHead>Status</TableHead>
                      <TableHead className="w-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-gray-400">
                          Nenhuma transação encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((transaction, index) => {
                        let runningBalance
                        if (showRunningBalance) {
                          runningBalance = filteredTransactions
                            .slice(index)
                            .reduce(
                              (sum, t) => sum + (t.transacao === "entrada" ? t.valorConvertido : -t.valorConvertido),
                              0,
                            )
                        }
                        return renderTransactionRow(transaction, index, runningBalance)
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ExtratoFiltersPanel
        isOpen={isFiltersPanelOpen}
        onClose={() => setIsFiltersPanelOpen(false)}
        onApplyFilters={(newFilters) => {
          setSearchTerm(newFilters.searchTerm || "")
          setSelectedBuckets(newFilters.selectedBuckets || [])
          setSelectedTypes(newFilters.selectedTypes || [])
          setDateRange(newFilters.dateRange)
          setMinValue(newFilters.valueRange?.[0] || 0)
          setMaxValue(newFilters.valueRange?.[1] || Number.POSITIVE_INFINITY)
          setSelectedCategories(newFilters.selectedCategories || [])
          setSelectedStatus(newFilters.selectedStatus || [])
          setCurrency(newFilters.currency || "all")
          setSelectedPeriod(newFilters.selectedPeriod || "thisMonth")
        }}
        buckets={buckets}
        currentFilters={{
          searchTerm,
          selectedBuckets,
          selectedTypes,
          dateRange,
          valueRange: [minValue, maxValue],
          selectedCategories,
          selectedStatus,
          currency,
          selectedPeriod,
        }}
      />
    </div>
  )
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

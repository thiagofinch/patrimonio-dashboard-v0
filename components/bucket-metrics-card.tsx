"use client"

import type React from "react"

import { useState } from "react"
import { useBuckets } from "@/context/buckets-context"
import type { Bucket } from "@/types/patrimonio"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { Settings, Edit, RefreshCw, ChevronRight, Trash2, Loader2, AlertTriangle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type EditModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  bucket: Bucket
  onSave: (data: Partial<Bucket>) => Promise<void>
}

function EditModal({ open, onOpenChange, bucket, onSave }: EditModalProps) {
  // Formatação automática de números
  const formatarNumero = (valor: number | string) => {
    const numero = String(valor).replace(/\D/g, "")
    return numero.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }

  // Estados do formulário
  const [capitalInicial, setCapitalInicial] = useState(formatarNumero(bucket.capitalInicialBRL || 0))
  const [rendimento, setRendimento] = useState(bucket.taxaRendimento || 1.2)
  const [emprestimo, setEmprestimo] = useState(bucket.taxaEmprestimo || 1.32)
  const [moedaPrincipal, setMoedaPrincipal] = useState(bucket.moedaPrincipal || "BRL")
  const [categoria, setCategoria] = useState(bucket.categoria || "")

  const handleCapitalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorDigitado = e.target.value.replace(/\D/g, "")
    setCapitalInicial(formatarNumero(valorDigitado))
  }

  const parseValor = (valorFormatado: string) => {
    return Number.parseFloat(valorFormatado.replace(/\./g, ""))
  }

  const handleSave = async () => {
    try {
      await onSave({
        capitalInicialBRL: parseValor(capitalInicial),
        taxaRendimento: rendimento,
        taxaEmprestimo: emprestimo,
        moedaPrincipal: moedaPrincipal as "BRL" | "USD",
        categoria: categoria,
        // NÃO incluir saldo_atual aqui!
      })
      toast({ title: "Sucesso!", description: "Dados estratégicos do bucket atualizados." })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível atualizar os dados.",
        variant: "destructive",
      })
    }
  }

  const saldoAtual = bucket.saldoAtual || 0
  const capitalInicialNumerico = parseValor(capitalInicial)
  const percentualAlocado = capitalInicialNumerico > 0 ? (saldoAtual / capitalInicialNumerico) * 100 : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Dados Estratégicos de "{bucket.nome}"</DialogTitle>
          <DialogDescription>
            Ajuste as configurações estratégicas deste bucket. O capital inicial é o valor máximo que pode ser alocado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Capital Inicial - Campo com formatação */}
          <div className="space-y-2">
            <Label htmlFor="capital-inicial">
              Capital Inicial
              <span className="text-xs text-gray-400 ml-2">(Valor fixo - não afetado por transações)</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
              <Input
                id="capital-inicial"
                type="text"
                value={capitalInicial}
                onChange={handleCapitalChange}
                className="pl-10 font-mono text-lg"
                placeholder="0"
              />
            </div>
            <p className="text-xs text-gray-500">
              Este valor representa o capital máximo que pode ser alocado neste bucket
            </p>
          </div>

          {/* Mostrar Capital Investido (somente leitura) */}
          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-400">Capital Investido Atual</p>
                <p className="text-xs text-gray-500">Saldo atual do bucket</p>
              </div>
              <p className="text-2xl font-bold text-green-500">{formatCurrency(saldoAtual)}</p>
            </div>

            {/* Barra de progresso */}
            <div className="mt-3">
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{
                    width: `${Math.min(percentualAlocado, 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{percentualAlocado.toFixed(1)}% do capital inicial alocado</p>
            </div>
          </div>

          {/* Moeda Principal */}
          <div className="space-y-2">
            <Label htmlFor="moeda">Moeda Principal</Label>
            <Select value={moedaPrincipal} onValueChange={(value) => setMoedaPrincipal(value as "BRL" | "USD")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">Real (BRL)</SelectItem>
                <SelectItem value="USD">Dólar (USD)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Input
              id="categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              placeholder="Ex: Investimentos, Reserva de Emergência..."
            />
          </div>

          {/* Taxa de Rendimento */}
          <div className="space-y-2">
            <Label htmlFor="rendimento">Taxa de Rendimento Mensal (%)</Label>
            <Input
              id="rendimento"
              type="number"
              step="0.01"
              value={rendimento}
              onChange={(e) => setRendimento(Number.parseFloat(e.target.value))}
              className="font-mono"
            />
          </div>

          {/* Taxa de Empréstimo */}
          <div className="space-y-2">
            <Label htmlFor="emprestimo">Taxa de Empréstimo Mensal (%)</Label>
            <Input
              id="emprestimo"
              type="number"
              step="0.01"
              value={emprestimo}
              onChange={(e) => setEmprestimo(Number.parseFloat(e.target.value))}
              className="font-mono"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type SyncModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  bucket: Bucket
  onSave: (data: Partial<Bucket>) => Promise<void>
}

function SyncModal({ open, onOpenChange, bucket, onSave }: SyncModalProps) {
  const { fetchInitialData, resetBucketToInitialCapital } = useBuckets()
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const handleAction = async (action: "recalculate" | "reset") => {
    setLoadingAction(action)
    try {
      if (action === "recalculate") {
        const hasTransactions = bucket.extratos && bucket.extratos.length > 0
        if (!hasTransactions) {
          // EXTRATO VAZIO: Zerar capital investido e saldo inicial.
          await onSave({ capitalInvestido: 0 })
          toast({
            title: "Bucket Resetado para Alocação",
            description: "Capital investido foi zerado. Pronto para nova alocação.",
          })
        } else {
          // EXTRATO COM TRANSAÇÕES: comportamento original de recálculo total.
          await fetchInitialData()
          toast({
            title: "Sincronização Concluída",
            description: "O saldo do bucket foi recalculado com base no extrato.",
          })
        }
      } else if (action === "reset") {
        await resetBucketToInitialCapital(bucket.id)
        // A toast é mostrada pelo context
      }
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Erro na Sincronização",
        description: "Não foi possível completar a ação.",
        variant: "destructive",
      })
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sincronizar Saldo de "{bucket.nome}"</DialogTitle>
          <DialogDescription>
            Use estas opções para corrigir ou realinhar o saldo do bucket com base nas transações registradas.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <button
            type="button"
            onClick={() => handleAction("recalculate")}
            disabled={!!loadingAction}
            className="w-full p-4 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-900/50 rounded-lg group-hover:bg-blue-900/70 transition-colors">
                  <RefreshCw className="h-5 w-5 text-blue-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm text-white">Recalcular a partir do início</div>
                  <div className="text-xs text-gray-400">Revisa todo o extrato a partir do capital inicial.</div>
                </div>
              </div>
              {loadingAction === "recalculate" ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-300" />
              )}
            </div>
          </button>

          <Alert variant="destructive" className="bg-red-900/20 border-red-500/30">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertTitle className="text-red-400">Ação Destrutiva</AlertTitle>
            <AlertDescription className="text-red-400/80">
              Esta opção deletará PERMANENTEMENTE todas as transações do bucket.
            </AlertDescription>
          </Alert>

          <button
            type="button"
            onClick={() => handleAction("reset")}
            disabled={!!loadingAction}
            className="w-full p-4 bg-red-900/20 hover:bg-red-900/30 rounded-lg border border-red-500/40 hover:border-red-500/60 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-900/50 rounded-lg group-hover:bg-red-900/70 transition-colors">
                  <Trash2 className="h-5 w-5 text-red-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm text-red-400">Resetar para Capital Inicial</div>
                  <div className="text-xs text-red-400/80">Apaga o histórico e restaura o saldo inicial.</div>
                </div>
              </div>
              {loadingAction === "reset" ? (
                <Loader2 className="h-5 w-5 animate-spin text-red-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-red-300" />
              )}
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function BucketMetricsCard({
  bucket,
  onSave,
  hasTransactions,
}: {
  bucket: Bucket
  onSave: (data: Partial<Bucket>) => Promise<void>
  hasTransactions: boolean
}) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)

  const saldo = bucket.saldoAtual ?? 0
  const capitalInicial = bucket.capitalInicialBRL ?? 0
  const moeda = bucket.moedaPrincipal

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Capital Inicial - VALOR FIXO */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-sm">Capital Inicial</CardTitle>
            <CardDescription>Limite máximo (fixo)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(capitalInicial, moeda)}</div>
            <p className="text-xs text-muted-foreground mt-2">Valor definido na criação do bucket</p>
          </CardContent>
        </Card>

        {/* Capital Investido - SALDO ATUAL */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-sm">Capital Investido</CardTitle>
            <CardDescription>Saldo atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{formatCurrency(saldo, moeda)}</div>
            <p className="text-xs text-muted-foreground mt-2">Última linha do extrato</p>
          </CardContent>
        </Card>

        {/* Dados Estratégicos */}
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm">Dados Estratégicos</CardTitle>
              <CardDescription>Configurações base do bucket</CardDescription>
            </div>
            <div className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-800">
                    <Settings className="h-4 w-4 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setIsSyncModalOpen(true)} className="gap-3">
                    <RefreshCw className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Sincronizar Saldo</div>
                      <div className="text-xs text-gray-400">Alinhar com extrato</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsEditModalOpen(true)} className="gap-3">
                    <Edit className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Editar Dados</div>
                      <div className="text-xs text-gray-400">Configurações completas</div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Moeda:</span>
                <span>{bucket.moedaPrincipal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa Rendimento:</span>
                <span>{bucket.taxaRendimento?.toFixed(2) ?? "N/A"}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa Empréstimo:</span>
                <span>{bucket.taxaEmprestimo?.toFixed(2) ?? "N/A"}%</span>
              </div>

              {/* Barra de progresso de alocação */}
              {capitalInicial > 0 && (
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Alocação</span>
                    <span>{((saldo / capitalInicial) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{
                        width: `${Math.min((saldo / capitalInicial) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <EditModal open={isEditModalOpen} onOpenChange={setIsEditModalOpen} bucket={bucket} onSave={onSave} />
      <SyncModal open={isSyncModalOpen} onOpenChange={setIsSyncModalOpen} bucket={bucket} onSave={onSave} />
    </>
  )
}

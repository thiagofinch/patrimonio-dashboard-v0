"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { TrendingUp, ArrowRightLeft, ArrowDown, ArrowUp, Save, Info } from "lucide-react"
import { useBuckets } from "@/context/buckets-context"

export function GlobalTransacaoModal() {
  const {
    buckets,
    adicionarExtrato,
    editarExtrato,
    realizarTransferenciaSimples,
    exchangeRate,
    isGlobalModalOpen,
    setIsGlobalModalOpen,
    transactionToEdit,
    setTransactionToEdit,
    fetchInitialData,
  } = useBuckets()

  const pathname = usePathname()
  const isInBucketPage = pathname.startsWith("/buckets/")
  const currentBucketId = isInBucketPage ? pathname.split("/buckets/")[1].split("?")[0] : null
  const isEditMode = !!transactionToEdit

  // UM ÚNICO ESTADO PARA TUDO!
  const [form, setForm] = useState({
    bucketId: currentBucketId || "",
    tipo: "entrada",
    destinoTipo: "mesmo",
    bucketDestinoId: "",
    isEmprestimo: false,
    valor: "",
    descricao: "",
    data: new Date().toISOString().split("T")[0],
    finalidade: "",
    status: "Confirmado",
  })

  const [dataFormatted, setDataFormatted] = useState("")
  const [valorFormatted, setValorFormatted] = useState("")

  const selectedBucket = useMemo(() => {
    return buckets.find((b) => b.id === form.bucketId)
  }, [form.bucketId, buckets])

  // FUNÇÃO ÚNICA para atualizar qualquer campo
  const updateForm = (updates: Partial<typeof form>) => {
    console.log("📝 Atualizando form:", updates)
    setForm((prev) => ({ ...prev, ...updates }))
  }

  // Reset quando fecha
  useEffect(() => {
    if (!isGlobalModalOpen) {
      setForm({
        bucketId: currentBucketId || "",
        tipo: "entrada",
        destinoTipo: "mesmo",
        bucketDestinoId: "",
        isEmprestimo: false,
        valor: "",
        descricao: "",
        data: new Date().toISOString().split("T")[0],
        finalidade: "",
        status: "Confirmado",
      })
      setDataFormatted("")
      setValorFormatted("")
    }
  }, [isGlobalModalOpen, currentBucketId])

  // Helper functions
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const parseValorFromFormatted = (formatted: string): number => {
    if (!formatted || formatted === "0,00") return 0
    return Number.parseFloat(formatted.replace(/\./g, "").replace(",", "."))
  }

  const handleDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, "")
    valor = valor.substring(0, 8)

    if (valor.length >= 3) {
      valor = valor.substring(0, 2) + "/" + valor.substring(2)
    }
    if (valor.length >= 6) {
      valor = valor.substring(0, 5) + "/" + valor.substring(5)
    }

    setDataFormatted(valor)

    // Convert to ISO format for formData
    if (valor.length === 10) {
      const [day, month, year] = valor.split("/")
      const isoDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
      updateForm({ data: isoDate })
    }
  }

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numeros = e.target.value.replace(/\D/g, "")
    const valorFormatado = (Number(numeros) / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    setValorFormatted(valorFormatado)
    updateForm({ valor: parseValorFromFormatted(valorFormatado) })
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTransactionToEdit(null)
    }
    setIsGlobalModalOpen(open)
  }

  const handleSubmit = async () => {
    try {
      console.log("==================== SUBMIT ====================")
      console.log("Estado final do form:", JSON.stringify(form, null, 2))

      if (!form.bucketId || !form.valor) {
        toast({
          title: "Erro de Validação",
          description: "Selecione um bucket de origem e insira um valor maior que zero.",
          variant: "destructive",
        })
        return
      }

      // Validação específica para rendimento transferido
      if (form.tipo === "rendimento" && form.destinoTipo === "outro" && !form.bucketDestinoId) {
        toast({
          title: "Erro de Validação",
          description: "Selecione o bucket de destino para o rendimento.",
          variant: "destructive",
        })
        return
      }

      let contaDestinoId = null

      if (form.tipo === "rendimento" && form.destinoTipo === "outro" && form.bucketDestinoId) {
        contaDestinoId = form.bucketDestinoId
      }

      const dadosTransacao = {
        conta_origem_id: form.bucketId,
        conta_destino_id: contaDestinoId,
        transacao: form.tipo,
        descricao: form.descricao || "(+) Rentabilidade de Aplicação",
        finalidade: form.finalidade || "",
        valor_brl: form.valor,
        data: form.data,
        status: "Confirmado",
        is_rendimento: form.tipo === "rendimento",
        is_emprestimo: form.isEmprestimo,
        loan_id: form.isEmprestimo ? crypto.randomUUID() : null,
        taxa_emprestimo_custom: form.isEmprestimo ? selectedBucket?.taxaEmprestimo || 1.32 : null,
      }

      console.log("📤 Enviando:", JSON.stringify(dadosTransacao, null, 2))

      await adicionarExtrato(form.bucketId, dadosTransacao)

      await fetchInitialData()
      handleOpenChange(false)

      toast({ title: "Transação criada com sucesso!" })
    } catch (error) {
      console.error("❌ Erro no submit:", error)
      toast({
        title: "Erro",
        description: (error as Error).message,
        variant: "destructive",
      })
    }
  }

  // COMPONENTE BUCKET SELECTOR ISOLADO
  const BucketSelector = () => {
    if (form.tipo !== "rendimento" || form.destinoTipo !== "outro") return null

    return (
      <div className="space-y-3 p-4 border-2 border-dashed rounded-lg bg-gray-900/50">
        <div>
          <Label>Bucket de destino</Label>
          <select
            value={form.bucketDestinoId}
            onChange={(e) => updateForm({ bucketDestinoId: e.target.value })}
            className="w-full mt-2 p-2 bg-gray-800 border border-gray-700 rounded"
          >
            <option value="">Selecione...</option>
            {buckets
              .filter((b) => b.id !== form.bucketId)
              .map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nome}
                </option>
              ))}
          </select>
        </div>

        {/* MOSTRAR SELEÇÃO */}
        {form.bucketDestinoId && (
          <>
            <div className="p-3 bg-green-500/20 rounded">
              <div className="text-sm font-medium">
                ✅ Selecionado: {buckets.find((b) => b.id === form.bucketDestinoId)?.nome}
              </div>
              <div className="text-xs text-gray-400 mt-1">ID: {form.bucketDestinoId}</div>
            </div>

            {/* CHECKBOX EMPRÉSTIMO */}
            <div className="p-3 bg-purple-500/10 rounded">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.isEmprestimo}
                  onChange={(e) => updateForm({ isEmprestimo: e.target.checked })}
                  className="w-4 h-4"
                />
                <div>
                  <div className="font-medium">Marcar como empréstimo</div>
                  <div className="text-xs text-gray-400">
                    Este rendimento transferido representa um custo de oportunidade
                  </div>
                </div>
              </label>
            </div>
          </>
        )}
      </div>
    )
  }

  // PREVIEW DO SALDO
  const previewSaldo = useMemo(() => {
    if (!selectedBucket || !form.valor) return null

    const saldoAtual = selectedBucket.saldoAtual || 0
    let saldoPrevisto = saldoAtual

    if (form.tipo === "saida") {
      saldoPrevisto = saldoAtual - form.valor
    } else if (form.tipo === "entrada") {
      saldoPrevisto = saldoAtual + form.valor
    } else if (form.tipo === "rendimento") {
      if (form.destinoTipo === "mesmo") {
        saldoPrevisto = saldoAtual + form.valor
      } else {
        saldoPrevisto = saldoAtual // Neutro
      }
    }

    return {
      atual: saldoAtual,
      previsto: saldoPrevisto,
      diferenca: saldoPrevisto - saldoAtual,
    }
  }, [selectedBucket, form.tipo, form.valor, form.destinoTipo])

  return (
    <Dialog open={isGlobalModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Transação</DialogTitle>
          <DialogDescription>Adicione uma nova entrada, saída, rendimento ou transferência.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* DEBUG */}
          <div className="p-2 bg-gray-900 rounded text-xs font-mono">
            <div>Estado atual: {JSON.stringify(form, null, 2)}</div>
          </div>

          {/* Bucket de Origem */}
          {!isInBucketPage && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Bucket de Origem *</Label>
              <select
                value={form.bucketId}
                onChange={(e) => updateForm({ bucketId: e.target.value })}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded"
              >
                <option value="">Selecione o bucket de origem</option>
                {buckets.map((bucket) => (
                  <option key={bucket.id} value={bucket.id}>
                    {bucket.nome} - {formatCurrency(bucket.saldoAtual || 0)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* TIPOS */}
          <div>
            <Label>Tipo de Transação</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {[
                { value: "entrada", label: "Entrada", color: "green", icon: ArrowDown },
                { value: "saida", label: "Saída", color: "red", icon: ArrowUp },
                { value: "rendimento", label: "Rendimento", color: "blue", icon: TrendingUp },
                { value: "transferir", label: "Transferir", color: "purple", icon: ArrowRightLeft },
              ].map((tipo) => (
                <button
                  key={tipo.value}
                  type="button"
                  onClick={() => updateForm({ tipo: tipo.value })}
                  className={`p-3 rounded border-2 transition flex flex-col items-center ${
                    form.tipo === tipo.value
                      ? `bg-${tipo.color}-500/20 border-${tipo.color}-500`
                      : "border-gray-600 hover:bg-gray-800"
                  }`}
                >
                  <tipo.icon className={`h-4 w-4 mb-1 text-${tipo.color}-500`} />
                  <div className="text-sm">{tipo.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* OPÇÕES RENDIMENTO */}
          {form.tipo === "rendimento" && (
            <div className="p-4 border rounded bg-blue-500/5">
              <Label className="mb-3 block">Destino do Rendimento</Label>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() =>
                    updateForm({
                      destinoTipo: "mesmo",
                      bucketDestinoId: "",
                      isEmprestimo: false,
                    })
                  }
                  className={`w-full p-3 rounded border text-left ${
                    form.destinoTipo === "mesmo"
                      ? "bg-green-500/20 border-green-500"
                      : "border-gray-600 hover:bg-gray-800"
                  }`}
                >
                  <div className="font-medium">Permanece neste bucket</div>
                  <div className="text-xs text-gray-400">Será somado ao saldo</div>
                </button>

                <button
                  type="button"
                  onClick={() => updateForm({ destinoTipo: "outro" })}
                  className={`w-full p-3 rounded border text-left ${
                    form.destinoTipo === "outro"
                      ? "bg-yellow-500/20 border-yellow-500"
                      : "border-gray-600 hover:bg-gray-800"
                  }`}
                >
                  <div className="font-medium">Transferir para outro bucket</div>
                  <div className="text-xs text-gray-400">Saldo permanece neutro</div>
                </button>
              </div>

              {/* SELETOR DE BUCKET */}
              <BucketSelector />
            </div>
          )}

          {/* CAMPOS COMUNS */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data</Label>
              <Input
                type="text"
                value={dataFormatted}
                onChange={handleDataChange}
                placeholder="dd/mm/aaaa"
                maxLength={10}
              />
            </div>
            <div>
              <Label>Valor ({selectedBucket?.moedaPrincipal || "BRL"})</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                <Input
                  type="text"
                  className="pl-10 text-right font-mono"
                  placeholder="0,00"
                  value={valorFormatted}
                  onChange={handleValorChange}
                />
              </div>
            </div>
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea
              value={form.descricao}
              onChange={(e) => updateForm({ descricao: e.target.value })}
              placeholder={
                form.tipo === "entrada"
                  ? "Ex: Salário, Venda, Recebimento..."
                  : form.tipo === "saida"
                    ? "Ex: Conta de luz, Compra, Pagamento..."
                    : form.tipo === "rendimento"
                      ? "Ex: Rendimento CDI, Dividendos, Juros..."
                      : "Ex: Reserva para projeto, Investimento..."
              }
              className="min-h-[80px]"
              required
            />
          </div>

          {/* PREVIEW DO SALDO */}
          {previewSaldo && (
            <Alert className="bg-blue-900/20 border-blue-500/30">
              <Info className="h-4 w-4 !text-blue-400" />
              <AlertTitle className="text-blue-300">Preview do Saldo</AlertTitle>
              <AlertDescription className="text-blue-400 space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Saldo Atual:</span>
                    <div className="font-mono font-bold">{formatCurrency(previewSaldo.atual)}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Saldo Após:</span>
                    <div
                      className={`font-mono font-bold ${previewSaldo.diferenca >= 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      {formatCurrency(previewSaldo.previsto)}
                    </div>
                  </div>
                </div>
                {previewSaldo.diferenca !== 0 && (
                  <div className="text-center pt-2 border-t border-blue-500/20">
                    <span className="text-xs text-gray-400">Diferença: </span>
                    <span
                      className={`font-mono font-bold ${previewSaldo.diferenca >= 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      {previewSaldo.diferenca >= 0 ? "+" : ""}
                      {formatCurrency(previewSaldo.diferenca)}
                    </span>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !form.valor || (form.tipo === "rendimento" && form.destinoTipo === "outro" && !form.bucketDestinoId)
              }
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Transação
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

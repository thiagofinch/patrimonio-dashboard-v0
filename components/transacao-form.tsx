"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
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

interface TransacaoFormProps {
  bucketId: string
  isOpen: boolean
  onClose: () => void
}

const initialFormData = {
  data: new Date().toISOString().split("T")[0],
  valor: 0,
  descricao: "",
  finalidade: "",
  status: "Confirmado",
}

export function TransacaoForm({ bucketId, isOpen, onClose }: TransacaoFormProps) {
  const { buckets, adicionarExtrato, realizarTransferenciaSimples, exchangeRate, fetchInitialData } = useBuckets()

  const [formData, setFormData] = useState(initialFormData)
  const [dataFormatted, setDataFormatted] = useState("")
  const [valorFormatted, setValorFormatted] = useState("")
  const [destino, setDestino] = useState("mesmo")
  const [tipo, setTipo] = useState<"entrada" | "saida" | "rendimento" | "transferencia">("entrada")
  const [isEmprestimo, setIsEmprestimo] = useState(false)
  const [bucketDestinoId, setBucketDestinoId] = useState<string | null>(null)

  const selectedBucket = useMemo(() => {
    return buckets.find((b) => b.id === bucketId)
  }, [bucketId, buckets])

  // REGRA: Mostrar opção de empréstimo
  const mostrarCheckboxEmprestimo = useMemo(() => {
    return tipo === "saida" || (tipo === "rendimento" && destino !== "mesmo" && destino !== "outro")
  }, [tipo, destino])

  // PREVIEW DO SALDO
  const previewSaldo = useMemo(() => {
    if (!selectedBucket || formData.valor <= 0) return null

    const saldoAtual = selectedBucket.saldoAtual || 0
    let saldoPrevisto = saldoAtual

    if (tipo === "saida") {
      saldoPrevisto = saldoAtual - formData.valor
    } else if (tipo === "entrada") {
      saldoPrevisto = saldoAtual + formData.valor
    } else if (tipo === "rendimento") {
      if (destino === "mesmo") {
        saldoPrevisto = saldoAtual + formData.valor
      } else {
        saldoPrevisto = saldoAtual // Neutro
      }
    } else if (tipo === "transferencia") {
      saldoPrevisto = saldoAtual - formData.valor
    }

    return {
      atual: saldoAtual,
      previsto: saldoPrevisto,
      diferenca: saldoPrevisto - saldoAtual,
    }
  }, [selectedBucket, tipo, formData.valor, destino])

  // Helper functions
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const getSugestoes = (tipoTransacao: string) => {
    switch (tipoTransacao) {
      case "entrada":
        return ["Salário", "Venda", "Serviço prestado", "Recebimento"]
      case "saida":
        return ["Conta de luz", "Internet", "Compra", "Pagamento"]
      case "rendimento":
        return ["Rendimento CDI", "Dividendos", "Juros", "Rentabilidade"]
      case "transferencia":
        return ["Reserva emergência", "Investimento", "Projeto"]
      default:
        return []
    }
  }

  const parseValorFromFormatted = (formatted: string): number => {
    if (!formatted || formatted === "0,00") return 0
    return Number.parseFloat(formatted.replace(/\./g, "").replace(",", "."))
  }

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toLocaleDateString("pt-BR")
      setFormData(initialFormData)
      setDataFormatted(today)
      setValorFormatted("")
      setDestino("mesmo")
      setTipo("entrada")
      setIsEmprestimo(false)
      setBucketDestinoId(null)
    }
  }, [isOpen])

  // Reset empréstimo quando não aplicável
  useEffect(() => {
    if (!mostrarCheckboxEmprestimo) {
      setIsEmprestimo(false)
    }
  }, [mostrarCheckboxEmprestimo])

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setFormData(initialFormData)
      setDataFormatted("")
      setValorFormatted("")
      setDestino("mesmo")
      setTipo("entrada")
      setIsEmprestimo(false)
      setBucketDestinoId(null)
      onClose()
    }
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
      setFormData((prev) => ({ ...prev, data: isoDate }))
    }
  }

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numeros = e.target.value.replace(/\D/g, "")
    const valorFormatado = (Number(numeros) / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    setValorFormatted(valorFormatado)
    setFormData((prev) => ({ ...prev, valor: parseValorFromFormatted(valorFormatado) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.valor <= 0) {
      toast({
        title: "Erro de Validação",
        description: "Insira um valor maior que zero.",
        variant: "destructive",
      })
      return
    }

    // Validação para rendimento/transferência
    if (tipo === "transferencia" && !bucketDestinoId) {
      toast({
        title: "Erro de Validação",
        description: "Selecione o bucket de destino.",
        variant: "destructive",
      })
      return
    }

    if (tipo === "rendimento" && destino === "outro" && !bucketDestinoId) {
      toast({
        title: "Erro de Validação",
        description: "Selecione o bucket de destino para o rendimento.",
        variant: "destructive",
      })
      return
    }

    // CONFIRMAÇÃO COM PREVIEW DO SALDO
    if (previewSaldo) {
      const confirmMessage = `
Confirmação de Transação:

Tipo: ${tipo === "entrada" ? "Entrada" : tipo === "saida" ? "Saída" : tipo === "rendimento" ? "Rendimento" : "Transferência"}
Valor: ${formatCurrency(formData.valor)}
${tipo === "rendimento" ? "💰 Rendimento" : ""}
${isEmprestimo ? "🏦 Empréstimo" : ""}

Saldo Atual: ${formatCurrency(previewSaldo.atual)}
Saldo Após: ${formatCurrency(previewSaldo.previsto)}
${previewSaldo.diferenca !== 0 ? `Diferença: ${formatCurrency(previewSaldo.diferenca)}` : ""}

Confirmar?`

      if (!window.confirm(confirmMessage)) {
        return
      }
    }

    try {
      // NOVA LÓGICA BASEADA NO TIPO
      if (tipo === "transferencia") {
        if (!bucketDestinoId) {
          toast({
            title: "Erro de Validação",
            description: "Selecione um bucket de destino.",
            variant: "destructive",
          })
          return
        }
        await realizarTransferenciaSimples({
          origemId: bucketId,
          destinoId: bucketDestinoId,
          valor: formData.valor,
          data: formData.data,
          descricao: formData.descricao,
        })
      } else if (tipo === "rendimento") {
        // RENDIMENTO - usar processarTransacao diretamente
        const dadosTransacao = {
          conta_origem_id: bucketId, // STRING, não UUID!
          conta_destino_id: destino === "mesmo" ? null : destino === "outro" ? bucketDestinoId : destino, // STRING ou null
          transacao: "rendimento",
          descricao: formData.descricao,
          finalidade: formData.finalidade,
          valor_brl: formData.valor.toString(),
          data: formData.data,
          status: formData.status,
          is_rendimento: true,
          is_emprestimo: isEmprestimo,
          loan_id: isEmprestimo ? crypto.randomUUID() : null,
          taxa_emprestimo: isEmprestimo ? selectedBucket?.taxaEmprestimo || 1.32 : null,
        }

        console.log("📤 Enviando rendimento:", dadosTransacao)
        await adicionarExtrato(bucketId, dadosTransacao)
      } else {
        // ENTRADA/SAÍDA normais
        const payloadLimpo = {
          data: formData.data,
          transacao: tipo === "entrada" ? "entrada" : "saida_despesa",
          categoria: tipo === "entrada" ? "Movimentação" : "Despesa",
          descricao: formData.descricao,
          finalidade: formData.finalidade,
          valor_brl: formData.valor,
          valor_usd: selectedBucket?.moedaPrincipal === "USD" ? formData.valor : formData.valor / exchangeRate,
          status: formData.status,
          is_rendimento: false,
          loan_id: isEmprestimo ? crypto.randomUUID() : null,
          status_emprestimo: isEmprestimo ? "ativo" : null,
          conta_destino_id: tipo === "saida" && bucketDestinoId !== "externo" ? bucketDestinoId : null,
        }

        await adicionarExtrato(bucketId, payloadLimpo)
      }

      await fetchInitialData()
      handleOpenChange(false)
      toast({ title: "Sucesso!", description: "Transação adicionada com sucesso!" })
    } catch (error) {
      console.error("Falha ao processar transação:", error)
      toast({ title: "Erro ao processar transação", description: (error as Error).message, variant: "destructive" })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Transação</DialogTitle>
          <DialogDescription>
            Adicione uma nova entrada, saída, rendimento ou transferência para {selectedBucket?.nome}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Tipo de Transação - AGORA COM 4 OPÇÕES */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tipo de Transação</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={tipo === "entrada" ? "default" : "outline"}
                onClick={() => setTipo("entrada")}
                className="flex items-center gap-2"
              >
                <ArrowDown className="h-4 w-4 text-green-500" />
                Entrada
              </Button>
              <Button
                type="button"
                variant={tipo === "saida" ? "default" : "outline"}
                onClick={() => setTipo("saida")}
                className="flex items-center gap-2"
              >
                <ArrowUp className="h-4 w-4 text-red-500" />
                Saída
              </Button>
              <Button
                type="button"
                variant={tipo === "rendimento" ? "default" : "outline"}
                onClick={() => setTipo("rendimento")}
                className="flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Rendimento
              </Button>
              <Button
                type="button"
                variant={tipo === "transferencia" ? "default" : "outline"}
                onClick={() => setTipo("transferencia")}
                className="flex items-center gap-2"
              >
                <ArrowRightLeft className="h-4 w-4 text-purple-500" />
                Transferir
              </Button>
            </div>

            {/* CAMPO DE DESTINO - Aparece para Saída, Rendimento ou Transferência */}
            {(tipo === "saida" || tipo === "rendimento" || tipo === "transferencia") && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  {tipo === "rendimento"
                    ? "Destino do Rendimento"
                    : tipo === "transferencia"
                      ? "Bucket de Destino"
                      : "Destino"}
                </Label>

                {/* Para RENDIMENTO - opções especiais */}
                {tipo === "rendimento" ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-800">
                        <input
                          type="radio"
                          name="destino-rendimento"
                          value="mesmo"
                          checked={destino === "mesmo"}
                          onChange={() => {
                            setDestino("mesmo")
                            setBucketDestinoId(null)
                            setIsEmprestimo(false)
                          }}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <p className="font-medium">Permanece neste bucket</p>
                          <p className="text-xs text-gray-400">Será somado ao saldo</p>
                        </div>
                        <Badge variant="outline" className="text-green-500">
                          +Saldo
                        </Badge>
                      </label>

                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-800">
                        <input
                          type="radio"
                          name="destino-rendimento"
                          value="outro"
                          checked={destino === "outro"}
                          onChange={() => setDestino("outro")}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <p className="font-medium">Transferir para outro bucket</p>
                          <p className="text-xs text-gray-400">Saldo permanece neutro</p>
                        </div>
                        <Badge variant="outline" className="text-yellow-500">
                          Neutro
                        </Badge>
                      </label>
                    </div>

                    {/* Seletor de bucket quando escolheu "outro" */}
                    {destino === "outro" && (
                      <div className="p-4 border-2 border-dashed border-yellow-500/30 rounded-lg bg-yellow-500/5 space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Selecione o bucket de destino</Label>
                          <select
                            value={bucketDestinoId || ""}
                            onChange={(e) => setBucketDestinoId(e.target.value || null)}
                            className="w-full mt-2 p-2 bg-gray-800 border border-gray-600 rounded text-white"
                          >
                            <option value="">Escolha um bucket...</option>
                            {buckets
                              .filter((b) => b.id !== bucketId)
                              .map((bucket) => (
                                <option key={bucket.id} value={bucket.id}>
                                  {bucket.nome}
                                </option>
                              ))}
                          </select>
                        </div>

                        {/* Confirmação da seleção */}
                        {bucketDestinoId && (
                          <>
                            <div className="p-3 bg-green-500/20 border border-green-500/30 rounded">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="font-medium">
                                  Destino: {buckets.find((b) => b.id === bucketDestinoId)?.nome}
                                </span>
                              </div>
                              <div className="text-xs text-gray-400 mt-1">ID: {bucketDestinoId}</div>
                            </div>

                            {/* Checkbox de empréstimo */}
                            <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/20">
                              <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isEmprestimo}
                                  onChange={(e) => setIsEmprestimo(e.target.checked)}
                                  className="w-4 h-4 mt-1"
                                />
                                <div>
                                  <p className="font-medium text-white">Marcar como empréstimo</p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    Este rendimento transferido representa um custo de oportunidade (empréstimo
                                    implícito)
                                  </p>
                                </div>
                              </label>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  // Para SAÍDA/TRANSFERÊNCIA - dropdown normal
                  <Select
                    value={tipo === "transferencia" ? bucketDestinoId || "" : destino}
                    onValueChange={(value) => {
                      if (tipo === "transferencia") {
                        setBucketDestinoId(value)
                      } else {
                        const finalValue = value === "__externo__" ? "externo" : value === "" ? null : value
                        setDestino(finalValue || "")
                        setBucketDestinoId(finalValue)
                        // Reset empréstimo se escolher externo
                        if (finalValue === "externo") {
                          setIsEmprestimo(false)
                        }
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={tipo === "transferencia" ? "Para onde transferir" : "Selecione o destino"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {tipo === "saida" && (
                        <>
                          <SelectItem value="__externo__">
                            <div className="flex items-center gap-2">
                              <ArrowUp className="h-4 w-4 text-gray-400" />
                              <span>Externo (fora dos buckets)</span>
                            </div>
                          </SelectItem>
                          <SelectSeparator />
                        </>
                      )}
                      {buckets
                        .filter((b) => b.id !== bucketId)
                        .map((bucket) => (
                          <SelectItem key={bucket.id} value={bucket.id}>
                            <div className="flex items-center gap-2">
                              {bucket.icon && <bucket.icon className="h-4 w-4" />}
                              <span>{bucket.nome}</span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Checkbox de Empréstimo para saída interna */}
                {tipo === "saida" && bucketDestinoId && bucketDestinoId !== "externo" && (
                  <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/20">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isEmprestimo}
                        onChange={(e) => setIsEmprestimo(e.target.checked)}
                        className="w-4 h-4 mt-1"
                      />
                      <div>
                        <p className="font-medium text-white">Marcar como empréstimo</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Acompanhe este valor como um empréstimo ativo no painel de dívidas
                        </p>
                      </div>
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Checkbox de Empréstimo - aparece para Saída interna OU Rendimento transferido */}
            {mostrarCheckboxEmprestimo && (
              <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/20">
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={isEmprestimo}
                    onCheckedChange={(checked) => setIsEmprestimo(!!checked)}
                    disabled={tipo === "saida" && destino === "externo"}
                  />
                  <div>
                    <p className="font-medium text-white">Marcar como empréstimo</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {tipo === "rendimento"
                        ? "Este rendimento transferido representa um custo de oportunidade (empréstimo implícito)"
                        : "Acompanhe este valor como um empréstimo ativo no painel de dívidas"}
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Data e Valor - Em linha para economizar espaço */}
          <div className="grid grid-cols-2 gap-4">
            {/* Campo de Data com máscara */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Data</Label>
              <Input
                type="text"
                value={dataFormatted}
                onChange={handleDataChange}
                placeholder="dd/mm/aaaa"
                maxLength={10}
              />
            </div>

            {/* Campo de Valor com formatação */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Valor ({selectedBucket?.moedaPrincipal || "BRL"})</Label>
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

          {/* Descrição com sugestões inteligentes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Descrição</Label>
            <Textarea
              placeholder={
                tipo === "entrada"
                  ? "Ex: Salário, Venda, Recebimento..."
                  : tipo === "saida"
                    ? "Ex: Conta de luz, Compra, Pagamento..."
                    : tipo === "rendimento"
                      ? "Ex: Rendimento CDI, Dividendos, Juros..."
                      : "Ex: Reserva para projeto, Investimento..."
              }
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="min-h-[80px]"
              required
            />

            {/* Sugestões baseadas no tipo */}
            <div className="flex flex-wrap gap-2">
              {getSugestoes(tipo).map((sugestao) => (
                <Button
                  key={sugestao}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setFormData({ ...formData, descricao: sugestao })}
                >
                  {sugestao}
                </Button>
              ))}
            </div>
          </div>

          {/* Campo de Finalidade */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Finalidade (Opcional)</Label>
            <Input
              placeholder="Detalhes adicionais sobre a transação..."
              value={formData.finalidade}
              onChange={(e) => setFormData({ ...formData, finalidade: e.target.value })}
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

          {/* Alerta Visual */}
          <Alert
            className={
              tipo === "rendimento" && destino !== "mesmo"
                ? "bg-yellow-500/10 border-yellow-500/20"
                : tipo === "rendimento" || tipo === "entrada"
                  ? "bg-green-500/10 border-green-500/20"
                  : "bg-red-500/10 border-red-500/20"
            }
          >
            <AlertDescription>
              {tipo === "rendimento" && destino === "mesmo" && <>✅ O rendimento será somado ao saldo deste bucket</>}
              {tipo === "rendimento" && destino !== "mesmo" && destino !== "outro" && (
                <>➖ Rendimento transferido - saldo permanece neutro</>
              )}
              {tipo === "rendimento" && destino === "outro" && <>⚠️ Selecione o bucket de destino acima.</>}
              {tipo === "entrada" && <>✅ Esta entrada aumentará o saldo do bucket</>}
              {tipo === "saida" && <>❌ Esta saída diminuirá o saldo do bucket</>}
              {tipo === "transferencia" && <>🔄 Transferência entre buckets</>}
            </AlertDescription>
          </Alert>
        </form>

        <DialogFooter>
          <div className="flex gap-3 pt-4 w-full">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !formData.valor ||
                formData.valor === 0 ||
                (tipo === "transferencia" && !bucketDestinoId) ||
                (tipo === "rendimento" && destino === "outro" && !bucketDestinoId)
              }
              className="flex-1 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Salvar Transação
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

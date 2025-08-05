"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CurrencyInput } from "@/components/currency-input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Calculator, DollarSign, AlertCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

interface ModalPagamentoEmprestimoProps {
  open: boolean
  onClose: () => void
  divida: {
    id: string
    credor_nome: string
    valor_principal: number
    juros_acumulados: number
    valor_total_devido: number
    loan_id: string
    dias_corridos: number
  }
  onConfirmarPagamento: (dados: {
    tipoPagamento: "total" | "parcial"
    valorPagamento: number
    valorPrincipalPago: number
    jurosPagos: number
  }) => Promise<void>
  moedaPrincipal: "BRL" | "USD"
}

export function ModalPagamentoEmprestimo({
  open,
  onClose,
  divida,
  onConfirmarPagamento,
  moedaPrincipal,
}: ModalPagamentoEmprestimoProps) {
  const [tipoPagamento, setTipoPagamento] = useState<"total" | "parcial">("total")
  const [valorParcial, setValorParcial] = useState(0)
  const [processando, setProcessando] = useState(false)

  const { valorPagamento, valorPrincipalPago, jurosPagos, saldoRestante } = useMemo(() => {
    const valorTotalDevido = divida.valor_total_devido
    if (valorTotalDevido <= 0) {
      return { valorPagamento: 0, valorPrincipalPago: 0, jurosPagos: 0, saldoRestante: 0 }
    }

    const proporcaoPrincipal = divida.valor_principal / valorTotalDevido
    const proporcaoJuros = divida.juros_acumulados / valorTotalDevido

    const pgto = tipoPagamento === "total" ? valorTotalDevido : valorParcial
    const principalPgto = pgto * proporcaoPrincipal
    const jurosPgto = pgto * proporcaoJuros
    const restante = valorTotalDevido - pgto

    return {
      valorPagamento: pgto,
      valorPrincipalPago: principalPgto,
      jurosPagos: jurosPgto,
      saldoRestante: restante,
    }
  }, [divida, tipoPagamento, valorParcial])

  const handleConfirmar = async () => {
    if (tipoPagamento === "parcial" && (valorParcial <= 0 || valorParcial >= divida.valor_total_devido)) {
      toast({
        title: "Valor Inválido",
        description: "Para pagamento parcial, o valor deve ser maior que zero e menor que o total devido.",
        variant: "destructive",
      })
      return
    }

    setProcessando(true)
    try {
      await onConfirmarPagamento({
        tipoPagamento,
        valorPagamento,
        valorPrincipalPago,
        jurosPagos,
      })
      onClose()
    } catch (error) {
      console.error("Erro ao processar pagamento:", error)
      toast({
        title: "Erro no Pagamento",
        description: "Não foi possível processar o pagamento. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setProcessando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-gray-950 border-gray-800">
        <DialogHeader>
          <DialogTitle>Pagamento de Empréstimo</DialogTitle>
          <DialogDescription>
            Dívida com {divida.credor_nome} - {divida.dias_corridos} dias corridos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo da Dívida */}
          <div className="bg-gray-900 rounded-lg p-4 space-y-2 border border-gray-800">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Principal:</span>
              <span className="font-medium font-mono">{formatCurrency(divida.valor_principal, moedaPrincipal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Juros Acumulados:</span>
              <span className="font-medium text-orange-400 font-mono">
                +{formatCurrency(divida.juros_acumulados, moedaPrincipal)}
              </span>
            </div>
            <div className="border-t border-gray-700 pt-2 flex justify-between">
              <span className="font-medium">Total Devido:</span>
              <span className="font-bold text-lg font-mono">
                {formatCurrency(divida.valor_total_devido, moedaPrincipal)}
              </span>
            </div>
          </div>

          {/* Tipo de Pagamento */}
          <div className="space-y-3">
            <Label>Tipo de Pagamento</Label>
            <RadioGroup
              value={tipoPagamento}
              onValueChange={(value: "total" | "parcial") => setTipoPagamento(value)}
              className="grid grid-cols-2 gap-4"
            >
              <Label
                htmlFor="total"
                className={`flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer ${
                  tipoPagamento === "total" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-gray-900"
                }`}
              >
                <RadioGroupItem value="total" id="total" className="sr-only" />
                <span>Pagamento Total</span>
                <span className="font-bold text-lg font-mono">
                  {formatCurrency(divida.valor_total_devido, moedaPrincipal)}
                </span>
              </Label>
              <Label
                htmlFor="parcial"
                className={`flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer ${
                  tipoPagamento === "parcial"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-gray-900"
                }`}
              >
                <RadioGroupItem value="parcial" id="parcial" className="sr-only" />
                <span>Pagamento Parcial</span>
                <span className="font-bold text-lg">Manual</span>
              </Label>
            </RadioGroup>
          </div>

          {/* Valor do Pagamento Parcial */}
          {tipoPagamento === "parcial" && (
            <div className="space-y-2">
              <Label htmlFor="valor-parcial">Valor do Pagamento Parcial</Label>
              <CurrencyInput
                id="valor-parcial"
                value={valorParcial}
                onChange={setValorParcial}
                moedaPrincipal={moedaPrincipal}
                placeholder="Digite o valor a pagar"
              />
              <p className="text-xs text-gray-500">
                Máximo: {formatCurrency(divida.valor_total_devido - 0.01, moedaPrincipal)}
              </p>
            </div>
          )}

          {/* Detalhamento do Pagamento */}
          {tipoPagamento === "parcial" && valorParcial > 0 && (
            <Alert variant="default" className="bg-gray-900 border-gray-800">
              <Calculator className="h-4 w-4" />
              <AlertTitle>Detalhamento do Pagamento</AlertTitle>
              <AlertDescription>
                <div className="space-y-1 mt-2">
                  <div className="flex justify-between text-sm">
                    <span>Principal a pagar:</span>
                    <span className="font-mono">{formatCurrency(valorPrincipalPago, moedaPrincipal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Juros a pagar:</span>
                    <span className="font-mono">{formatCurrency(jurosPagos, moedaPrincipal)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-orange-400">
                    <span>Saldo restante após pagamento:</span>
                    <span className="font-mono">{formatCurrency(saldoRestante, moedaPrincipal)}</span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Aviso */}
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>
              {tipoPagamento === "total"
                ? "O empréstimo será totalmente quitado e marcado como finalizado."
                : "O empréstimo continuará ativo com o saldo restante gerando juros diariamente."}
            </AlertDescription>
          </Alert>

          {/* Botões */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose} disabled={processando}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmar}
              disabled={processando || (tipoPagamento === "parcial" && valorParcial <= 0)}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              {processando ? "Processando..." : `Confirmar Pagamento`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

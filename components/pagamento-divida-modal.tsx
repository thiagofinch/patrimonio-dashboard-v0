"use client"

import { useState, useMemo } from "react"
import type { Bucket, Extrato } from "@/types/patrimonio"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"

type PaymentType = "total" | "parcial" | "juros"

interface PagamentoDividaModalProps {
  divida: Extrato
  juros: number
  buckets: Bucket[]
  currentBucketId: string
  onConfirm: (type: PaymentType, valor: number, bucketOrigemId: string) => void
  onClose: () => void
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)

export function PagamentoDividaModal({
  divida,
  juros,
  buckets,
  currentBucketId,
  onConfirm,
  onClose,
}: PagamentoDividaModalProps) {
  const [paymentType, setPaymentType] = useState<PaymentType>("total")
  const [partialAmount, setPartialAmount] = useState<number | string>("")
  const [sourceBucketId, setSourceBucketId] = useState<string>(currentBucketId)

  const availableBuckets = useMemo(() => buckets.filter((b) => b.id !== divida.contaOrigem), [buckets, divida])

  const valorTotal = divida.valorBRL + juros

  const handleConfirm = () => {
    let valorPagamento = 0
    if (paymentType === "total") {
      valorPagamento = valorTotal
    } else if (paymentType === "juros") {
      valorPagamento = juros
    } else if (paymentType === "parcial") {
      valorPagamento = Number(partialAmount)
    }

    if (valorPagamento > 0 && sourceBucketId) {
      onConfirm(paymentType, valorPagamento, sourceBucketId)
    }
  }

  const isConfirmDisabled = () => {
    if (!sourceBucketId) return true
    if (paymentType === "parcial" && (Number(partialAmount) <= 0 || partialAmount === "")) return true
    return false
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Realizar Pagamento de Empréstimo</DialogTitle>
        <DialogDescription>
          Selecione como deseja pagar a dívida com{" "}
          <span className="font-bold text-white">{buckets.find((b) => b.id === divida.contaOrigem)?.nome}</span>.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-white/5 p-3 rounded-lg">
            <p className="text-sm text-white/60">Valor Principal</p>
            <p className="text-lg font-bold">{formatCurrency(divida.valorBRL)}</p>
          </div>
          <div className="bg-white/5 p-3 rounded-lg">
            <p className="text-sm text-white/60">Juros Acumulados</p>
            <p className="text-lg font-bold text-red-400">{formatCurrency(juros)}</p>
          </div>
        </div>

        <RadioGroup value={paymentType} onValueChange={(value) => setPaymentType(value as PaymentType)}>
          <div className="flex items-center space-x-2 p-4 border rounded-md has-[:checked]:bg-white/5 has-[:checked]:border-blue-500">
            <RadioGroupItem value="total" id="total" />
            <Label htmlFor="total" className="w-full cursor-pointer">
              <p className="font-semibold">Quitação Total</p>
              <p className="text-sm text-white/60">
                Pagar o valor total de <span className="font-bold text-blue-400">{formatCurrency(valorTotal)}</span>{" "}
                para liquidar a dívida.
              </p>
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-4 border rounded-md has-[:checked]:bg-white/5 has-[:checked]:border-blue-500">
            <RadioGroupItem value="juros" id="juros" />
            <Label htmlFor="juros" className="w-full cursor-pointer">
              <p className="font-semibold">Pagar Apenas os Juros</p>
              <p className="text-sm text-white/60">
                Pagar <span className="font-bold text-red-400">{formatCurrency(juros)}</span> para evitar que a dívida
                cresça.
              </p>
            </Label>
          </div>
          <div className="p-4 border rounded-md has-[:checked]:bg-white/5 has-[:checked]:border-blue-500">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="parcial" id="parcial" />
              <Label htmlFor="parcial" className="w-full cursor-pointer">
                <p className="font-semibold">Pagamento Parcial</p>
                <p className="text-sm text-white/60">Amortizar um valor específico da dívida.</p>
              </Label>
            </div>
            {paymentType === "parcial" && (
              <div className="mt-3 pl-6">
                <Input
                  type="number"
                  placeholder="Digite o valor a pagar"
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                />
              </div>
            )}
          </div>
        </RadioGroup>

        {paymentType === "parcial" && (
          <Alert className="bg-blue-900/30 border-blue-500/30 text-blue-300">
            <Info className="h-4 w-4 !text-blue-300" />
            <AlertTitle>Como funciona a amortização?</AlertTitle>
            <AlertDescription>
              O valor pago será usado primeiro para abater os juros. O restante será deduzido do principal.
            </AlertDescription>
          </Alert>
        )}

        <div>
          <Label>Pagar com o bucket:</Label>
          <Select value={sourceBucketId} onValueChange={setSourceBucketId}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Selecione o bucket de origem" />
            </SelectTrigger>
            <SelectContent>
              {availableBuckets.map((bucket) => (
                <SelectItem key={bucket.id} value={bucket.id}>
                  {bucket.nome} ({formatCurrency(bucket.valorBRL)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleConfirm} disabled={isConfirmDisabled()}>
          Confirmar Pagamento
        </Button>
      </DialogFooter>
    </>
  )
}

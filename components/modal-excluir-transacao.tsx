"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, ArrowRight, Trash2, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useBuckets } from "@/context/buckets-context"
import type { Extrato } from "@/types/patrimonio"

interface ModalExcluirTransacaoProps {
  transacao: Extrato | null
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ModalExcluirTransacao({ transacao, isOpen, onClose, onConfirm }: ModalExcluirTransacaoProps) {
  const supabase = createClientComponentClient()
  const { buckets } = useBuckets()
  const [transacoesRelacionadas, setTransacoesRelacionadas] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [confirmando, setConfirmando] = useState(false)

  useEffect(() => {
    if (transacao && isOpen) {
      buscarTransacoesRelacionadas()
    }
  }, [transacao, isOpen])

  const buscarTransacoesRelacionadas = async () => {
    if (!transacao) return

    setLoading(true)
    try {
      const relacionadas = []

      // Buscar por loan_id
      if (transacao.loanId) {
        const { data: porLoanId } = await supabase
          .from("extratos")
          .select("*")
          .eq("loan_id", transacao.loanId)
          .neq("id", transacao.id)

        if (porLoanId) relacionadas.push(...porLoanId)
      }

      // Buscar por related_loan_id
      if (transacao.relatedLoanId) {
        const { data: porRelatedId } = await supabase
          .from("extratos")
          .select("*")
          .eq("related_loan_id", transacao.relatedLoanId)
          .neq("id", transacao.id)

        if (porRelatedId) relacionadas.push(...porRelatedId)
      }

      // Buscar transações no bucket de destino
      if (transacao.contaDestinoId) {
        const { data: noDestino } = await supabase
          .from("extratos")
          .select("*")
          .eq("bucket_id", transacao.contaDestinoId)
          .eq("conta_origem_id", transacao.bucketId)
          .gte("data", transacao.data)
          .neq("id", transacao.id)

        if (noDestino) relacionadas.push(...noDestino)
      }

      setTransacoesRelacionadas(relacionadas)
    } catch (error) {
      console.error("Erro ao buscar transações relacionadas:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    setConfirmando(true)
    try {
      await onConfirm()
    } finally {
      setConfirmando(false)
    }
  }

  const getBucketName = (bucketId: string) => {
    const bucket = buckets.find((b) => b.id === bucketId)
    return bucket?.nome || bucketId
  }

  const getTipoTransacao = (transacao: any) => {
    if (transacao.is_rendimento) {
      return transacao.conta_destino_id ? "Rendimento Transferido" : "Rendimento"
    }

    switch (transacao.transacao) {
      case "entrada":
        return "Entrada"
      case "saida":
      case "saida_emprestimo":
        return "Saída"
      case "rendimento":
        return "Rendimento"
      default:
        return transacao.transacao
    }
  }

  if (!transacao) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            Excluir Transação
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. Todos os dados relacionados serão removidos permanentemente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Detalhes da Transação Principal */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h4 className="font-medium mb-3">Transação a ser excluída:</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Data:</span>
                <p className="font-medium">{new Date(transacao.data).toLocaleDateString("pt-BR")}</p>
              </div>
              <div>
                <span className="text-gray-500">Tipo:</span>
                <p className="font-medium">{getTipoTransacao(transacao)}</p>
              </div>
              <div>
                <span className="text-gray-500">Descrição:</span>
                <p className="font-medium">{transacao.descricao}</p>
              </div>
              <div>
                <span className="text-gray-500">Valor:</span>
                <p className="font-medium">{formatCurrency(transacao.valorBRL)}</p>
              </div>
              {transacao.finalidade && (
                <div className="col-span-2">
                  <span className="text-gray-500">Finalidade:</span>
                  <p className="font-medium">{transacao.finalidade}</p>
                </div>
              )}
            </div>
          </div>

          {/* Fluxo entre Buckets */}
          {transacao.contaDestinoId && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="font-medium mb-3 text-blue-700 dark:text-blue-300">Fluxo entre Buckets:</h4>
              <div className="flex items-center gap-3">
                <Badge variant="outline">{getBucketName(transacao.bucketId)}</Badge>
                <ArrowRight className="h-4 w-4 text-gray-400" />
                <Badge variant="outline">{getBucketName(transacao.contaDestinoId)}</Badge>
              </div>
            </div>
          )}

          {/* Transações Relacionadas */}
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Verificando transações relacionadas...</span>
            </div>
          ) : transacoesRelacionadas.length > 0 ? (
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <h4 className="font-medium mb-3 text-orange-700 dark:text-orange-300">
                Transações relacionadas que também serão excluídas:
              </h4>
              <div className="space-y-2">
                {transacoesRelacionadas.map((rel) => (
                  <div key={rel.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                    <div>
                      <p className="font-medium text-sm">{rel.descricao}</p>
                      <p className="text-xs text-gray-500">
                        {getBucketName(rel.bucket_id)} • {new Date(rel.data).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {formatCurrency(rel.valor_brl)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Aviso de Impacto */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> Esta exclusão irá:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Remover permanentemente a transação selecionada</li>
                {transacoesRelacionadas.length > 0 && (
                  <li>Excluir {transacoesRelacionadas.length} transação(ões) relacionada(s)</li>
                )}
                <li>Recalcular automaticamente os saldos dos buckets afetados</li>
                <li>Atualizar o capital investido quando aplicável</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <Separator />

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={confirmando}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={confirmando}>
            {confirmando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Confirmar Exclusão
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

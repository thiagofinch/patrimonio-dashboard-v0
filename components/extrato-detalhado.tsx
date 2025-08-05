"use client"

import { useState, useMemo } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  AlertCircle,
  Check,
  PlusCircle,
  TrendingUp,
  ArrowDown,
  DollarSign,
  Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, cn } from "@/lib/utils"
import { useBuckets } from "@/context/buckets-context"
import type { Bucket, Extrato } from "@/types/patrimonio"
import { BucketBadge } from "./bucket-badge"
import { ModalExcluirTransacao } from "./modal-excluir-transacao"

interface ExtratoDetalhadoProps {
  bucket: Bucket
  onAddTransaction: () => void
  onEditTransaction: (extrato: Extrato) => void
  onDeleteTransaction: (extrato: Extrato, simpleDelete?: boolean) => void
  onConfirmTransaction: (transacaoId: string) => void
  onConvertToDebt: (transacao: Extrato) => void
}

const getTransacaoBadge = (extrato: Extrato) => {
  if (extrato.transacao === "alocacao" || extrato.is_alocacao_inicial) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
        <Layers className="h-3 w-3" />
        Alocação
      </div>
    )
  }
  if (extrato.transacao === "entrada") {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
        <TrendingUp className="h-3 w-3" />
        Entrada
      </div>
    )
  }
  if (extrato.transacao === "rendimento") {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
        <TrendingUp className="h-3 w-3" />
        Rendimento
      </div>
    )
  }
  if (extrato.finalidade?.toLowerCase().includes("empréstimo")) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400">
        <DollarSign className="h-3 w-3" />
        Saída (Empréstimo)
      </div>
    )
  }
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
      <ArrowDown className="h-3 w-3" />
      Saída (Despesa)
    </div>
  )
}

export default function ExtratoDetalhado({
  bucket,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onConfirmTransaction,
  onConvertToDebt,
}: ExtratoDetalhadoProps) {
  const { buckets } = useBuckets()
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null)
  const [transacaoParaExcluir, setTransacaoParaExcluir] = useState<Extrato | null>(null)
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false)
  const moedaPrincipal = bucket.moedaPrincipal || "BRL"

  const extratosParaExibir = useMemo(() => {
    const sortedExtratos = [...bucket.extratos].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())

    let saldoAcumulado = bucket.capitalInicialBRL || 0
    const extratosComSaldo = sortedExtratos.map((extrato) => {
      if (extrato.status === "Confirmado") {
        saldoAcumulado += extrato.transacao === "entrada" ? extrato.valorBRL : -extrato.valorBRL
      }
      return { ...extrato, saldoAcumulado }
    })

    return extratosComSaldo.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
  }, [bucket.extratos, bucket.capitalInicialBRL])

  // Agrupar extratos por mês
  const extratosPorMes = useMemo(() => {
    return extratosParaExibir.reduce(
      (acc, extrato) => {
        const mes = format(new Date(extrato.data), "MM/yyyy", { locale: ptBR })
        if (!acc[mes]) {
          acc[mes] = []
        }
        acc[mes].push(extrato)
        return acc
      },
      {} as Record<string, Extrato[]>,
    )
  }, [extratosParaExibir])

  // Ordenar meses (mais recente primeiro)
  const mesesOrdenados = Object.keys(extratosPorMes).sort((a, b) => {
    const [mesA, anoA] = a.split("/")
    const [mesB, anoB] = b.split("/")
    if (anoA !== anoB) return Number(anoB) - Number(anoA)
    return Number(mesB) - Number(mesA)
  })

  // Expandir o mês mais recente por padrão
  useState(() => {
    if (mesesOrdenados.length > 0 && !expandedMonth) {
      setExpandedMonth(mesesOrdenados[0])
    }
  })

  const toggleMonth = (mes: string) => {
    setExpandedMonth(expandedMonth === mes ? null : mes)
  }

  const handleDeleteClick = (extrato: Extrato) => {
    // Verificar se é transação complexa
    const isComplexTransaction = extrato.relatedLoanId || extrato.loanId || extrato.contaDestinoId

    if (isComplexTransaction) {
      const useSimpleDelete = window.confirm(
        "Esta transação tem relacionamentos. Deseja:\n" +
          "OK = Exclusão simples (apenas esta transação)\n" +
          "Cancelar = Exclusão completa (com relacionadas)",
      )

      if (useSimpleDelete) {
        // Usar exclusão simples
        onDeleteTransaction(extrato, true) // Passar flag para exclusão simples
      } else {
        // Usar exclusão completa
        setTransacaoParaExcluir(extrato)
        setModalExclusaoAberto(true)
      }
    } else {
      // Transação simples, usar exclusão normal
      setTransacaoParaExcluir(extrato)
      setModalExclusaoAberto(true)
    }
  }

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Extrato</CardTitle>
        <Button onClick={onAddTransaction}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Transação
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {mesesOrdenados.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground p-6">
            <p>Nenhuma transação encontrada.</p>
            <Button variant="outline" className="mt-4 bg-transparent" onClick={onAddTransaction}>
              Adicionar Primeira Transação
            </Button>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {mesesOrdenados.map((mes) => (
              <div key={mes} className="border border-white/10 rounded-lg overflow-hidden">
                <div
                  className="flex items-center justify-between p-3 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => toggleMonth(mes)}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {format(new Date(`${mes.split("/")[1]}-${mes.split("/")[0]}-01`), "MMMM 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-sm text-muted-foreground">{extratosPorMes[mes].length} transações</span>
                    </div>
                    {expandedMonth === mes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
                {expandedMonth === mes && (
                  <div className="relative w-full overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b-white/10">
                          <TableHead className="w-28">Data</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Finalidade</TableHead>
                          <TableHead>Destino</TableHead>
                          <TableHead className="text-right">Valor ({moedaPrincipal})</TableHead>
                          <TableHead className="text-right">Saldo Final ({moedaPrincipal})</TableHead>
                          <TableHead className="w-24 text-center">Status</TableHead>
                          <TableHead className="w-20 text-center">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {extratosPorMes[mes].map((extrato, index) => {
                          const valorPrincipal = moedaPrincipal === "BRL" ? extrato.valorBRL : (extrato.valorUSD ?? 0)
                          const bucketContrapartidaId =
                            extrato.transacao === "entrada" ? extrato.contaOrigemId : extrato.contaDestinoId
                          const bucketContrapartida = buckets.find((b) => b.id === bucketContrapartidaId)
                          const isOverdue = new Date(extrato.data) < new Date() && extrato.status === "Pendente"

                          return (
                            <TableRow
                              key={`${extrato.id}-${extrato.bucketId}-${index}`} // KEY ÚNICA COM FALLBACK
                              className={cn("border-b-white/5", extrato.status === "Pendente" && "bg-yellow-900/20")}
                            >
                              <TableCell>
                                {new Date(extrato.data).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                              </TableCell>
                              <TableCell>{getTransacaoBadge(extrato)}</TableCell>
                              <TableCell>{extrato.descricao}</TableCell>
                              <TableCell className="text-sm text-white/70">{extrato.finalidade || "--"}</TableCell>
                              <TableCell>
                                {bucketContrapartida ? (
                                  <BucketBadge bucketName={bucketContrapartida.nome} />
                                ) : (
                                  <span>--</span>
                                )}
                              </TableCell>
                              <TableCell
                                className={cn(
                                  "text-right font-semibold font-mono",
                                  extrato.transacao.startsWith("entrada") && "text-green-400",
                                  extrato.transacao.startsWith("saida") && "text-red-400",
                                  extrato.transacao === "rendimento" && "text-purple-400",
                                  extrato.is_alocacao_inicial && "text-blue-400",
                                )}
                              >
                                {extrato.is_alocacao_inicial ? (
                                  <div className="flex flex-col items-end">
                                    <span>Alocado</span>
                                    <span>{formatCurrency(extrato.valor_alocado || 0, moedaPrincipal)}</span>
                                  </div>
                                ) : (
                                  <>
                                    {extrato.transacao.startsWith("entrada") || extrato.transacao === "rendimento"
                                      ? "(+) "
                                      : "(-) "}
                                    {formatCurrency(valorPrincipal, moedaPrincipal)}
                                  </>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-medium font-mono">
                                {formatCurrency(extrato.saldoAcumulado ?? 0, moedaPrincipal)}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant={
                                    extrato.status === "Confirmado"
                                      ? "default"
                                      : isOverdue
                                        ? "destructive"
                                        : "secondary"
                                  }
                                  className={cn(
                                    "text-xs",
                                    extrato.status === "Confirmado" &&
                                      "bg-green-500/20 text-green-400 border-green-500/30",
                                    extrato.status === "Pendente" &&
                                      !isOverdue &&
                                      "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
                                    isOverdue && "bg-red-500/20 text-red-400 border-red-500/30",
                                  )}
                                >
                                  {isOverdue ? "Vencido" : extrato.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                {extrato.status === "Pendente" ? (
                                  <div className="flex gap-1 justify-center">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => onConfirmTransaction(extrato.id)}
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    {isOverdue && (
                                      <Button size="sm" variant="destructive" onClick={() => onConvertToDebt(extrato)}>
                                        <AlertCircle className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex gap-1 justify-center">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => onEditTransaction(extrato)}
                                      title="Editar"
                                    >
                                      <Edit className="h-4 w-4 text-blue-500" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeleteClick(extrato)}
                                      title="Excluir"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Modal de exclusão */}
      <ModalExcluirTransacao
        transacao={transacaoParaExcluir}
        isOpen={modalExclusaoAberto}
        onClose={() => setModalExclusaoAberto(false)}
        onConfirm={() => {
          if (transacaoParaExcluir) {
            onDeleteTransaction(transacaoParaExcluir)
          }
          setModalExclusaoAberto(false)
          setTransacaoParaExcluir(null)
        }}
      />
    </Card>
  )
}

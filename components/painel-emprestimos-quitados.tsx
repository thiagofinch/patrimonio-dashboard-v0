"use client"

import { useMemo } from "react"
import type { Bucket } from "@/types/patrimonio"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, History } from "lucide-react"
import { useBuckets } from "@/context/buckets-context"
import { BucketBadge } from "./bucket-badge"

interface PainelEmprestimosQuitadosProps {
  bucket: Bucket | undefined
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function PainelEmprestimosQuitados({ bucket }: PainelEmprestimosQuitadosProps) {
  const { buckets } = useBuckets()

  const emprestimosQuitados = useMemo(() => {
    if (!bucket) {
      return []
    }
    return bucket.extratos.filter((e) => e.transacao === "saida_emprestimo" && e.statusEmprestimo === "quitado")
  }, [bucket])

  if (!bucket || emprestimosQuitados.length === 0) {
    return null // Don't render the panel if there are no paid-off loans or bucket is not defined.
  }

  return (
    <Card className="glass border-green-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-green-400">
          <History />
          Histórico de Empréstimos Quitado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Devedor</TableHead>
              <TableHead>Data Concessão</TableHead>
              <TableHead className="text-right">Valor Emprestado</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {emprestimosQuitados.map((emprestimo) => {
              const devedor = buckets.find((b) => b.id === emprestimo.contaDestino)
              return (
                <TableRow key={emprestimo.id}>
                  <TableCell>
                    <BucketBadge bucketName={devedor?.nome || "Externo"} />
                  </TableCell>
                  <TableCell>{new Date(emprestimo.data).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(emprestimo.valorBRL)}</TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-green-500/20 text-green-400 border-none">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Quitado
                    </Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

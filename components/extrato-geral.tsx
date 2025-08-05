import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { formatCurrency, cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Extrato } from "@/types/patrimonio"
import { useBuckets } from "@/context/buckets-context"
import { BucketBadge } from "./bucket-badge"
import { TrendingUp, ArrowLeftRight, Layers } from "lucide-react"

export function ExtratoGeral() {
  const { buckets } = useBuckets()

  const allExtratos = buckets
    .flatMap((bucket) =>
      bucket.extratos
        .filter((e) => e.visivelExtrato !== false)
        .map((extrato) => ({
          ...extrato,
          bucketNome: bucket.nome,
          bucketMoeda: bucket.moedaPrincipal,
          bucketMetadata: bucket.metadata,
        })),
    )
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

  const formatTransactionType = (extrato: Extrato) => {
    const { transacao, isRendimento, is_alocacao_inicial } = extrato

    if (is_alocacao_inicial || transacao === "alocacao") {
      return (
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span>Alocação</span>
        </div>
      )
    }

    switch (transacao) {
      case "entrada":
        return (
          <div className="flex items-center gap-2">
            {isRendimento && <TrendingUp className="h-4 w-4 text-green-400" />}
            <span>Entrada</span>
          </div>
        )
      case "saida_despesa":
        return "Saída"
      case "saida_emprestimo":
        return "Empréstimo"
      case "saida_transferencia":
      case "entrada_transferencia":
        return (
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
            <span>Transferência</span>
          </div>
        )
      default:
        return transacao.charAt(0).toUpperCase() + transacao.slice(1)
    }
  }

  const getTransactionColor = (type: string) => {
    if (type.startsWith("entrada")) return "text-green-400"
    if (type.startsWith("saida")) return "text-red-400"
    if (type === "alocacao") return "text-blue-400"
    return "text-gray-400"
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Bucket</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allExtratos.length > 0 ? (
            allExtratos.slice(0, 100).map((extrato) => (
              <TableRow key={extrato.id}>
                <TableCell>{format(new Date(extrato.data), "dd/MM/yy", { locale: ptBR })}</TableCell>
                <TableCell>
                  <BucketBadge bucketName={extrato.bucketNome} metadata={extrato.bucketMetadata} />
                </TableCell>
                <TableCell>{formatTransactionType(extrato)}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{extrato.descricao}</span>
                    {extrato.finalidade && <span className="text-xs text-gray-400">{extrato.finalidade}</span>}
                  </div>
                </TableCell>
                <TableCell className={cn("text-right font-mono", getTransactionColor(extrato.transacao))}>
                  {extrato.is_alocacao_inicial ? (
                    <span className="text-muted-foreground">--</span>
                  ) : (
                    formatCurrency(
                      extrato.bucketMoeda === "BRL" ? extrato.valorBRL : extrato.valorUSD,
                      extrato.bucketMoeda,
                    )
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                Nenhuma transação encontrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

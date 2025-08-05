"use client"

import { useEffect, useState, useMemo } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react"
import { useBuckets } from "@/context/buckets-context"
import { BucketBadge } from "@/components/bucket-badge"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { Bucket, Extrato } from "@/types/patrimonio"

interface EmprestimoConsolidado {
  id: string
  loan_id: string
  credor_id: string
  credor_nome: string
  devedor_id: string
  devedor_nome: string
  data: string
  valor_principal: number
  dias_corridos: number
  juros_acumulados: number
  total_a_receber: number
  taxa_mensal: number
  tipo_origem: "emprestimo_tradicional" | "rendimento_redirecionado"
}

export default function DividasPage() {
  const { buckets } = useBuckets()
  const [emprestimosAtivos, setEmprestimosAtivos] = useState<EmprestimoConsolidado[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  const carregarTodosEmprestimos = async () => {
    if (!supabase || buckets.length === 0) return

    setLoading(true)
    try {
      console.log("🔍 Buscando TODOS os empréstimos ativos...")

      // BUSCAR TODOS OS REGISTROS COM loan_id E status_emprestimo ativo
      const { data: todosEmprestimos, error } = await supabase
        .from("extratos")
        .select("*")
        .eq("status_emprestimo", "ativo")
        .not("loan_id", "is", null)

      if (error) {
        console.error("❌ Erro na query:", error)
        throw error
      }

      console.log(`📊 Total de registros encontrados: ${todosEmprestimos?.length || 0}`)

      if (todosEmprestimos && todosEmprestimos.length > 0) {
        // Criar mapa de buckets para lookup rápido
        const bucketsMap = buckets.reduce((acc, b) => ({ ...acc, [b.id]: b }), {} as Record<string, Bucket>)

        // Agrupar por loan_id e identificar credores/devedores
        const emprestimosPorLoan = new Map<string, EmprestimoConsolidado>()

        // Primeiro, agrupar todos os registros por loan_id
        const registrosPorLoan = new Map<string, Extrato[]>()
        todosEmprestimos.forEach((reg) => {
          if (!reg.loan_id) return
          if (!registrosPorLoan.has(reg.loan_id)) {
            registrosPorLoan.set(reg.loan_id, [])
          }
          registrosPorLoan.get(reg.loan_id)!.push(reg)
        })

        console.log(`📋 Empréstimos únicos (loan_ids): ${registrosPorLoan.size}`)

        // Processar cada grupo de loan_id
        registrosPorLoan.forEach((registros, loanId) => {
          // Encontrar o registro do credor (saída ou entrada redirecionada)
          const registroCredor = registros.find(
            (r) =>
              r.transacao === "saida_emprestimo" ||
              (r.transacao === "entrada" && r.conta_destino_id && r.conta_destino_id !== r.bucket_id),
          )

          if (registroCredor && registroCredor.conta_destino_id) {
            const bucketCredor = bucketsMap[registroCredor.bucket_id]
            const bucketDevedor = bucketsMap[registroCredor.conta_destino_id]

            if (bucketCredor && bucketDevedor) {
              const dataEmprestimo = new Date(registroCredor.data)
              const hoje = new Date()
              const diasCorridos = Math.max(
                0,
                Math.floor((hoje.getTime() - dataEmprestimo.getTime()) / (1000 * 60 * 60 * 24)),
              )

              // Taxa: usar custom se existir, senão usar do bucket credor
              const taxaMensal = registroCredor.taxa_emprestimo_custom ?? bucketCredor.taxaEmprestimo ?? 0
              const taxaAnual = taxaMensal / 100
              const taxaDiaria = Math.pow(1 + taxaAnual, 1 / 365) - 1
              const valorPrincipal = registroCredor.valor_brl ?? 0
              const jurosAcumulados = valorPrincipal * (Math.pow(1 + taxaDiaria, diasCorridos) - 1)

              const emprestimo: EmprestimoConsolidado = {
                id: registroCredor.id,
                loan_id: loanId,
                credor_id: registroCredor.bucket_id,
                credor_nome: bucketCredor.nome,
                devedor_id: registroCredor.conta_destino_id,
                devedor_nome: bucketDevedor.nome,
                data: registroCredor.data,
                valor_principal: valorPrincipal,
                dias_corridos: diasCorridos,
                juros_acumulados: jurosAcumulados,
                total_a_receber: valorPrincipal + jurosAcumulados,
                taxa_mensal: taxaMensal,
                tipo_origem:
                  registroCredor.transacao === "entrada" ? "rendimento_redirecionado" : "emprestimo_tradicional",
              }

              emprestimosPorLoan.set(loanId, emprestimo)

              console.log(`✅ Empréstimo processado:`, {
                loanId,
                credor: bucketCredor.nome,
                devedor: bucketDevedor.nome,
                valor: registroCredor.valor_brl,
                tipo: emprestimo.tipo_origem,
              })
            }
          }
        })

        const emprestimosFinais = Array.from(emprestimosPorLoan.values())
        console.log(`🎯 Total de empréstimos processados: ${emprestimosFinais.length}`)

        setEmprestimosAtivos(emprestimosFinais)
      } else {
        console.log("⚠️ Nenhum empréstimo ativo encontrado")
        setEmprestimosAtivos([])
      }
    } catch (err) {
      console.error("❌ Erro ao carregar empréstimos:", err)
      setEmprestimosAtivos([])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (buckets.length > 0) {
      carregarTodosEmprestimos()
      const interval = setInterval(carregarTodosEmprestimos, 60000)
      return () => clearInterval(interval)
    }
  }, [buckets])

  const { totalEmprestado, jurosAcumuladosTotal, totalAReceber } = useMemo(() => {
    const totalEmp = emprestimosAtivos.reduce((sum, emp) => sum + emp.valor_principal, 0)
    const jurosTotal = emprestimosAtivos.reduce((sum, emp) => sum + emp.juros_acumulados, 0)
    const receber = emprestimosAtivos.reduce((sum, emp) => sum + emp.total_a_receber, 0)

    return {
      totalEmprestado: totalEmp,
      jurosAcumuladosTotal: jurosTotal,
      totalAReceber: receber,
    }
  }, [emprestimosAtivos])

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-bold">Carregando dados de dívidas e empréstimos...</h1>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Painel de Dívidas e Empréstimos</h1>
          <p className="text-gray-400 mt-2">Visão consolidada de todas as suas obrigações e créditos.</p>
        </div>
        <Button onClick={carregarTodosEmprestimos} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />A Receber
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Total Emprestado:</span>
              <span className="font-mono font-semibold">{formatCurrency(totalEmprestado)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Juros Acumulados:</span>
              <span className="font-mono font-semibold text-orange-400">{formatCurrency(jurosAcumuladosTotal)}</span>
            </div>
            <div className="border-t border-white/10 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-green-400">Total a Receber:</span>
                <span className="text-2xl font-bold text-green-400">{formatCurrency(totalAReceber)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-red-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-400" />A Pagar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Total Dívidas:</span>
              <span className="font-mono font-semibold">{formatCurrency(totalAReceber)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Juros Acumulados:</span>
              <span className="font-mono font-semibold text-orange-400">{formatCurrency(jurosAcumuladosTotal)}</span>
            </div>
            <div className="border-t border-white/10 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-red-400">Total a Pagar:</span>
                <span className="text-2xl font-bold text-red-400">{formatCurrency(totalAReceber)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Empréstimos Concedidos (Ativos)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Devedor</TableHead>
                  <TableHead>Credor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Juros (Custo Oport.)</TableHead>
                  <TableHead className="text-right">Total a Receber</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emprestimosAtivos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-400">
                      Nenhum empréstimo ativo no momento
                    </TableCell>
                  </TableRow>
                ) : (
                  emprestimosAtivos.map((emp) => (
                    <TableRow key={emp.loan_id}>
                      <TableCell>
                        <BucketBadge bucketName={emp.devedor_nome} />
                      </TableCell>
                      <TableCell>
                        <BucketBadge bucketName={emp.credor_nome} />
                      </TableCell>
                      <TableCell>{new Date(emp.data).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(emp.valor_principal)}</TableCell>
                      <TableCell className="text-right font-mono text-orange-400">
                        {formatCurrency(emp.juros_acumulados)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-green-400">
                        {formatCurrency(emp.total_a_receber)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Dívidas Ativas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Credor</TableHead>
                  <TableHead>Devedor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Juros a Pagar</TableHead>
                  <TableHead className="text-right">Total a Pagar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emprestimosAtivos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-400">
                      Nenhuma dívida ativa no momento
                    </TableCell>
                  </TableRow>
                ) : (
                  emprestimosAtivos.map((emp) => (
                    <TableRow key={`divida-${emp.loan_id}`}>
                      <TableCell>
                        <BucketBadge bucketName={emp.credor_nome} />
                      </TableCell>
                      <TableCell>
                        <BucketBadge bucketName={emp.devedor_nome} />
                      </TableCell>
                      <TableCell>{new Date(emp.data).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(emp.valor_principal)}</TableCell>
                      <TableCell className="text-right font-mono text-orange-400">
                        {formatCurrency(emp.juros_acumulados)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-red-400">
                        {formatCurrency(emp.total_a_receber)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

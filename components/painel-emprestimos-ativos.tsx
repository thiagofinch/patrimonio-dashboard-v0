"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { TrendingUp, Calendar, DollarSign, AlertCircle, RefreshCw, Calculator, Target, Clock } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useBuckets } from "@/context/buckets-context"

// Função local para formatação de moeda
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

interface EmprestimoAtivo {
  id: string
  data: string
  descricao: string
  valor_brl: number
  loan_id: string
  taxa_emprestimo?: number
  conta_destino_id?: string
  conta_destino?: { nome: string }
  dias_ativo: number
  juros_acumulados: number
  valor_total: number
}

interface PainelEmprestimosAtivosProps {
  bucketId: string
}

export function PainelEmprestimosAtivos({ bucketId }: PainelEmprestimosAtivosProps) {
  const [emprestimosAtivos, setEmprestimosAtivos] = useState<EmprestimoAtivo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const { buckets, fetchInitialData } = useBuckets()

  const carregarEmprestimos = async () => {
    try {
      setCarregando(true)
      setErro(null)

      console.log("🔍 Carregando empréstimos ativos para bucket:", bucketId)

      // Buscar SEM join - apenas campos da tabela extratos
      const { data, error } = await supabase
        .from("extratos")
        .select("*") // Apenas os campos da tabela extratos
        .eq("conta_origem_id", bucketId)
        .not("loan_id", "is", null)
        .or("status_emprestimo.eq.ativo,status_emprestimo.is.null")
        .order("data", { ascending: false })

      if (error) {
        console.error("❌ Erro na query:", error)
        throw error
      }

      console.log("📊 Dados brutos dos empréstimos:", data)

      // Enriquecer com dados dos buckets LOCALMENTE
      const emprestimosComDestino = (data || []).map((emp) => {
        const bucketDestino = buckets.find((b) => b.id === emp.conta_destino_id)

        // Calcular dias ativos
        const dataEmprestimo = new Date(emp.data)
        const hoje = new Date()
        const diasAtivo = Math.floor((hoje.getTime() - dataEmprestimo.getTime()) / (1000 * 60 * 60 * 24))

        // Calcular juros (taxa diária composta)
        const taxaDiaria = (emp.taxa_emprestimo || 0) / 100 / 365
        const jurosAcumulados = emp.valor_brl * (Math.pow(1 + taxaDiaria, diasAtivo) - 1)
        const valorTotal = emp.valor_brl + jurosAcumulados

        return {
          ...emp,
          conta_destino: bucketDestino || { nome: "Desconhecido" },
          dias_ativo: diasAtivo,
          juros_acumulados: jurosAcumulados,
          valor_total: valorTotal,
        }
      })

      console.log("✅ Empréstimos enriquecidos:", emprestimosComDestino)
      setEmprestimosAtivos(emprestimosComDestino)
    } catch (error) {
      console.error("❌ Erro ao carregar empréstimos:", error)
      setErro("Erro ao carregar empréstimos")
      setEmprestimosAtivos([])
    } finally {
      setCarregando(false)
    }
  }

  const corrigirCalculoJuros = async () => {
    try {
      console.log("🔧 Iniciando correção de cálculo de juros...")

      for (const emprestimo of emprestimosAtivos) {
        if (!emprestimo.taxa_emprestimo) continue

        const dataEmprestimo = new Date(emprestimo.data)
        const hoje = new Date()
        const diasAtivo = Math.floor((hoje.getTime() - dataEmprestimo.getTime()) / (1000 * 60 * 60 * 24))

        // Fórmula correta: Juros Compostos Diários
        const taxaDiaria = emprestimo.taxa_emprestimo / 100 / 365
        const jurosCorretos = emprestimo.valor_brl * (Math.pow(1 + taxaDiaria, diasAtivo) - 1)

        console.log(`💰 Empréstimo ${emprestimo.loan_id}:`)
        console.log(`   Principal: ${formatCurrency(emprestimo.valor_brl)}`)
        console.log(`   Taxa: ${emprestimo.taxa_emprestimo}% a.a.`)
        console.log(`   Dias: ${diasAtivo}`)
        console.log(`   Juros corretos: ${formatCurrency(jurosCorretos)}`)

        // Atualizar no banco se necessário
        const { error } = await supabase
          .from("extratos")
          .update({
            juros_calculados: jurosCorretos,
            dias_emprestimo: diasAtivo,
            valor_total_emprestimo: emprestimo.valor_brl + jurosCorretos,
          })
          .eq("id", emprestimo.id)

        if (error) {
          console.error(`❌ Erro ao atualizar empréstimo ${emprestimo.loan_id}:`, error)
        }
      }

      toast({
        title: "✅ Cálculo de juros corrigido",
        description: `${emprestimosAtivos.length} empréstimos atualizados`,
      })

      await carregarEmprestimos()
    } catch (error) {
      console.error("❌ Erro na correção:", error)
      toast({
        title: "Erro na correção",
        description: (error as Error).message,
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (bucketId && buckets.length > 0) {
      carregarEmprestimos()
    }
  }, [bucketId, buckets])

  if (carregando) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Empréstimos Ativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-400">Carregando empréstimos...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (erro) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Empréstimos Ativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
          <Button onClick={carregarEmprestimos} variant="outline" className="mt-4 bg-transparent">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  const totalEmprestado = emprestimosAtivos.reduce((acc, emp) => acc + emp.valor_brl, 0)
  const totalJuros = emprestimosAtivos.reduce((acc, emp) => acc + emp.juros_acumulados, 0)
  const totalAReceber = totalEmprestado + totalJuros

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Empréstimos Ativos
            </CardTitle>
            <CardDescription>Valores emprestados por este bucket</CardDescription>
          </div>
          <Button onClick={corrigirCalculoJuros} variant="outline" size="sm" className="text-xs bg-transparent">
            <Calculator className="h-4 w-4 mr-1" />
            Corrigir Cálculo de Juros
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {emprestimosAtivos.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum empréstimo ativo encontrado</p>
            <p className="text-sm">Empréstimos aparecerão aqui quando você marcar transações como empréstimo</p>
          </div>
        ) : (
          <>
            {/* Resumo */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="text-center">
                <p className="text-sm text-gray-400">Total Emprestado</p>
                <p className="font-bold text-green-400">{formatCurrency(totalEmprestado)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Juros Acumulados</p>
                <p className="font-bold text-yellow-400">{formatCurrency(totalJuros)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Total a Receber</p>
                <p className="font-bold text-white">{formatCurrency(totalAReceber)}</p>
              </div>
            </div>

            <Separator />

            {/* Lista de Empréstimos */}
            <div className="space-y-3">
              {emprestimosAtivos.map((emprestimo) => (
                <div key={emprestimo.id} className="p-4 border rounded-lg hover:bg-gray-50/5 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{emprestimo.descricao}</h4>
                      <p className="text-sm text-gray-400">Para: {emprestimo.conta_destino?.nome}</p>
                    </div>
                    <Badge variant="outline" className="text-green-500 border-green-500">
                      Ativo
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-400">Principal:</span>
                      <span className="font-mono font-bold">{formatCurrency(emprestimo.valor_brl)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-yellow-400" />
                      <span className="text-gray-400">Juros:</span>
                      <span className="font-mono font-bold text-yellow-400">
                        {formatCurrency(emprestimo.juros_acumulados)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-400">Dias:</span>
                      <span className="font-mono">{emprestimo.dias_ativo}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-400">Taxa:</span>
                      <span className="font-mono">{emprestimo.taxa_emprestimo || 0}% a.a.</span>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Total a Receber:</span>
                    <span className="font-mono font-bold text-lg text-white">
                      {formatCurrency(emprestimo.valor_total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

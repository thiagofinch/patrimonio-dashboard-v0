"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import {
  TrendingDown,
  Calendar,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Calculator,
  AlertTriangle,
  Clock,
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useBuckets } from "@/context/buckets-context"

// Função local para formatação de moeda
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

interface DividaAtiva {
  id: string
  data: string
  descricao: string
  valor_brl: number
  loan_id: string
  taxa_emprestimo?: number
  conta_origem_id?: string
  conta_origem?: { nome: string }
  dias_ativo: number
  juros_acumulados: number
  valor_total: number
}

interface PainelDividasAtivasProps {
  bucketId: string
}

export function PainelDividasAtivas({ bucketId }: PainelDividasAtivasProps) {
  const [dividasAtivas, setDividasAtivas] = useState<DividaAtiva[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const { buckets, fetchInitialData } = useBuckets()

  const carregarDividas = async () => {
    try {
      setCarregando(true)
      setErro(null)

      console.log("🔍 Carregando dívidas ativas para bucket:", bucketId)

      // Buscar SEM join - apenas campos da tabela extratos
      const { data, error } = await supabase
        .from("extratos")
        .select("*") // Apenas os campos da tabela extratos
        .eq("conta_destino_id", bucketId)
        .not("loan_id", "is", null)
        .or("status_emprestimo.eq.ativo,status_emprestimo.is.null")
        .order("data", { ascending: false })

      if (error) {
        console.error("❌ Erro na query:", error)
        throw error
      }

      console.log("📊 Dados brutos das dívidas:", data)

      // Enriquecer com dados dos buckets LOCALMENTE
      const dividasComCredor = (data || []).map((divida) => {
        const bucketCredor = buckets.find((b) => b.id === divida.conta_origem_id)

        // Calcular dias ativos
        const dataDivida = new Date(divida.data)
        const hoje = new Date()
        const diasAtivo = Math.floor((hoje.getTime() - dataDivida.getTime()) / (1000 * 60 * 60 * 24))

        // Calcular juros (taxa diária composta)
        const taxaDiaria = (divida.taxa_emprestimo || 0) / 100 / 365
        const jurosAcumulados = divida.valor_brl * (Math.pow(1 + taxaDiaria, diasAtivo) - 1)
        const valorTotal = divida.valor_brl + jurosAcumulados

        return {
          ...divida,
          conta_origem: bucketCredor || { nome: "Desconhecido" },
          dias_ativo: diasAtivo,
          juros_acumulados: jurosAcumulados,
          valor_total: valorTotal,
        }
      })

      console.log("✅ Dívidas enriquecidas:", dividasComCredor)
      setDividasAtivas(dividasComCredor)
    } catch (error) {
      console.error("❌ Erro ao carregar dívidas:", error)
      setErro("Erro ao carregar dívidas")
      setDividasAtivas([])
    } finally {
      setCarregando(false)
    }
  }

  const corrigirCalculoJuros = async () => {
    try {
      console.log("🔧 Iniciando correção de cálculo de juros das dívidas...")

      for (const divida of dividasAtivas) {
        if (!divida.taxa_emprestimo) continue

        const dataDivida = new Date(divida.data)
        const hoje = new Date()
        const diasAtivo = Math.floor((hoje.getTime() - dataDivida.getTime()) / (1000 * 60 * 60 * 24))

        // Fórmula correta: Juros Compostos Diários
        const taxaDiaria = divida.taxa_emprestimo / 100 / 365
        const jurosCorretos = divida.valor_brl * (Math.pow(1 + taxaDiaria, diasAtivo) - 1)

        console.log(`💰 Dívida ${divida.loan_id}:`)
        console.log(`   Principal: ${formatCurrency(divida.valor_brl)}`)
        console.log(`   Taxa: ${divida.taxa_emprestimo}% a.a.`)
        console.log(`   Dias: ${diasAtivo}`)
        console.log(`   Juros corretos: ${formatCurrency(jurosCorretos)}`)

        // Atualizar no banco se necessário
        const { error } = await supabase
          .from("extratos")
          .update({
            juros_calculados: jurosCorretos,
            dias_emprestimo: diasAtivo,
            valor_total_emprestimo: divida.valor_brl + jurosCorretos,
          })
          .eq("id", divida.id)

        if (error) {
          console.error(`❌ Erro ao atualizar dívida ${divida.loan_id}:`, error)
        }
      }

      toast({
        title: "✅ Cálculo de juros corrigido",
        description: `${dividasAtivas.length} dívidas atualizadas`,
      })

      await carregarDividas()
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
      carregarDividas()
    }
  }, [bucketId, buckets])

  if (carregando) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            Dívidas Ativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-400">Carregando dívidas...</span>
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
            <TrendingDown className="h-5 w-5 text-red-500" />
            Dívidas Ativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
          <Button onClick={carregarDividas} variant="outline" className="mt-4 bg-transparent">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  const totalDevido = dividasAtivas.reduce((acc, div) => acc + div.valor_brl, 0)
  const totalJuros = dividasAtivas.reduce((acc, div) => acc + div.juros_acumulados, 0)
  const totalAPagar = totalDevido + totalJuros

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Dívidas Ativas
            </CardTitle>
            <CardDescription>Valores devidos por este bucket</CardDescription>
          </div>
          <Button onClick={corrigirCalculoJuros} variant="outline" size="sm" className="text-xs bg-transparent">
            <Calculator className="h-4 w-4 mr-1" />
            Corrigir Cálculo de Juros
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {dividasAtivas.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma dívida ativa encontrada</p>
            <p className="text-sm">Dívidas aparecerão aqui quando outros buckets emprestarem para este</p>
          </div>
        ) : (
          <>
            {/* Resumo */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <div className="text-center">
                <p className="text-sm text-gray-400">Total Devido</p>
                <p className="font-bold text-red-400">{formatCurrency(totalDevido)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Juros Acumulados</p>
                <p className="font-bold text-yellow-400">{formatCurrency(totalJuros)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Total a Pagar</p>
                <p className="font-bold text-white">{formatCurrency(totalAPagar)}</p>
              </div>
            </div>

            <Separator />

            {/* Lista de Dívidas */}
            <div className="space-y-3">
              {dividasAtivas.map((divida) => (
                <div key={divida.id} className="p-4 border rounded-lg hover:bg-gray-50/5 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{divida.descricao}</h4>
                      <p className="text-sm text-gray-400">Devendo para: {divida.conta_origem?.nome}</p>
                    </div>
                    <Badge variant="outline" className="text-red-500 border-red-500">
                      Ativa
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-400">Principal:</span>
                      <span className="font-mono font-bold">{formatCurrency(divida.valor_brl)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-yellow-400" />
                      <span className="text-gray-400">Juros:</span>
                      <span className="font-mono font-bold text-yellow-400">
                        {formatCurrency(divida.juros_acumulados)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-400">Dias:</span>
                      <span className="font-mono">{divida.dias_ativo}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-400">Taxa:</span>
                      <span className="font-mono">{divida.taxa_emprestimo || 0}% a.a.</span>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Total a Pagar:</span>
                    <span className="font-mono font-bold text-lg text-white">{formatCurrency(divida.valor_total)}</span>
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

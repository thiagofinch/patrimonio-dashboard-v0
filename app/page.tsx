"use client"

import { useBuckets } from "@/context/buckets-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/utils"
import { AlertTriangle, TrendingUp, DollarSign, Wallet, Activity, Plus, Bug, Wrench } from "lucide-react"
import { AlocacaoBucketChart } from "@/components/alocacao-bucket-chart"
import { EvolucaoPatrimonialChart } from "@/components/evolucao-patrimonial-chart"
import { FluxoCaixaProjetado } from "@/components/fluxo-caixa-projetado"
import { AnaliseRisco } from "@/components/analise-risco"
import { MetasObjetivos } from "@/components/metas-objetivos"
import { PainelEmprestimosAtivos } from "@/components/painel-emprestimos-ativos"
import { PainelDividasAtivas } from "@/components/painel-dividas-ativas"
import { RendimentoPerformanceCard } from "@/components/rendimento-performance-card"
import { AlertsPanel } from "@/components/alerts-panel"
import { useState } from "react"

export default function Dashboard() {
  const {
    buckets,
    loading,
    error,
    totalPatrimonioBRL,
    totalPatrimonioUSD,
    rendimentoMensal,
    liquidezImediata,
    bucketsAtivos,
    exchangeRate,
    setIsGlobalModalOpen,
    descobrirEstruturaBuckets,
    corrigirSaldoRendimentoRedirecionado,
  } = useBuckets()

  const [debugLoading, setDebugLoading] = useState(false)
  const [correcaoLoading, setCorrecaoLoading] = useState(false)

  const handleDebugClick = async () => {
    setDebugLoading(true)
    try {
      await descobrirEstruturaBuckets()
      console.log("🔍 Debug executado! Verifique o console para detalhes.")
    } catch (error) {
      console.error("❌ Erro no debug:", error)
    } finally {
      setDebugLoading(false)
    }
  }

  const handleCorrecaoClick = async () => {
    setCorrecaoLoading(true)
    try {
      await corrigirSaldoRendimentoRedirecionado()
      console.log("🔧 Correção executada! Verifique o console para detalhes.")
    } catch (error) {
      console.error("❌ Erro na correção:", error)
    } finally {
      setCorrecaoLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Carregando dados financeiros...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Erro de Conexão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Encontrar o bucket Ticto para o card de performance
  const bucketTicto = buckets.find(
    (bucket) => bucket.nome.toLowerCase().includes("aplicação") && bucket.nome.toLowerCase().includes("ticto"),
  )

  return (
    <div className="space-y-6">
      {/* Header com Métricas Principais */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">Visão geral do seu patrimônio e investimentos</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleDebugClick}
            disabled={debugLoading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-transparent"
          >
            <Bug className="h-4 w-4" />
            {debugLoading ? "Executando..." : "🔍 Debug Estrutura"}
          </Button>
          <Button
            onClick={handleCorrecaoClick}
            disabled={correcaoLoading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-transparent"
          >
            <Wrench className="h-4 w-4" />
            {correcaoLoading ? "Corrigindo..." : "🔧 Corrigir Saldo Neutro"}
          </Button>
          <Button onClick={() => setIsGlobalModalOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patrimônio Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPatrimonioBRL)}</div>
            <p className="text-xs text-muted-foreground">≈ ${totalPatrimonioUSD.toLocaleString("en-US")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rendimento Mensal</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(rendimentoMensal)}</div>
            <p className="text-xs text-muted-foreground">
              {totalPatrimonioBRL > 0 ? `${((rendimentoMensal / totalPatrimonioBRL) * 100).toFixed(2)}%` : "0%"} do
              patrimônio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Liquidez Imediata</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(liquidezImediata)}</div>
            <p className="text-xs text-muted-foreground">
              {totalPatrimonioBRL > 0 ? `${((liquidezImediata / totalPatrimonioBRL) * 100).toFixed(1)}%` : "0%"} do
              total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Buckets Ativos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bucketsAtivos}</div>
            <p className="text-xs text-muted-foreground">de {buckets.length} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Câmbio</CardTitle>
            <Badge variant="outline">USD/BRL</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {exchangeRate.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Por dólar americano</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      <AlertsPanel />

      {/* Performance do Rendimento - Ticto */}
      {bucketTicto && (
        <RendimentoPerformanceCard
          bucket={bucketTicto}
          title="Performance - Aplicação Ticto"
          description="Acompanhe o desempenho do seu principal investimento"
        />
      )}

      {/* Gráficos Principais */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Alocação por Bucket</CardTitle>
            <CardDescription>Distribuição do patrimônio entre os buckets</CardDescription>
          </CardHeader>
          <CardContent>
            <AlocacaoBucketChart buckets={buckets} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evolução Patrimonial</CardTitle>
            <CardDescription>Crescimento do patrimônio ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <EvolucaoPatrimonialChart buckets={buckets} />
          </CardContent>
        </Card>
      </div>

      {/* Painéis de Empréstimos e Dívidas */}
      <div className="grid gap-6 md:grid-cols-2">
        <PainelEmprestimosAtivos />
        <PainelDividasAtivas />
      </div>

      <Separator />

      {/* Análises Avançadas */}
      <div className="grid gap-6 md:grid-cols-3">
        <FluxoCaixaProjetado />
        <AnaliseRisco />
        <MetasObjetivos />
      </div>
    </div>
  )
}

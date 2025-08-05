"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils"
import { TrendingUp, TrendingDown, AlertCircle, Bug } from "lucide-react"
import { useMemo, useState } from "react"
import type { RendimentoPerformanceCardProps } from "./rendimento-performance-card-props"

export function RendimentoPerformanceCard({ bucket, title, description }: RendimentoPerformanceCardProps) {
  const [showDebug, setShowDebug] = useState(false)

  // Validação robusta dos dados
  const validatedData = useMemo(() => {
    // Verificar se o bucket existe
    if (!bucket) {
      return {
        isValid: false,
        error: "Bucket não encontrado",
        debug: { bucket: null },
      }
    }

    // Verificar se tem dados básicos
    if (!bucket.id || !bucket.nome) {
      return {
        isValid: false,
        error: "Dados do bucket incompletos",
        debug: { bucket: { id: bucket.id, nome: bucket.nome } },
      }
    }

    // Valores com fallback
    const capitalInicial = bucket.capitalInicialBRL || 0
    const saldoAtual = bucket.saldoAtual || 0
    const taxaRendimento = bucket.taxaRendimento || 0

    // Calcular rendimentos do mês atual
    const hoje = new Date()
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

    const rendimentosMes =
      bucket.extratos
        ?.filter(
          (extrato) =>
            extrato.isRendimento &&
            extrato.transacao === "entrada" &&
            extrato.status === "Confirmado" &&
            new Date(extrato.data) >= primeiroDiaMes,
        )
        ?.reduce((acc, extrato) => acc + (extrato.valorBRL || 0), 0) || 0

    // Calcular rendimentos totais
    const rendimentosTotal =
      bucket.extratos
        ?.filter(
          (extrato) => extrato.isRendimento && extrato.transacao === "entrada" && extrato.status === "Confirmado",
        )
        ?.reduce((acc, extrato) => acc + (extrato.valorBRL || 0), 0) || 0

    // Calcular métricas
    const ganhoTotal = saldoAtual - capitalInicial
    const percentualGanho = capitalInicial > 0 ? (ganhoTotal / capitalInicial) * 100 : 0
    const rendimentoMensalEsperado = capitalInicial * (taxaRendimento / 100)
    const progressoMeta = rendimentoMensalEsperado > 0 ? (rendimentosMes / rendimentoMensalEsperado) * 100 : 0

    return {
      isValid: true,
      capitalInicial,
      saldoAtual,
      taxaRendimento,
      rendimentosMes,
      rendimentosTotal,
      ganhoTotal,
      percentualGanho,
      rendimentoMensalEsperado,
      progressoMeta: Math.min(progressoMeta, 100),
      debug: {
        bucket: {
          id: bucket.id,
          nome: bucket.nome,
          capitalInicialBRL: bucket.capitalInicialBRL,
          saldoAtual: bucket.saldoAtual,
          taxaRendimento: bucket.taxaRendimento,
          extratosCount: bucket.extratos?.length || 0,
        },
        calculos: {
          capitalInicial,
          saldoAtual,
          ganhoTotal,
          percentualGanho,
          rendimentosMes,
          rendimentosTotal,
          rendimentoMensalEsperado,
          progressoMeta,
        },
      },
    }
  }, [bucket])

  // Se dados inválidos, mostrar erro
  if (!validatedData.isValid) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            {title || "Performance de Rendimento"}
          </CardTitle>
          <CardDescription>{description || "Dados não disponíveis"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">{validatedData.error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDebug(!showDebug)}
              className="flex items-center gap-2"
            >
              <Bug className="h-4 w-4" />
              {showDebug ? "Ocultar Debug" : "Mostrar Debug"}
            </Button>
            {showDebug && (
              <pre className="mt-4 text-xs bg-muted p-4 rounded text-left overflow-auto">
                {JSON.stringify(validatedData.debug, null, 2)}
              </pre>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const {
    capitalInicial,
    saldoAtual,
    taxaRendimento,
    rendimentosMes,
    rendimentosTotal,
    ganhoTotal,
    percentualGanho,
    rendimentoMensalEsperado,
    progressoMeta,
  } = validatedData

  const isPositive = ganhoTotal >= 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isPositive ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
              {title || "Performance de Rendimento"}
            </CardTitle>
            <CardDescription>{description || "Acompanhe o desempenho do investimento"}</CardDescription>
          </div>
          <Badge variant={isPositive ? "default" : "destructive"}>
            {isPositive ? "+" : ""}
            {percentualGanho.toFixed(2)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Valores Principais */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Capital Inicial</p>
            <p className="text-2xl font-bold">{formatCurrency(capitalInicial)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Saldo Atual</p>
            <p className="text-2xl font-bold">{formatCurrency(saldoAtual)}</p>
          </div>
        </div>

        {/* Ganho/Perda */}
        <div className="p-4 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Ganho Total</span>
            <span className={`text-lg font-bold ${isPositive ? "text-green-600" : "text-red-600"}`}>
              {isPositive ? "+" : ""}
              {formatCurrency(ganhoTotal)}
            </span>
          </div>
        </div>

        {/* Rendimento Mensal */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Rendimento Este Mês</span>
            <span className="text-sm text-muted-foreground">
              {taxaRendimento > 0 ? `Meta: ${taxaRendimento}%` : "Taxa não configurada"}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">{formatCurrency(rendimentosMes)}</span>
              {rendimentoMensalEsperado > 0 && (
                <span className="text-sm text-muted-foreground">de {formatCurrency(rendimentoMensalEsperado)}</span>
              )}
            </div>
            {rendimentoMensalEsperado > 0 && <Progress value={progressoMeta} className="h-2" />}
          </div>
        </div>

        {/* Rendimento Total */}
        <div className="flex items-center justify-between pt-4 border-t">
          <span className="text-sm text-muted-foreground">Rendimento Acumulado</span>
          <span className="font-semibold text-green-600">{formatCurrency(rendimentosTotal)}</span>
        </div>

        {/* Debug Button */}
        <div className="pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDebug(!showDebug)}
            className="w-full flex items-center gap-2"
          >
            <Bug className="h-4 w-4" />
            {showDebug ? "Ocultar Debug" : "Debug Dados"}
          </Button>
          {showDebug && (
            <pre className="mt-4 text-xs bg-muted p-4 rounded overflow-auto max-h-64">
              {JSON.stringify(validatedData.debug, null, 2)}
            </pre>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

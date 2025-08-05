"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react"
import { useBuckets } from "@/context/buckets-context"
import { useMemo } from "react"

interface AlertItem {
  id: string
  type: "error" | "warning" | "info" | "success"
  title: string
  description: string
  icon: React.ReactNode
}

export function AlertsPanel() {
  const { buckets, totalPatrimonioBRL, liquidezImediata } = useBuckets()

  const alerts = useMemo(() => {
    const alertList: AlertItem[] = []

    // Verificar buckets com saldo negativo
    const bucketsNegativos = buckets.filter((bucket) => (bucket.saldoAtual || 0) < 0)
    if (bucketsNegativos.length > 0) {
      alertList.push({
        id: "saldo-negativo",
        type: "error",
        title: "Saldos Negativos Detectados",
        description: `${bucketsNegativos.length} bucket(s) com saldo negativo: ${bucketsNegativos.map((b) => b.nome).join(", ")}`,
        icon: <XCircle className="h-4 w-4" />,
      })
    }

    // Verificar liquidez baixa
    const percentualLiquidez = totalPatrimonioBRL > 0 ? (liquidezImediata / totalPatrimonioBRL) * 100 : 0
    if (percentualLiquidez < 10) {
      alertList.push({
        id: "liquidez-baixa",
        type: "warning",
        title: "Liquidez Baixa",
        description: `Apenas ${percentualLiquidez.toFixed(1)}% do patrimônio está em alta liquidez. Recomenda-se manter pelo menos 10%.`,
        icon: <AlertTriangle className="h-4 w-4" />,
      })
    }

    // Verificar buckets inativos
    const bucketsInativos = buckets.filter((bucket) => bucket.isActive === false)
    if (bucketsInativos.length > 0) {
      alertList.push({
        id: "buckets-inativos",
        type: "info",
        title: "Buckets Inativos",
        description: `${bucketsInativos.length} bucket(s) estão inativos: ${bucketsInativos.map((b) => b.nome).join(", ")}`,
        icon: <Info className="h-4 w-4" />,
      })
    }

    // Verificar empréstimos ativos
    const emprestimosAtivos = buckets.flatMap((bucket) =>
      bucket.extratos.filter(
        (extrato) => extrato.loanId && extrato.statusEmprestimo === "ativo" && extrato.transacao === "saida_emprestimo",
      ),
    )
    if (emprestimosAtivos.length > 0) {
      alertList.push({
        id: "emprestimos-ativos",
        type: "info",
        title: "Empréstimos Ativos",
        description: `Você possui ${emprestimosAtivos.length} empréstimo(s) ativo(s). Monitore os prazos de pagamento.`,
        icon: <Info className="h-4 w-4" />,
      })
    }

    // Se não há alertas, mostrar mensagem positiva
    if (alertList.length === 0) {
      alertList.push({
        id: "tudo-ok",
        type: "success",
        title: "Tudo em Ordem",
        description: "Não há alertas no momento. Seu portfólio está funcionando bem!",
        icon: <CheckCircle className="h-4 w-4" />,
      })
    }

    return alertList
  }, [buckets, totalPatrimonioBRL, liquidezImediata])

  const getAlertVariant = (type: AlertItem["type"]) => {
    switch (type) {
      case "error":
        return "destructive"
      case "warning":
        return "default"
      case "info":
        return "default"
      case "success":
        return "default"
      default:
        return "default"
    }
  }

  const getBadgeVariant = (type: AlertItem["type"]) => {
    switch (type) {
      case "error":
        return "destructive"
      case "warning":
        return "secondary"
      case "info":
        return "outline"
      case "success":
        return "default"
      default:
        return "outline"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Alertas e Notificações
        </CardTitle>
        <CardDescription>Monitore situações importantes do seu portfólio</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Alert key={alert.id} variant={getAlertVariant(alert.type)}>
              <div className="flex items-start gap-3">
                {alert.icon}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{alert.title}</span>
                    <Badge variant={getBadgeVariant(alert.type)} className="text-xs">
                      {alert.type.toUpperCase()}
                    </Badge>
                  </div>
                  <AlertDescription className="text-sm">{alert.description}</AlertDescription>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

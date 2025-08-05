"use client"

import { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useBuckets } from "@/context/buckets-context"

const formatCurrencyAxis = (value: number) => {
  if (Math.abs(value) >= 1_000_000) {
    return `R$${(value / 1_000_000).toFixed(0)}M`
  }
  if (Math.abs(value) >= 1_000) {
    return `R$${(value / 1_000).toFixed(0)}K`
  }
  return `R$${value.toFixed(0)}`
}

export function EvolucaoPatrimonialChart() {
  const { buckets } = useBuckets()

  const data = useMemo(() => {
    const historico: { [key: string]: number } = {}
    const hoje = new Date()

    const meses = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - (11 - i), 1)
      return {
        key: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "").replace(" de", ""),
        date: d,
      }
    })

    const saldoInicialTotal = buckets.reduce((acc, bucket) => acc + (bucket.capitalInicialBRL || 0), 0)

    meses.forEach((mes) => {
      let saldoMes = saldoInicialTotal
      buckets.forEach((bucket) => {
        bucket.extratos.forEach((extrato) => {
          if (
            extrato.status === "Confirmado" &&
            new Date(extrato.data) <= new Date(mes.date.getFullYear(), mes.date.getMonth() + 1, 0)
          ) {
            saldoMes += extrato.transacao === "entrada" ? extrato.valorBRL : -extrato.valorBRL
          }
        })
      })
      historico[mes.key] = saldoMes
    })

    // Recalculate initial capital based on the start of the 12-month period
    const dataInicioPeriodo = meses[0].date
    let capitalNoInicioPeriodo = 0
    buckets.forEach((bucket) => {
      capitalNoInicioPeriodo += bucket.capitalInicialBRL
      bucket.extratos.forEach((extrato) => {
        if (new Date(extrato.data) < dataInicioPeriodo && extrato.status === "Confirmado") {
          capitalNoInicioPeriodo += extrato.transacao === "entrada" ? extrato.valorBRL : -extrato.valorBRL
        }
      })
    })

    let saldoCorrente = capitalNoInicioPeriodo
    return meses.map((mes) => {
      buckets.forEach((bucket) => {
        bucket.extratos.forEach((extrato) => {
          const dataExtrato = new Date(extrato.data)
          if (
            dataExtrato.getFullYear() === mes.date.getFullYear() &&
            dataExtrato.getMonth() === mes.date.getMonth() &&
            extrato.status === "Confirmado"
          ) {
            saldoCorrente += extrato.transacao === "entrada" ? extrato.valorBRL : -extrato.valorBRL
          }
        })
      })
      return { name: mes.key, valor: saldoCorrente }
    })
  }, [buckets])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-md shadow-lg text-white">
          <p className="font-bold">{label}</p>
          <p className="text-sm text-purple-400">{`Patrimônio: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(payload[0].value)}`}</p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="glass h-full">
      <CardHeader>
        <CardTitle>Evolução Patrimonial</CardTitle>
        <CardDescription>Últimos 12 meses</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="name" stroke="rgba(255, 255, 255, 0.5)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                stroke="rgba(255, 255, 255, 0.5)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCurrencyAxis}
                domain={["dataMin - 1000000", "dataMax + 1000000"]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="valor" stroke="#a78bfa" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

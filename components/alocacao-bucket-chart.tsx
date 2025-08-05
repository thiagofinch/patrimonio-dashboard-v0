"use client"

import { useMemo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useBuckets } from "@/context/buckets-context"

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function AlocacaoBucketChart() {
  const { buckets } = useBuckets()

  const data = useMemo(() => {
    return buckets
      .map((bucket) => {
        const saldo = bucket.extratos.reduce((sum, e) => {
          if (e.status === "Confirmado") {
            return sum + (e.transacao === "entrada" ? e.valorBRL : -e.valorBRL)
          }
          return sum
        }, bucket.capitalInicialBRL || 0)

        return {
          name: bucket.nome,
          value: Math.max(0, saldo),
          fill: bucket.metadata.color || "#8884d8",
        }
      })
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [buckets])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const percent = (payload[0].percent * 100).toFixed(2)
      return (
        <div className="p-2 bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-md shadow-lg text-white">
          <p className="font-bold">{`${payload[0].name}`}</p>
          <p className="text-sm">{`${formatCurrency(payload[0].value)} (${percent}%)`}</p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="glass h-full">
      <CardHeader>
        <CardTitle>Alocação por Bucket</CardTitle>
        <CardDescription>Distribuição do patrimônio</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ width: "100%", height: 300 }}>
          {data.length > 0 ? (
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} labelLine={false}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-white/60">
              <p>R$ NaN</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

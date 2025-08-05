"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, BarChart3, Download } from "lucide-react"
import { format } from "date-fns"
import { formatCurrency } from "@/lib/utils"
import type { Bucket } from "@/types/patrimonio"

interface PerformanceRendimentosProps {
  bucket: Bucket
}

export default function PerformanceRendimentos({ bucket }: PerformanceRendimentosProps) {
  const [mesAnoSelecionado, setMesAnoSelecionado] = useState(format(new Date(), "yyyy-MM"))

  // Extrair ano e mês selecionados
  const [anoSelecionado, mesSelecionado] = mesAnoSelecionado.split("-")

  // Filtrar rendimentos do mês
  const rendimentosMes = useMemo(() => {
    if (!bucket?.extratos) return []

    return bucket.extratos
      .filter((e) => {
        const dataExtrato = new Date(e.data)
        return (
          e.transacao === "entrada" &&
          e.isRendimento === true &&
          e.status === "Confirmado" &&
          dataExtrato.getFullYear() === Number.parseInt(anoSelecionado) &&
          dataExtrato.getMonth() === Number.parseInt(mesSelecionado) - 1
        )
      })
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
  }, [bucket?.extratos, anoSelecionado, mesSelecionado])

  // Calcular valores
  const totalRealizado = rendimentosMes.reduce((acc, r) => acc + r.valorBRL, 0)
  const diasNoMes = new Date(Number.parseInt(anoSelecionado), Number.parseInt(mesSelecionado), 0).getDate()
  const hoje = new Date()
  const mesAtual =
    hoje.getMonth() === Number.parseInt(mesSelecionado) - 1 && hoje.getFullYear() === Number.parseInt(anoSelecionado)
  const diasPassados = mesAtual ? hoje.getDate() : diasNoMes
  const rendimentoDiario = diasPassados > 0 ? totalRealizado / diasPassados : 0

  // Calcular esperado baseado na taxa configurada
  const capitalMedio = bucket?.saldoAtual || 0
  const taxaMensal = bucket?.taxaRendimento || 0
  const totalEsperado = (capitalMedio * taxaMensal) / 100
  const variacao = totalEsperado > 0 ? ((totalRealizado - totalEsperado) / totalEsperado) * 100 : 0

  const formatarValorCompacto = (valor: number): string => {
    if (valor >= 1000000000) {
      return `R$ ${(valor / 1000000000).toFixed(2)}B`
    } else if (valor >= 1000000) {
      return `R$ ${(valor / 1000000).toFixed(2)}M`
    } else if (valor >= 1000) {
      return `R$ ${(valor / 1000).toFixed(1)}K`
    }
    return formatCurrency(valor)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Performance de Rendimentos</CardTitle>

          {/* SELETOR SIMPLES DE MÊS/ANO */}
          <div className="flex items-center gap-2">
            {/* Seletor de Ano */}
            <select
              value={anoSelecionado}
              onChange={(e) => setMesAnoSelecionado(`${e.target.value}-${mesSelecionado}`)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[2025, 2024, 2023].map((ano) => (
                <option key={ano} value={ano.toString()}>
                  {ano}
                </option>
              ))}
            </select>

            {/* Seletor de Mês */}
            <select
              value={mesSelecionado}
              onChange={(e) => setMesAnoSelecionado(`${anoSelecionado}-${e.target.value}`)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[
                { value: "1", label: "Janeiro" },
                { value: "2", label: "Fevereiro" },
                { value: "3", label: "Março" },
                { value: "4", label: "Abril" },
                { value: "5", label: "Maio" },
                { value: "6", label: "Junho" },
                { value: "7", label: "Julho" },
                { value: "8", label: "Agosto" },
                { value: "9", label: "Setembro" },
                { value: "10", label: "Outubro" },
                { value: "11", label: "Novembro" },
                { value: "12", label: "Dezembro" },
              ].map((mes) => (
                <option key={mes.value} value={mes.value}>
                  {mes.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Cards de métricas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-400">Esperado</p>
            <p className="text-2xl font-bold">{formatCurrency(totalEsperado)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Realizado</p>
            <p className="text-2xl font-bold text-green-500">{formatCurrency(totalRealizado)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Variação</p>
            <p className={`text-2xl font-bold ${variacao >= 0 ? "text-green-500" : "text-red-500"}`}>
              {variacao >= 0 ? "+" : ""}
              {variacao.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Barra de progresso visual */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Progresso do mês</span>
            <span>{Math.min((totalRealizado / totalEsperado) * 100, 100).toFixed(1)}%</span>
          </div>
          <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500"
              style={{
                width: `${Math.min((totalRealizado / totalEsperado) * 100, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Métricas adicionais */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
          <div className="bg-gray-900/50 rounded-lg p-4">
            <p className="text-sm text-gray-400">Taxa Efetiva do Mês</p>
            <p className="text-xl font-bold text-green-500">
              {capitalMedio > 0 ? ((totalRealizado / capitalMedio) * 100).toFixed(2) : "0.00"}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Sobre capital médio de {formatCurrency(capitalMedio)}</p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4">
            <p className="text-sm text-gray-400">Rendimento Médio/Dia</p>
            <p className="text-xl font-bold text-blue-400">{formatCurrency(rendimentoDiario)}</p>
            <p className="text-xs text-gray-500 mt-1">
              Em {diasPassados} de {diasNoMes} dias
            </p>
          </div>
        </div>

        {/* Lista de transações do mês */}
        {rendimentosMes.length > 0 ? (
          <div className="pt-4 border-t border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">
                Rendimentos de{" "}
                {
                  [
                    "Janeiro",
                    "Fevereiro",
                    "Março",
                    "Abril",
                    "Maio",
                    "Junho",
                    "Julho",
                    "Agosto",
                    "Setembro",
                    "Outubro",
                    "Novembro",
                    "Dezembro",
                  ][Number.parseInt(mesSelecionado) - 1]
                }{" "}
                {anoSelecionado}
              </h4>
              <span className="text-xs text-gray-400">{rendimentosMes.length} transações</span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {rendimentosMes.map((r) => (
                <div
                  key={r.id}
                  className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{r.descricao}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(r.data), "dd/MM/yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-green-500 font-semibold">+{formatCurrency(r.valorBRL)}</p>
                    <p className="text-xs text-gray-400">
                      {totalRealizado > 0 ? ((r.valorBRL / totalRealizado) * 100).toFixed(1) : "0.0"}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="pt-4 border-t border-gray-800">
            <div className="text-center py-8 text-gray-400">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                Nenhum rendimento encontrado em{" "}
                {
                  [
                    "Janeiro",
                    "Fevereiro",
                    "Março",
                    "Abril",
                    "Maio",
                    "Junho",
                    "Julho",
                    "Agosto",
                    "Setembro",
                    "Outubro",
                    "Novembro",
                    "Dezembro",
                  ][Number.parseInt(mesSelecionado) - 1]
                }{" "}
                de {anoSelecionado}
              </p>
              <p className="text-sm mt-2">Selecione outro mês para ver os dados</p>
            </div>
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex justify-center gap-2 pt-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setMesAnoSelecionado(format(new Date(), "yyyy-MM"))}
          >
            <Calendar className="h-4 w-4" />
            Mês Atual
          </Button>
          <Button variant="ghost" size="sm" className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Exportar Mês
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

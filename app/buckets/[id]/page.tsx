"use client"

import type React from "react"
import { useEffect, useState, useMemo, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useBuckets } from "@/context/buckets-context"
import type { Bucket, Extrato } from "@/types/patrimonio"
import { BucketMetricsCard } from "@/components/bucket-metrics-card"
import ExtratoDetalhado from "@/components/extrato-detalhado"
import { TransacaoForm } from "@/components/transacao-form"
import { PainelEmprestimosAtivos } from "@/components/painel-emprestimos-ativos"
import { PainelDividasAtivas } from "@/components/painel-dividas-ativas"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Calendar, Check, Pencil, X, CheckCircle, BarChart3, Download } from "lucide-react"
import { ModalAgendamentos } from "@/components/modal-agendamentos"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BucketActiveToggle } from "@/components/bucket-active-toggle"
import { toast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format, parse, isValid } from "date-fns"
import { ptBR } from "date-fns/locale"
import ZonaPerigo from "@/components/zona-perigo"
import { Info } from "lucide-react" // Import Info icon

// COMPONENTE DE DATA MELHORADO
const CampoDataMelhorado = ({
  value,
  onChange,
}: {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
}) => {
  const [inputValue, setInputValue] = useState(value ? format(value, "dd/MM/yyyy") : "")
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setInputValue(value ? format(value, "dd/MM/yyyy") : "")
  }, [value])

  // Máscara de data DD/MM/AAAA
  const aplicarMascara = (valor: string) => {
    // Remove tudo que não é número
    let numeros = valor.replace(/\D/g, "")

    // Limita a 8 dígitos
    numeros = numeros.substring(0, 8)

    // Aplica a máscara
    if (numeros.length >= 3) {
      numeros = numeros.substring(0, 2) + "/" + numeros.substring(2)
    }
    if (numeros.length >= 6) {
      numeros = numeros.substring(0, 5) + "/" + numeros.substring(5)
    }

    return numeros
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorMascarado = aplicarMascara(e.target.value)
    setInputValue(valorMascarado)

    // Se tiver 10 caracteres (DD/MM/AAAA), tenta parsear
    if (valorMascarado.length === 10) {
      try {
        const data = parse(valorMascarado, "dd/MM/yyyy", new Date())
        if (isValid(data)) {
          onChange(data)
        } else {
          onChange(undefined)
        }
      } catch (error) {
        onChange(undefined)
      }
    } else {
      onChange(undefined)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Permite navegação e deleção
    const permitidos = ["Backspace", "Delete", "Tab", "Escape", "Enter", "ArrowLeft", "ArrowRight"]
    if (permitidos.includes(e.key)) return

    // Permite apenas números
    if (!/[0-9]/.test(e.key)) {
      e.preventDefault()
    }
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Input
          type="text"
          placeholder="dd/mm/aaaa"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="pr-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">📅</div>
      </div>

      {/* Botão opcional para abrir calendário */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon">
            <Calendar className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <CalendarComponent
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange(date)
              setInputValue(date ? format(date, "dd/MM/yyyy") : "")
              setOpen(false)
            }}
            locale={ptBR}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

// FUNÇÃO AUXILIAR PARA PREPARAR DADOS DO GRÁFICO
function prepararDadosGrafico(rendimentos: any[]) {
  // Agrupar por mês
  const porMes = rendimentos.reduce(
    (acc, r) => {
      const mes = format(new Date(r.data), "MMM/yyyy", { locale: ptBR })
      if (!acc[mes]) acc[mes] = 0
      acc[mes] += r.valor_brl
      return acc
    },
    {} as Record<string, number>,
  )

  return Object.entries(porMes)
    .map(([mes, valor]) => ({
      mes,
      valor,
    }))
    .reverse()
}

// COMPONENTE DE PERFORMANCE DE RENDIMENTOS SIMPLIFICADO
const PerformanceRendimentos = ({ bucket }: { bucket: Bucket }) => {
  const [mesAnoSelecionado, setMesAnoSelecionado] = useState(format(new Date(), "yyyy-MM"))
  const { buckets } = useBuckets()

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

// Componente CurrencyInputCustom inline
function CurrencyInputCustom({
  value,
  onChange,
  placeholder = "R$ 0,00",
  className = "",
  max,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  max?: number
}) {
  const formatCurrency = (value: string) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, "")

    // Se não há números, retorna vazio
    if (!numbers) return ""

    // Converte para número e divide por 100 para ter os centavos
    const amount = Number.parseInt(numbers) / 100

    // Formata como moeda brasileira
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value)

    // Se há um valor máximo definido, verificar
    if (max !== undefined) {
      const numericValue = Number.parseFloat(formatted.replace(/[R$\s.]/g, "").replace(",", "."))
      if (numericValue > max) {
        return // Não atualizar se exceder o máximo
      }
    }

    onChange(formatted)
  }

  return <Input type="text" value={value} onChange={handleChange} placeholder={placeholder} className={className} />
}

export default function BucketDetailPage() {
  const supabase = createClientComponentClient()
  const { id } = useParams()
  const router = useRouter()
  const {
    buckets,
    loading,
    error,
    fetchInitialData,
    updateBucketStrategicData,
    adicionarExtrato,
    criarEmprestimo,
    excluirTransacaoCompleta,
    exchangeRate,
  } = useBuckets()

  const [currentBucket, setCurrentBucket] = useState<Bucket | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<Extrato | null>(null)
  const [modalNovaTransacao, setModalNovaTransacao] = useState(false)
  const [modalAlocacao, setModalAlocacao] = useState(false)
  const [editandoNome, setEditandoNome] = useState(false)
  const [novoNome, setNovoNome] = useState("")
  const [mostrarAgendamentos, setMostrarAgendamentos] = useState(false)
  const [modalExclusao, setModalExclusao] = useState<{ open: boolean; bucket: Bucket | null }>({
    open: false,
    bucket: null,
  })
  const [confirmacaoNome, setConfirmacaoNome] = useState("")
  const [emprestimosQuitados, setEmprestimosQuitados] = useState<any[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [valorAlocacao, setValorAlocacao] = useState("")
  const [percentualAlocacao, setPercentualAlocacao] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dataAlocacao, setDataAlocacao] = useState<Date | undefined>(new Date())
  const [mostrarAlocacaoInicial, setMostrarAlocacaoInicial] = useState(false) // Declare setMostrarAlocacaoInicial

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

  const carregarDadosBucket = async () => {
    if (!id || !supabase) return

    const bucket = buckets.find((b) => b.id === id)
    if (bucket) {
      setCurrentBucket(bucket)
      setNovoNome(bucket.nome)

      const { data: emprestimosQuitadosData, error: quitadosError } = await supabase
        .from("extratos")
        .select("*")
        .eq("bucket_id", bucket.id)
        .eq("transacao", "saida_emprestimo")
        .eq("status_emprestimo", "quitado")
        .order("data", { ascending: false })

      if (quitadosError) {
        console.error("Erro ao buscar empréstimos quitados:", quitadosError)
        return
      }

      const { data: allBuckets, error: bucketsError } = await supabase.from("buckets").select("id, nome")
      if (bucketsError) {
        console.error("Erro ao buscar todos os buckets:", bucketsError)
        return
      }

      const bucketsMap: { [key: string]: string } = {}
      allBuckets?.forEach((b) => {
        bucketsMap[b.id] = b.nome
      })

      const emprestimosComNomes =
        emprestimosQuitadosData?.map((emp) => ({
          ...emp,
          devedor_nome: bucketsMap[emp.conta_destino_id] || "Externo",
        })) || []

      setEmprestimosQuitados(emprestimosComNomes)
    }
  }

  useEffect(() => {
    if (!loading && buckets.length > 0) {
      carregarDadosBucket()
    }
  }, [id, buckets, loading])

  useEffect(() => {
    if (!modalExclusao.open) {
      setConfirmacaoNome("")
    }
  }, [modalExclusao.open])

  const handleSaveBucket = async (updatedData: Partial<Bucket>) => {
    if (currentBucket) {
      await updateBucketStrategicData(currentBucket.id, updatedData)
    }
  }

  const handleSalvarNome = async () => {
    if (currentBucket && novoNome.trim() && novoNome.trim() !== currentBucket.nome) {
      await updateBucketStrategicData(currentBucket.id, { nome: novoNome.trim() })
    }
    setEditandoNome(false)
  }

  const handleCancelarEdicaoNome = () => {
    if (currentBucket) {
      setNovoNome(currentBucket.nome)
    }
    setEditandoNome(false)
  }

  const handleSaveTransaction = async () => {
    await fetchInitialData()
    setEditingTransaction(null)
    setModalNovaTransacao(false)
  }

  const handleEditTransaction = (extrato: Extrato) => {
    setEditingTransaction(extrato)
    setModalNovaTransacao(true)
  }

  const handleDeleteTransaction = async (extrato: Extrato) => {
    if (window.confirm("Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.")) {
      await excluirTransacaoCompleta(extrato)
    }
  }

  const handleConfirmarTransacao = async (transacaoId: string) => {
    const { error } = await supabase.from("extratos").update({ status: "Confirmado" }).eq("id", transacaoId)
    if (!error) {
      await supabase
        .from("agendamentos_execucoes")
        .update({ status: "confirmado", data_execucao: new Date().toISOString() })
        .eq("transacao_id", transacaoId)
      await fetchInitialData()
    } else {
      console.error("Erro ao confirmar transação:", error)
    }
  }

  const handleTransformarEmDivida = async (transacao: Extrato) => {
    if (new Date(transacao.data) < new Date() && transacao.status === "Pendente") {
      await criarEmprestimo({
        origemId: transacao.bucketId,
        destinoId: transacao.bucketId,
        valor: transacao.valorBRL,
        data: transacao.data,
        descricao: `${transacao.descricao} - Não pago (convertido em dívida)`,
      })
      const { error } = await supabase.from("extratos").update({ status: "Vencido" }).eq("id", transacao.id)
      if (!error) {
        await fetchInitialData()
      } else {
        console.error("Erro ao marcar como vencido:", error)
      }
    }
  }

  const handleExcluirBucket = async () => {
    if (!modalExclusao.bucket) return

    try {
      const { data: emprestimosAtivos, error: checkError } = await supabase
        .from("extratos")
        .select("id")
        .or(`bucket_id.eq.${modalExclusao.bucket.id},conta_destino_id.eq.${modalExclusao.bucket.id}`)
        .eq("status_emprestimo", "ativo")
        .limit(1)

      if (checkError) throw checkError

      if (emprestimosAtivos && emprestimosAtivos.length > 0) {
        toast({
          title: "Ação Bloqueada",
          description: "Não é possível excluir um bucket que participa de empréstimos ou dívidas ativas!",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase.from("buckets").delete().eq("id", modalExclusao.bucket.id)

      if (error) throw error

      toast({ title: "Sucesso", description: `Bucket "${modalExclusao.bucket.nome}" excluído.` })
      setConfirmacaoNome("")
      setModalExclusao({ open: false, bucket: null })
      router.push("/buckets")
    } catch (error: any) {
      console.error("Erro ao excluir bucket:", error)
      toast({
        title: "Erro ao Excluir",
        description: error.message || "Ocorreu um erro ao tentar excluir o bucket.",
        variant: "destructive",
      })
    }
  }

  const sliderRef = useRef<HTMLDivElement>(null)
  const [percent, setPercent] = useState(0) // Moved useState here

  const [percentualInterno, setPercentualInterno] = useState(0)
  const [valorInterno, setValorInterno] = useState(0)

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !sliderRef.current) return

      const rect = sliderRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const width = rect.width

      let newPercent = (x / width) * 100
      newPercent = Math.max(0, Math.min(100, newPercent))
      setPercent(newPercent)
      setPercentualInterno(Math.round(newPercent))
      const saldoDisponivel = currentBucket?.saldoAtual || 0
      setValorInterno((saldoDisponivel * newPercent) / 100)

      setPercentualAlocacao(Math.round(newPercent))
      setValorAlocacao((saldoDisponivel * newPercent) / 100)
    },
    [
      isDragging,
      setPercentualAlocacao,
      setValorAlocacao,
      setPercentualInterno,
      setValorInterno,
      currentBucket?.saldoAtual,
    ],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.userSelect = "none"
      document.body.style.cursor = "grabbing"
    } else {
      document.body.style.userSelect = ""
      document.body.style.cursor = ""
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.userSelect = ""
      document.body.style.cursor = ""
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const AlocacaoInicialModal = () => {
    if (!currentBucket) return null
    const saldoDisponivel = currentBucket.saldoAtual || 0

    const confirmarAlocacao = async () => {
      if (!currentBucket) return
      const saldoDisponivel = currentBucket.saldoAtual || 0

      if (valorAlocacao <= 0) {
        toast({
          title: "Valor Inválido",
          description: "Selecione um valor para alocar.",
          variant: "destructive",
        })
        return
      }

      if (valorAlocacao > saldoDisponivel) {
        toast({
          title: "Valor Excedido",
          description: "Valor de alocação não pode ser maior que o saldo disponível.",
          variant: "destructive",
        })
        return
      }

      try {
        const transacaoId = crypto.randomUUID()

        const novaTransacao = {
          id: transacaoId,
          bucket_id: currentBucket.id,
          data: dataAlocacao,
          descricao: "Alocação Inicial de Capital",
          finalidade: `Capital inicial investido - ${percentualAlocacao}% do total`,
          valor_brl: 0,
          valor_usd: 0,
          status: "Confirmado",
          transacao: "alocacao",
          categoria: "Alocação de Capital",
          is_rendimento: false,
          is_alocacao_inicial: true,
          valor_alocado: valorAlocacao,
          percentual_alocado: percentualAlocacao,
          saldo_anterior: saldoDisponivel,
          saldo_final: saldoDisponivel,
          capital_investido_anterior: currentBucket.capitalInvestido || 0,
          capital_investido_novo: valorAlocacao,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        console.log("Inserindo alocação (sem alterar saldo):", novaTransacao)

        const { data, error } = await supabase.from("extratos").insert(novaTransacao).select().single()

        if (error) throw error

        const { error: updateError } = await supabase
          .from("buckets")
          .update({
            capital_investido: valorAlocacao,
            capital_total: saldoDisponivel,
            capital_operacional: saldoDisponivel - valorAlocacao,
          })
          .eq("id", currentBucket.id)

        if (updateError) {
          console.error("Erro ao atualizar capital investido:", updateError)
        }

        setMostrarAlocacaoInicial(false)
        toast({
          title: "Sucesso!",
          description: `Capital de ${formatCurrency(valorAlocacao)} alocado para investimentos!`,
          variant: "default",
        })
        await fetchInitialData()
        await carregarDadosBucket()
      } catch (error: any) {
        console.error("Erro ao alocar capital:", error)
        toast({
          title: "Erro ao processar alocação",
          description: error.message,
          variant: "destructive",
        })
      }
    }

    return (
      <>
        <div className="fixed inset-0 bg-black/80 z-50" onClick={() => setMostrarAlocacaoInicial(false)} />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="bg-gray-900 border border-gray-800 rounded-lg shadow-xl max-w-[600px] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-2xl font-bold text-center">🚀 Aloque o Capital Inicial</h2>
              <p className="text-center text-gray-400 mt-2">
                Defina quanto do saldo atual será destinado como capital de investimento para{" "}
                <span className="text-white font-semibold">{currentBucket?.nome}</span>
              </p>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <span className="text-gray-400">Saldo Disponível</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-green-400 block">
                      {saldoDisponivel > 1000000
                        ? formatarValorCompacto(saldoDisponivel)
                        : formatCurrency(saldoDisponivel)}
                    </span>
                    {saldoDisponivel > 1000000 && (
                      <span className="text-xs text-gray-500">{formatCurrency(saldoDisponivel)}</span>
                    )}
                  </div>
                </div>
                <div className="space-y-4 py-4">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>0%</span>
                    <span className="text-lg font-semibold text-white">{percentualAlocacao}%</span>
                    <span>100%</span>
                  </div>
                  <div ref={sliderRef} className="relative">
                    <style jsx>{`
                      input[type="range"] {
                        -webkit-appearance: none;
                        width: 100%;
                        height: 8px;
                        background: transparent;
                        cursor: pointer;
                      }
                      input[type="range"]::-webkit-slider-track {
                        width: 100%;
                        height: 8px;
                        background: #374151;
                        border-radius: 4px;
                      }
                      input[type="range"]::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        width: 24px;
                        height: 24px;
                        background: #8b5cf6;
                        border: 2px solid white;
                        border-radius: 50%;
                        cursor: pointer;
                        margin-top: -8px;
                        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.1);
                      }
                      input[type="range"]::-moz-range-track {
                        width: 100%;
                        height: 8px;
                        background: #374151;
                        border-radius: 4px;
                      }
                      input[type="range"]::-moz-range-thumb {
                        width: 24px;
                        height: 24px;
                        background: #8b5cf6;
                        border: 2px solid white;
                        border-radius: 50%;
                        cursor: pointer;
                        border: none;
                        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.1);
                      }
                    `}</style>
                    <div
                      className="absolute top-1/2 left-0 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-l -translate-y-1/2 pointer-events-none"
                      style={{ width: `${percentualAlocacao}%` }}
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={percentualAlocacao}
                      onChange={(e) => {
                        const percentual = Number.parseInt(e.target.value)
                        setPercentualAlocacao(percentual)
                        const saldoDisponivel = currentBucket?.saldoAtual || 0
                        setValorAlocacao((saldoDisponivel * percentual) / 100)
                      }}
                      onMouseDown={() => setIsDragging(true)}
                      onMouseUp={() => setIsDragging(false)}
                      className="relative z-10 w-full"
                      style={{ cursor: isDragging ? "grabbing" : "grab" }}
                    />
                    {isDragging && (
                      <div
                        className="absolute -top-8 bg-purple-600 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none"
                        style={{
                          left: `${percentualAlocacao}%`,
                          transform: "translateX(-50%)",
                        }}
                      >
                        {percentualAlocacao}%
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
                  <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-center overflow-hidden">
                    <p className="text-xs text-gray-500 mb-1">Valor a Alocar</p>
                    <p className={`font-bold text-blue-400 ${valorAlocacao > 1000000 ? "text-lg" : "text-xl"}`}>
                      {valorAlocacao > 1000000
                        ? `R$ ${(valorAlocacao / 1000000).toFixed(2)}M`
                        : formatCurrency(valorAlocacao)}
                    </p>
                    {valorAlocacao > 1000000 && (
                      <p className="text-xs text-gray-500 mt-1">{formatCurrency(valorAlocacao)}</p>
                    )}
                  </div>

                  <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-center overflow-hidden">
                    <p className="text-xs text-gray-500 mb-1">Percentual</p>
                    <p className="text-xl font-bold text-purple-400">{percentualAlocacao}%</p>
                    <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-400 transition-all duration-300"
                        style={{ width: `${percentualAlocacao}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-center overflow-hidden">
                    <p className="text-xs text-gray-500 mb-1">Saldo Restante</p>
                    <p
                      className={`font-bold text-gray-400 ${
                        saldoDisponivel - valorAlocacao > 1000000 ? "text-lg" : "text-xl"
                      }`}
                    >
                      {saldoDisponivel - valorAlocacao > 1000000
                        ? `R$ ${((saldoDisponivel - valorAlocacao) / 1000000).toFixed(2)}M`
                        : formatCurrency(saldoDisponivel - valorAlocacao)}
                    </p>
                    {saldoDisponivel - valorAlocacao > 1000000 && (
                      <p className="text-xs text-gray-500 mt-1">{formatCurrency(saldoDisponivel - valorAlocacao)}</p>
                    )}
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <Label htmlFor="data-alocacao" className="text-sm text-gray-400">
                    Data da Alocação Inicial
                  </Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <input
                      type="date"
                      id="data-alocacao"
                      value={dataAlocacao}
                      onChange={(e) => setDataAlocacao(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none transition-colors"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Use esta opção se o capital foi investido em uma data anterior
                  </p>
                </div>

                {valorAlocacao > 0 && (
                  <Alert className="bg-blue-900/20 border-blue-800 mt-4">
                    <Info className="h-4 w-4 text-blue-400" />
                    <AlertDescription className="text-blue-300 text-sm">
                      <strong>Como funciona:</strong> Esta será a primeira linha do seu extrato, mostrando que em{" "}
                      {new Date(dataAlocacao + "T00:00:00").toLocaleDateString("pt-BR")} você separou{" "}
                      {formatCurrency(valorAlocacao)} como capital inicial para investimentos.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex gap-2 pt-4">
                  <span className="text-sm text-gray-400 mr-2">Atalhos:</span>
                  {[25, 50, 75, 100].map((val) => (
                    <Button
                      key={val}
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPercentualAlocacao(val)
                        const saldoDisponivel = currentBucket?.saldoAtual || 0
                        setValorAlocacao((saldoDisponivel * val) / 100)
                      }}
                    >
                      {val}%
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-800 flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setMostrarAlocacaoInicial(false)}>
                Cancelar
              </Button>
              <Button onClick={confirmarAlocacao} disabled={valorAlocacao <= 0} className="gap-2">
                <Check className="h-4 w-4" />
                <span className="hidden sm:inline">Confirmar Alocação de</span>
                <span className="font-bold">
                  {valorAlocacao > 1000000 ? formatarValorCompacto(valorAlocacao) : formatCurrency(valorAlocacao)}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </>
    )
  }

  const hasTransactions = currentBucket?.extratos && currentBucket.extratos.length > 0

  if (loading || !currentBucket) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-xl">Carregando...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-red-500">
        <div className="text-xl text-center">
          <p>Erro ao carregar dados:</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    )
  }

  const Icon = currentBucket.icon

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft />
          </Button>
          <div className="flex items-center gap-2">
            {!editandoNome ? (
              <>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  {Icon && <Icon className="h-8 w-8" />}
                  {currentBucket.nome}
                </h1>
                <Button variant="ghost" size="icon" onClick={() => setEditandoNome(true)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} className="text-3xl font-bold" />
                <Button variant="ghost" size="icon" onClick={handleSalvarNome}>
                  <Check className="h-4 w-4 text-green-500" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleCancelarEdicaoNome}>
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            )}
          </div>
          <span className="text-muted-foreground">{currentBucket.categoria}</span>
        </div>
        <div className="flex items-center gap-2">
          <BucketActiveToggle bucketId={currentBucket.id} isActive={currentBucket.isActive ?? true} />
          <Button variant="outline" onClick={() => setMostrarAgendamentos(true)}>
            <Calendar className="mr-2 h-4 w-4" />
            Gerenciar Agendamentos
          </Button>
        </div>
      </div>

      <BucketMetricsCard bucket={currentBucket} onSave={handleSaveBucket} hasTransactions={hasTransactions} />
      <PerformanceRendimentos bucket={currentBucket} />
      <PainelEmprestimosAtivos bucketId={currentBucket.id} />
      <PainelDividasAtivas bucketId={currentBucket.id} moedaPrincipal={currentBucket.moedaPrincipal} />
      {emprestimosQuitados && emprestimosQuitados.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Histórico de Empréstimos Quitados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Devedor</TableHead>
                  <TableHead>Data Concessão</TableHead>
                  <TableHead className="text-right">Valor Emprestado</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emprestimosQuitados.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>{emp.devedor_nome || "Externo"}</TableCell>
                    <TableCell>{new Date(emp.data).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-right">{formatCurrency(emp.valor_brl)}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        Quitado
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      <ExtratoDetalhado
        bucket={currentBucket}
        onAddTransaction={() => setModalNovaTransacao(true)} // Declare handleAbrirTransacao
        onEditTransaction={handleEditTransaction}
        onDeleteTransaction={handleDeleteTransaction}
        onConfirmTransaction={handleConfirmarTransacao}
        onConvertToDebt={handleTransformarEmDivida}
      />
      <ZonaPerigo bucket={currentBucket} onDeleteBucket={handleExcluirBucket} />

      {currentBucket && (
        <TransacaoForm
          open={modalNovaTransacao}
          onOpenChange={setModalNovaTransacao}
          bucket={currentBucket}
          buckets={buckets}
          onSuccess={handleSaveTransaction}
          extratoToEdit={editingTransaction}
        />
      )}

      {mostrarAgendamentos && (
        <ModalAgendamentos
          open={mostrarAgendamentos}
          onClose={() => setMostrarAgendamentos(false)}
          bucketId={currentBucket.id}
          moedaPrincipal={currentBucket.moedaPrincipal || "BRL"}
        />
      )}
    </main>
  )
}

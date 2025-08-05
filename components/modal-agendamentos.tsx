"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Trash2, Plus, Clock } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { CurrencyInput } from "@/components/currency-input"
import { cn, formatCurrency } from "@/lib/utils"
import { useBuckets } from "@/context/buckets-context"

interface Agendamento {
  id: string
  descricao: string
  categoria: string
  valor_brl: number
  valor_usd?: number
  dia_vencimento: number
  tipo_recorrencia: string
  bucket_destino_id?: string
  ativo: boolean
}

const initialFormData = {
  descricao: "",
  categoria: "Despesas Fixas",
  valor_brl: 0,
  valor_usd: 0,
  dia_vencimento: 1,
  tipo_recorrencia: "mensal",
  bucket_destino_id: "",
}

export function ModalAgendamentos({
  open,
  onClose,
  bucketId,
  moedaPrincipal,
}: {
  open: boolean
  onClose: () => void
  bucketId: string
  moedaPrincipal: "BRL" | "USD"
}) {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(false)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [formData, setFormData] = useState(initialFormData)
  const { exchangeRate } = useBuckets()

  useEffect(() => {
    if (open) {
      carregarAgendamentos()
    }
  }, [open, bucketId])

  const carregarAgendamentos = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .eq("bucket_id", bucketId)
        .eq("ativo", true)
        .order("dia_vencimento", { ascending: true })

      if (error) {
        console.error("Erro ao carregar agendamentos:", error)
        if (error.message.includes('relation "public.agendamentos" does not exist')) {
          setAgendamentos([])
        }
        return
      }

      if (data) {
        setAgendamentos(data)
      }
    } catch (err) {
      console.error("Erro inesperado ao carregar agendamentos:", err)
      setAgendamentos([])
    } finally {
      setLoading(false)
    }
  }

  const salvarAgendamento = async () => {
    setLoading(true)
    const { error } = await supabase.from("agendamentos").insert({
      ...formData,
      bucket_id: bucketId,
      data_inicio: new Date().toISOString().split("T")[0],
    })

    if (!error) {
      await carregarAgendamentos()
      setMostrarFormulario(false)
      resetForm()
      await supabase.rpc("gerar_transacoes_agendadas")
    } else {
      console.error("Erro ao salvar agendamento:", error)
    }
    setLoading(false)
  }

  const desativarAgendamento = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja desativar este agendamento?")) return
    setLoading(true)
    const { error } = await supabase.from("agendamentos").update({ ativo: false }).eq("id", id)

    if (!error) {
      await carregarAgendamentos()
    } else {
      console.error("Erro ao desativar agendamento:", error)
    }
    setLoading(false)
  }

  const resetForm = () => {
    setFormData(initialFormData)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Gerenciar Agendamentos
          </DialogTitle>
          <DialogDescription>
            Configure pagamentos e transferências recorrentes que serão lançados automaticamente no extrato.
          </DialogDescription>
        </DialogHeader>

        <div className={cn("space-y-4", loading && "opacity-50 pointer-events-none")}>
          {agendamentos.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-white/60">Agendamentos Ativos</h3>
              {agendamentos.map((agendamento) => (
                <div
                  key={agendamento.id}
                  className="flex items-center justify-between p-3 border border-white/10 rounded-lg bg-white/5"
                >
                  <div className="flex-1">
                    <p className="font-medium">{agendamento.descricao}</p>
                    <p className="text-sm text-white/70">
                      Todo dia {agendamento.dia_vencimento} •{" "}
                      {moedaPrincipal === "USD"
                        ? formatCurrency(agendamento.valor_usd || 0, "USD")
                        : formatCurrency(agendamento.valor_brl, "BRL")}{" "}
                      • {agendamento.tipo_recorrencia}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => desativarAgendamento(agendamento.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {!mostrarFormulario && (
            <Button onClick={() => setMostrarFormulario(true)} className="w-full" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Novo Agendamento
            </Button>
          )}

          {mostrarFormulario && (
            <div className="space-y-4 border border-white/20 rounded-lg p-4">
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Ex: Aluguel, Internet, Salário..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Despesas Fixas">Despesas Fixas</SelectItem>
                      <SelectItem value="Investimento Programado">Investimento Programado</SelectItem>
                      <SelectItem value="Transferência Recorrente">Transferência Recorrente</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Dia do Vencimento</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dia_vencimento}
                    onChange={(e) => setFormData({ ...formData, dia_vencimento: Number.parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <CurrencyInput
                    value={moedaPrincipal === "USD" ? formData.valor_usd : formData.valor_brl}
                    onChange={(value) => {
                      const numValue = value || 0
                      if (moedaPrincipal === "USD") {
                        setFormData({
                          ...formData,
                          valor_usd: numValue,
                          valor_brl: numValue * exchangeRate,
                        })
                      } else {
                        setFormData({
                          ...formData,
                          valor_brl: numValue,
                          valor_usd: numValue / exchangeRate,
                        })
                      }
                    }}
                    moedaPrincipal={moedaPrincipal}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Recorrência</Label>
                  <Select
                    value={formData.tipo_recorrencia}
                    onValueChange={(value) => setFormData({ ...formData, tipo_recorrencia: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="semestral">Semestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setMostrarFormulario(false)
                    resetForm()
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={salvarAgendamento}>Salvar Agendamento</Button>
              </div>
            </div>
          )}

          <div className="bg-blue-950/30 p-3 rounded-lg border border-blue-500/20">
            <div className="flex gap-3">
              <Clock className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-300">
                <p className="font-medium text-blue-200">Como funciona:</p>
                <ul className="mt-1 space-y-1 text-xs list-disc list-inside text-blue-300/80">
                  <li>Transações são criadas automaticamente como "Pendente" no dia do vencimento.</li>
                  <li>Você pode confirmar o pagamento ou convertê-lo em dívida direto no extrato.</li>
                  <li>Após o vencimento, transações pendentes podem gerar alertas de custo de oportunidade.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

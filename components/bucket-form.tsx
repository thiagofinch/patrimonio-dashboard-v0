"use client"

import type React from "react"
import { useState } from "react"
import type { Bucket } from "@/types/patrimonio"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogFooter } from "@/components/ui/dialog"
import { CurrencyInputFormatted } from "@/components/currency-input-formatted"

interface BucketFormProps {
  bucket?: Partial<Bucket>
  onSave: (bucket: Partial<Bucket>) => void
  onClose: () => void
}

export function BucketForm({ bucket: initialBucket, onSave, onClose }: BucketFormProps) {
  const [formData, setFormData] = useState(
    initialBucket || {
      nome: "",
      moedaPrincipal: "BRL",
      tipo: "investimento",
      categoria: "Investimentos Líquidos",
      capitalInicial: 0,
      aportesMensais: 0,
      periodoMeses: 0,
      taxaRendimento: 0,
      taxaEmprestimo: 0,
    },
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      {/* 1. Nome */}
      <div className="space-y-2">
        <Label htmlFor="nome">Nome do Bucket</Label>
        <Input
          id="nome"
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          placeholder="Ex: Reserva de Emergência"
          required
        />
      </div>

      {/* 2. Moeda Principal */}
      <div className="space-y-2">
        <Label>Moeda Principal</Label>
        <Select
          value={formData.moedaPrincipal}
          onValueChange={(value: "BRL" | "USD") => setFormData({ ...formData, moedaPrincipal: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BRL">🇧🇷 Real Brasileiro (R$)</SelectItem>
            <SelectItem value="USD">🇺🇸 Dólar Americano ($)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Define a moeda principal para os valores deste bucket.</p>
      </div>

      {/* 3. Tipo */}
      <div className="space-y-2">
        <Label>Tipo</Label>
        <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="investimento">Investimento</SelectItem>
            <SelectItem value="corrente">Conta Corrente</SelectItem>
            <SelectItem value="caixa">Caixa</SelectItem>
            <SelectItem value="emprestimo">Empréstimo</SelectItem>
            <SelectItem value="imobilizado">Ativo Imobilizado</SelectItem>
            <SelectItem value="outro">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 4. Categoria */}
      <div className="space-y-2">
        <Label>Categoria</Label>
        <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Investimentos Líquidos">Investimentos Líquidos</SelectItem>
            <SelectItem value="Ativos Imobilizados">Ativos Imobilizados</SelectItem>
            <SelectItem value="Empréstimos">Empréstimos</SelectItem>
            <SelectItem value="Outro">Outro</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground h-4">
          {formData.categoria === "Investimentos Líquidos" && "Aplicações financeiras com liquidez e retorno."}
          {formData.categoria === "Ativos Imobilizados" && "Bens físicos e propriedades de baixa liquidez."}
          {formData.categoria === "Empréstimos" && "Valores emprestados a terceiros que geram juros."}
        </p>
      </div>

      {/* 5. Capital Inicial */}
      <div className="space-y-2">
        <Label>Capital Inicial</Label>
        <CurrencyInputFormatted
          value={formData.capitalInicial || 0}
          onValueChange={(valor) => {
            console.log("💰 Valor digitado:", valor)
            setFormData({ ...formData, capitalInicial: valor ?? 0 })
          }}
          moeda={formData.moedaPrincipal || "BRL"}
          placeholder={formData.moedaPrincipal === "BRL" ? "0,00" : "0.00"}
        />
        <p className="text-xs text-muted-foreground">Valor inicial que será aportado neste bucket.</p>
      </div>

      {/* 6. Aportes Mensais */}
      <div className="space-y-2">
        <Label>Aportes Mensais</Label>
        <CurrencyInputFormatted
          value={formData.aportesMensais || 0}
          onValueChange={(valor) => setFormData({ ...formData, aportesMensais: valor ?? 0 })}
          moeda={formData.moedaPrincipal || "BRL"}
          placeholder={formData.moedaPrincipal === "BRL" ? "0,00" : "0.00"}
        />
        <p className="text-xs text-muted-foreground">Valor a ser adicionado mensalmente (0 se não houver)</p>
      </div>

      {/* 7. Período (Meses) */}
      <div className="space-y-2">
        <Label htmlFor="periodoMeses">Período (Meses)</Label>
        <Input
          id="periodoMeses"
          type="number"
          value={formData.periodoMeses}
          onChange={(e) => setFormData({ ...formData, periodoMeses: Number.parseInt(e.target.value) || 0 })}
          placeholder="0"
        />
        <p className="text-xs text-muted-foreground">Prazo planejado em meses (0 para indefinido).</p>
      </div>

      {/* 8. Taxa de Rendimento */}
      <div className="space-y-2">
        <Label htmlFor="taxaRendimento">Taxa de Rendimento (% a.m.)</Label>
        <Input
          id="taxaRendimento"
          type="number"
          step="0.01"
          value={formData.taxaRendimento}
          onChange={(e) => setFormData({ ...formData, taxaRendimento: Number.parseFloat(e.target.value) || 0 })}
          placeholder="0.00"
        />
      </div>

      {/* 9. Taxa de Empréstimo */}
      <div className="space-y-2">
        <Label htmlFor="taxaEmprestimo">Taxa de Empréstimo (% a.m.)</Label>
        <Input
          id="taxaEmprestimo"
          type="number"
          step="0.01"
          value={formData.taxaEmprestimo}
          onChange={(e) => setFormData({ ...formData, taxaEmprestimo: Number.parseFloat(e.target.value) || 0 })}
          placeholder="0.00"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">Salvar Bucket</Button>
      </DialogFooter>
    </form>
  )
}

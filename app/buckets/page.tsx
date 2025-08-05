"use client"

import { useRouter } from "next/navigation"
import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, PlusCircle, MoreVertical, Trash2, Edit, AlertCircle, EyeOff } from "lucide-react"
import { useBuckets } from "@/context/buckets-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { BucketForm } from "@/components/bucket-form"
import type { Bucket } from "@/types/patrimonio"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

export default function BucketsPage() {
  const { buckets, adicionarBucket, fetchInitialData } = useBuckets()
  const router = useRouter()
  const supabase = createClientComponentClient()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [modalExclusao, setModalExclusao] = useState<{ open: boolean; bucket: Bucket | null }>({
    open: false,
    bucket: null,
  })
  const [confirmacaoNome, setConfirmacaoNome] = useState("")
  const [showInactive, setShowInactive] = useState(false)

  const filteredBuckets = useMemo(
    () => buckets.filter((bucket) => showInactive || bucket.isActive !== false),
    [buckets, showInactive],
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const handleSaveNewBucket = async (newBucketData: Partial<Bucket>) => {
    await adicionarBucket(newBucketData)
    setIsDialogOpen(false)
  }

  const handleExcluirBucket = async () => {
    if (!modalExclusao.bucket) return

    try {
      // Verificar se há empréstimos ou dívidas ativas envolvendo este bucket
      const { data: emprestimosAtivos, error: checkError } = await supabase
        .from("extratos")
        .select("id")
        .or(`bucket_id.eq.${modalExclusao.bucket.id},conta_destino_id.eq.${modalExclusao.bucket.id}`)
        .eq("status_emprestimo", "ativo")
        .limit(1)

      if (checkError) throw checkError

      if (emprestimosAtivos && emprestimosAtivos.length > 0) {
        alert("Não é possível excluir um bucket que participa de empréstimos ou dívidas ativas!")
        return
      }

      // Excluir o bucket (o cascade no DB deve cuidar dos extratos)
      const { error } = await supabase.from("buckets").delete().eq("id", modalExclusao.bucket.id)

      if (error) throw error

      await fetchInitialData() // Recarregar a lista de buckets
      setConfirmacaoNome("")
      setModalExclusao({ open: false, bucket: null })
    } catch (error) {
      console.error("Erro ao excluir bucket:", error)
      alert("Ocorreu um erro ao tentar excluir o bucket.")
    }
  }

  const categoriasBuckets = useMemo(() => {
    return filteredBuckets.reduce(
      (acc, bucket) => {
        if (!acc[bucket.categoria]) {
          acc[bucket.categoria] = []
        }
        acc[bucket.categoria].push(bucket)
        return acc
      },
      {} as Record<string, Bucket[]>,
    )
  }, [filteredBuckets])

  const saldosMap = useMemo(() => {
    const map = new Map<string, number>()
    buckets.forEach((bucket) => {
      const saldo = bucket.extratos.reduce((sum, e) => {
        if (e.status === "Confirmado") {
          return sum + (e.transacao === "entrada" ? e.valorBRL : -e.valorBRL)
        }
        return sum
      }, bucket.capitalInicialBRL)
      map.set(bucket.id, saldo)
    })
    return map
  }, [buckets])

  // Reseta o campo de confirmação quando o modal é fechado
  useEffect(() => {
    if (!modalExclusao.open) {
      setConfirmacaoNome("")
    }
  }, [modalExclusao.open])

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="text-left">
          <h1 className="text-4xl font-extrabold">Todos os Buckets</h1>
          <p className="text-white/60 mt-2">Selecione um bucket para ver sua mini-dashboard detalhada.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-inactive"
              checked={showInactive}
              onCheckedChange={(checked) => setShowInactive(Boolean(checked))}
            />
            <label
              htmlFor="show-inactive"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Mostrar inativos
            </label>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Novo Bucket
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Bucket</DialogTitle>
                <DialogDescription>Preencha as informações abaixo para criar um novo bucket.</DialogDescription>
              </DialogHeader>
              <BucketForm onSave={handleSaveNewBucket} onClose={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-12">
        {Object.entries(categoriasBuckets).map(([categoria, bucketsList]) => (
          <div key={categoria}>
            <h2 className="text-2xl font-bold mb-6 relative pl-4">
              <span className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></span>
              {categoria}
            </h2>
            <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
              {bucketsList.map((bucket) => {
                const Icon = bucket.icon
                const saldo = saldosMap.get(bucket.id) || 0
                return (
                  <Card className="glass h-full relative group" key={bucket.id}>
                    {bucket.isActive === false && (
                      <Badge variant="secondary" className="absolute top-2 left-2 z-10">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Inativo
                      </Badge>
                    )}
                    <div className="absolute top-2 right-2 z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => router.push(`/buckets/${bucket.id}`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Abrir / Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onSelect={(e) => {
                              e.preventDefault()
                              setModalExclusao({ open: true, bucket })
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir Bucket
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <Link href={`/buckets/${bucket.id}`} className="block h-full p-6">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          <Icon className="h-5 w-5 text-purple-400" />
                          {bucket.nome}
                        </CardTitle>
                        {bucket.inadimplencia && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="text-3xl font-black mt-4">{formatCurrency(saldo)}</div>
                        <div className="flex items-center justify-between text-xs text-white/50 mt-2">
                          <span className="capitalize">{bucket.tipo.replace(/_/g, " ")}</span>
                          <Badge
                            className="border-none text-white"
                            style={{
                              background:
                                (bucket.taxaRendimento ?? 0) > 0
                                  ? "rgba(16, 185, 129, 0.2)"
                                  : (bucket.taxaRendimento ?? 0) < 0
                                    ? "rgba(239, 68, 68, 0.2)"
                                    : "rgba(255, 255, 255, 0.1)",
                              color:
                                (bucket.taxaRendimento ?? 0) > 0
                                  ? "#10b981"
                                  : (bucket.taxaRendimento ?? 0) < 0
                                    ? "#ef4444"
                                    : "#ffffff90",
                            }}
                          >
                            {(Number(bucket.taxaRendimento) || 0).toFixed(2)}%
                          </Badge>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={modalExclusao.open} onOpenChange={(open) => setModalExclusao({ ...modalExclusao, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Bucket "{modalExclusao.bucket?.nome}"?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-4">
                <Alert className="mt-4" variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Esta ação é IRREVERSÍVEL. Todos os dados associados serão perdidos permanentemente.
                  </AlertDescription>
                </Alert>
                <div>
                  <Label htmlFor="confirm-delete">
                    Digite <span className="font-bold text-red-500">{modalExclusao.bucket?.nome}</span> para confirmar:
                  </Label>
                  <Input
                    id="confirm-delete"
                    value={confirmacaoNome}
                    onChange={(e) => setConfirmacaoNome(e.target.value)}
                    placeholder={modalExclusao.bucket?.nome}
                    className="mt-2"
                  />
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setModalExclusao({ open: false, bucket: null })}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={confirmacaoNome !== modalExclusao.bucket?.nome}
              onClick={handleExcluirBucket}
            >
              Sim, Excluir Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

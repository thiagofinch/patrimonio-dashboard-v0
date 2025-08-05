"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Trash2, AlertCircle, RefreshCw } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { Bucket } from "@/types/patrimonio"

interface ZonaPerigoProps {
  bucket: Bucket
  onDeleteBucket?: () => void
  onRecalculateBalances?: () => void
}

export default function ZonaPerigo({ bucket, onDeleteBucket, onRecalculateBalances }: ZonaPerigoProps) {
  const [modalExclusao, setModalExclusao] = useState(false)
  const [confirmacaoNome, setConfirmacaoNome] = useState("")

  const handleConfirmarExclusao = () => {
    if (confirmacaoNome === bucket.nome && onDeleteBucket) {
      onDeleteBucket()
      setModalExclusao(false)
      setConfirmacaoNome("")
    } else {
      toast({
        title: "Nome incorreto",
        description: "Digite exatamente o nome do bucket para confirmar a exclusão.",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <Card className="mt-6 border-red-500/50">
        <CardHeader>
          <CardTitle className="text-red-500">Zona de Perigo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            {/* Excluir Bucket */}
            <div className="flex-1 min-w-[300px]">
              <p className="text-sm text-muted-foreground mb-2">
                Ações nesta área são permanentes e não podem ser desfeitas. Proceda com extrema cautela.
              </p>
              <Button variant="destructive" onClick={() => setModalExclusao(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Este Bucket Permanentemente
              </Button>
            </div>

            {/* Recalcular Saldos */}
            {onRecalculateBalances && (
              <div className="flex-1 min-w-[300px]">
                <p className="text-sm text-muted-foreground mb-2">
                  Recalcula todos os saldos das transações em ordem cronológica.
                </p>
                <Button variant="outline" onClick={onRecalculateBalances} className="gap-2 bg-transparent">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Forçar Recálculo de Saldos
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={modalExclusao} onOpenChange={setModalExclusao}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Bucket "{bucket.nome}"?</DialogTitle>
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
                    Digite <span className="font-bold text-red-500">{bucket.nome}</span> para confirmar:
                  </Label>
                  <Input
                    id="confirm-delete"
                    value={confirmacaoNome}
                    onChange={(e) => setConfirmacaoNome(e.target.value)}
                    placeholder={bucket.nome}
                    className="mt-2"
                  />
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setModalExclusao(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" disabled={confirmacaoNome !== bucket.nome} onClick={handleConfirmarExclusao}>
              Sim, Excluir Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

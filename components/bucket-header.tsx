"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Check, X, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Bucket } from "@/types/patrimonio"

interface BucketHeaderProps {
  bucket: Bucket
  onUpdateName?: (newName: string) => void
}

export default function BucketHeader({ bucket, onUpdateName }: BucketHeaderProps) {
  const router = useRouter()
  const [editandoNome, setEditandoNome] = useState(false)
  const [novoNome, setNovoNome] = useState(bucket?.nome || "")

  const handleSalvarNome = async () => {
    if (novoNome.trim() && novoNome.trim() !== bucket.nome && onUpdateName) {
      await onUpdateName(novoNome.trim())
    }
    setEditandoNome(false)
  }

  const handleCancelarEdicaoNome = () => {
    setNovoNome(bucket?.nome || "")
    setEditandoNome(false)
  }

  if (!bucket) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft />
          </Button>
          <h1 className="text-3xl font-bold">Carregando...</h1>
        </div>
      </div>
    )
  }

  const Icon = bucket.icon

  return (
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
                {bucket.nome}
              </h1>
              <Button variant="ghost" size="icon" onClick={() => setEditandoNome(true)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                className="text-3xl font-bold"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSalvarNome()
                  if (e.key === "Escape") handleCancelarEdicaoNome()
                }}
                autoFocus
              />
              <Button variant="ghost" size="icon" onClick={handleSalvarNome}>
                <Check className="h-4 w-4 text-green-500" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleCancelarEdicaoNome}>
                <X className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          )}
        </div>
        <span className="text-muted-foreground">{bucket.categoria}</span>
      </div>
    </div>
  )
}

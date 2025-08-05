"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Eye, EyeOff } from "lucide-react"
import { useBuckets } from "@/context/buckets-context"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface BucketActiveToggleProps {
  bucketId: string
  isActive: boolean
  size?: "sm" | "md"
}

export function BucketActiveToggle({ bucketId, isActive: initialActive, size = "md" }: BucketActiveToggleProps) {
  const [isActive, setIsActive] = useState(initialActive)
  const [loading, setLoading] = useState(false)
  const { toggleBucketActive } = useBuckets()

  const handleToggle = async () => {
    setLoading(true)
    try {
      await toggleBucketActive(bucketId, !isActive)
      setIsActive(!isActive)
      toast({
        title: isActive ? "Bucket desativado" : "Bucket ativado",
        description: isActive
          ? "Este bucket não será mais considerado nas métricas"
          : "Este bucket agora será considerado nas métricas",
      })
    } catch (error) {
      toast({
        title: "Erro ao atualizar bucket",
        description: "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg transition-colors",
              isActive ? "bg-green-500/10" : "bg-gray-500/10",
              size === "sm" && "p-1",
            )}
          >
            {isActive ? (
              <Eye className={cn("text-green-500", size === "sm" ? "h-4 w-4" : "h-5 w-5")} />
            ) : (
              <EyeOff className={cn("text-gray-500", size === "sm" ? "h-4 w-4" : "h-5 w-5")} />
            )}
            <Switch
              checked={isActive}
              onCheckedChange={handleToggle}
              disabled={loading}
              className={cn("data-[state=checked]:bg-green-500", size === "sm" && "scale-75")}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {isActive ? "Bucket ativo - Incluído nas métricas" : "Bucket inativo - Excluído das métricas"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

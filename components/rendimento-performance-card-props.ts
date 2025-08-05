import type { Bucket } from "@/types/patrimonio"

export interface RendimentoPerformanceCardProps {
  bucket: Bucket | null | undefined
  title?: string
  description?: string
  capitalAtual?: number
}

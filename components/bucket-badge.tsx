import { Badge } from "@/components/ui/badge"
import { cn, getBucketColorClasses } from "@/lib/utils"

interface BucketBadgeProps {
  bucketName: string | null | undefined
  className?: string
}

export function BucketBadge({ bucketName, className }: BucketBadgeProps) {
  const colorClasses = getBucketColorClasses(bucketName)
  return <Badge className={cn("border font-medium", colorClasses, className)}>{bucketName || "Desconhecido"}</Badge>
}

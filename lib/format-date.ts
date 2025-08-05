import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export function formatRelativeTime(date: string | Date): string {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: ptBR })
  } catch (error) {
    console.error("Invalid date for formatRelativeTime:", date)
    return "data inválida"
  }
}

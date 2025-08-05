import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const colors = [
  "bg-red-500/20 text-red-400 border-red-500/30",
  "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "bg-lime-500/20 text-lime-400 border-lime-500/30",
  "bg-green-500/20 text-green-400 border-green-500/30",
  "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "bg-teal-500/20 text-teal-400 border-teal-500/30",
  "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "bg-sky-500/20 text-sky-400 border-sky-500/30",
  "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  "bg-violet-500/20 text-violet-400 border-violet-500/30",
  "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30",
  "bg-pink-500/20 text-pink-400 border-pink-500/30",
  "bg-rose-500/20 text-rose-400 border-rose-500/30",
]

export const getBucketColorClasses = (str: string | null | undefined): string => {
  if (!str) {
    return "bg-gray-500/20 text-gray-400 border-gray-500/30"
  }
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

export const formatCurrency = (value: number | null | undefined, currency: "BRL" | "USD" = "BRL") => {
  const numericValue = value ?? 0
  if (isNaN(numericValue)) {
    return new Intl.NumberFormat(currency === "BRL" ? "pt-BR" : "en-US", {
      style: "currency",
      currency: currency,
    }).format(0)
  }
  return new Intl.NumberFormat(currency === "BRL" ? "pt-BR" : "en-US", {
    style: "currency",
    currency: currency,
  }).format(numericValue)
}

export const formatPercentage = (value: number | null | undefined) => {
  const numericValue = value ?? 0
  if (isNaN(numericValue)) {
    return "0,00%"
  }
  // Intl.NumberFormat with style 'percent' expects a decimal value (e.g., 0.012 for 1.2%)
  // Assuming the value from the DB (e.g., 1.20) is the percentage value, we divide by 100.
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue / 100)
}

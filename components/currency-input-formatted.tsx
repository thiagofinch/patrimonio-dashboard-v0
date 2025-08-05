"use client"

import { Input } from "@/components/ui/input"
import type { InputProps } from "@/components/ui/input"
import { useEffect, useState } from "react"
import type React from "react"

interface CurrencyInputFormattedProps extends Omit<InputProps, "onChange" | "value"> {
  value: number | null | undefined
  onChange: (value: number) => void
  moeda?: "BRL" | "USD"
}

export function CurrencyInputFormatted({
  value,
  onChange,
  moeda = "BRL",
  placeholder,
  ...props
}: CurrencyInputFormattedProps) {
  const [displayValue, setDisplayValue] = useState("")
  const [isFocused, setIsFocused] = useState(false)

  const formatarMoeda = (valor: number, moeda: string) => {
    if (isNaN(valor) || valor === null) return ""

    if (moeda === "BRL") {
      return valor.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    } else {
      return valor.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    }
  }

  const limparFormatacao = (valorFormatado: string, moeda: string) => {
    if (!valorFormatado) return 0

    let numeroLimpo: string

    if (moeda === "BRL") {
      numeroLimpo = valorFormatado.replace(/\./g, "").replace(",", ".")
    } else {
      numeroLimpo = valorFormatado.replace(/,/g, "")
    }

    numeroLimpo = numeroLimpo.replace(/[^\d.]/g, "")
    const parsed = Number.parseFloat(numeroLimpo)
    return isNaN(parsed) ? 0 : parsed
  }

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatarMoeda(value || 0, moeda))
    }
  }, [value, moeda, isFocused])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setDisplayValue(inputValue)
    const numeroLimpo = limparFormatacao(inputValue, moeda)
    onChange(numeroLimpo)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false)
    const numeroLimpo = limparFormatacao(e.target.value, moeda)
    setDisplayValue(formatarMoeda(numeroLimpo, moeda))
    onChange(numeroLimpo)
    if (props.onBlur) {
      props.onBlur(e)
    }
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true)
    const numeroLimpo = limparFormatacao(e.target.value, moeda)
    setDisplayValue(numeroLimpo === 0 ? "" : String(numeroLimpo))
    if (props.onFocus) {
      props.onFocus(e)
    }
  }

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
        {moeda === "USD" ? "$" : "R$"}
      </span>
      <Input
        {...props}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        className="pl-12 text-right"
        placeholder={placeholder || (moeda === "BRL" ? "0,00" : "0.00")}
      />
    </div>
  )
}

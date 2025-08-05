"use client"

import { useState, useEffect, useRef, type KeyboardEvent, type ChangeEvent } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface FormattedCurrencyInputProps {
  value: number
  onChange: (value: number) => void
  currency?: "BRL" | "USD"
  placeholder?: string
  className?: string
  disabled?: boolean
  min?: number
  max?: number
}

export function FormattedCurrencyInput({
  value,
  onChange,
  currency = "BRL",
  placeholder = "0,00",
  className,
  disabled = false,
  min = 0,
  max,
}: FormattedCurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const formatNumber = (num: number): string => {
    if (currency === "BRL") {
      return num.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    } else {
      return num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    }
  }

  const parseNumber = (str: string): number => {
    if (!str) return 0
    str = str.replace(/[R$\s]/g, "")
    if (currency === "BRL") {
      str = str.replace(/\./g, "").replace(",", ".")
    } else {
      str = str.replace(/,/g, "")
    }
    const num = Number.parseFloat(str)
    return isNaN(num) ? 0 : num
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    const cursorPosition = e.target.selectionStart || 0
    let cleanInput = input.replace(/[^\d.,]/g, "")
    const decimalSeparator = currency === "BRL" ? "," : "."
    const parts = cleanInput.split(decimalSeparator)
    if (parts.length > 2) {
      cleanInput = parts[0] + decimalSeparator + parts.slice(1).join("")
    }
    if (parts.length === 2 && parts[1].length > 2) {
      cleanInput = parts[0] + decimalSeparator + parts[1].slice(0, 2)
    }
    if (parts[0]) {
      const integerPart = parts[0].replace(/\D/g, "")
      const formattedInteger =
        currency === "BRL"
          ? integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
          : integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      cleanInput = formattedInteger + (parts.length === 2 ? decimalSeparator + parts[1] : "")
    }
    setDisplayValue(cleanInput)
    const numericValue = parseNumber(cleanInput)
    if (min !== undefined && numericValue < min) return
    if (max !== undefined && numericValue > max) return
    onChange(numericValue)
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.selectionStart = cursorPosition
        inputRef.current.selectionEnd = cursorPosition
      }
    }, 0)
  }

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value > 0 ? formatNumber(value) : "")
    }
  }, [value, isFocused, currency])

  const handleBlur = () => {
    setIsFocused(false)
    const numericValue = parseNumber(displayValue)
    onChange(numericValue)
    setDisplayValue(numericValue > 0 ? formatNumber(numericValue) : "")
  }

  const handleFocus = () => {
    setIsFocused(true)
    if (inputRef.current) {
      setTimeout(() => {
        inputRef.current?.select()
      }, 0)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const applyChange = (newValue: number) => {
      if (min !== undefined && newValue < min) newValue = min
      if (max !== undefined && newValue > max) newValue = max
      onChange(newValue)
      setDisplayValue(formatNumber(newValue))
    }

    if (e.key === "ArrowUp") {
      e.preventDefault()
      const current = parseNumber(displayValue)
      const increment = e.shiftKey ? 1000 : e.ctrlKey ? 100 : 1
      applyChange(current + increment)
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      const current = parseNumber(displayValue)
      const decrement = e.shiftKey ? 1000 : e.ctrlKey ? 100 : 1
      applyChange(current - decrement)
    } else if (e.ctrlKey && e.key === "k") {
      e.preventDefault()
      applyChange(1000)
    } else if (e.ctrlKey && e.key === "m") {
      e.preventDefault()
      applyChange(1000000)
    }
  }

  return (
    <div className="relative w-full">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
        {currency === "BRL" ? "R$" : "$"}
      </div>
      <Input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn("pl-10 pr-3 text-right font-mono", className)}
        disabled={disabled}
      />
      {isFocused && (
        <div className="absolute -bottom-6 left-0 text-xs text-gray-400 whitespace-nowrap">
          ↑↓: ±1 | Ctrl: ±100 | Shift: ±1k | Ctrl+K/M
        </div>
      )}
    </div>
  )
}

"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"

interface FormattedNumericInputProps {
  value: number | string
  onValueChange: (value: number) => void
  locale?: "pt-BR" | "en-US"
  placeholder?: string
  className?: string
  id?: string
  disabled?: boolean
}

export function FormattedNumericInput({
  value,
  onValueChange,
  locale = "pt-BR",
  ...props
}: FormattedNumericInputProps) {
  const [displayValue, setDisplayValue] = useState("")

  const formatOptions = {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }
  const formatter = new Intl.NumberFormat(locale, formatOptions)

  useEffect(() => {
    const numericValue = typeof value === "string" ? Number.parseFloat(value) : value
    if (!isNaN(numericValue) && numericValue !== 0) {
      setDisplayValue(formatter.format(numericValue))
    } else {
      setDisplayValue("")
    }
  }, [value, locale])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    const numericString = rawValue.replace(/[^\d]/g, "")
    if (numericString === "") {
      setDisplayValue("")
      onValueChange(0)
      return
    }

    const numericValue = Number.parseFloat(numericString) / 100
    onValueChange(numericValue)

    const formattedValue = formatter.format(numericValue)
    setDisplayValue(formattedValue)
  }

  const handleBlur = () => {
    const numericValue = typeof value === "string" ? Number.parseFloat(value) : value
    if (!isNaN(numericValue)) {
      const formattedValue = formatter.format(numericValue)
      setDisplayValue(formattedValue)
    }
  }

  return <Input type="text" value={displayValue} onChange={handleInputChange} onBlur={handleBlur} {...props} />
}

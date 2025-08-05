"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CurrencyInputProps {
  value: number
  onChange: (value: number) => void
  moedaPrincipal: "BRL" | "USD"
  placeholder?: string
  id?: string
}

export function CurrencyInput({ value, onChange, moedaPrincipal, placeholder, id }: CurrencyInputProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value)
    onChange(isNaN(value) ? 0 : value)
  }

  return (
    <div className="relative">
      <Label htmlFor={id} className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        {moedaPrincipal}
      </Label>
      <Input
        id={id}
        type="number"
        value={value === 0 ? "" : value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="pl-12"
        step="0.01"
      />
    </div>
  )
}

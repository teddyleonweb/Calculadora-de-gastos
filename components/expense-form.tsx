"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Expense } from "../types/finance"

interface ExpenseFormProps {
  expense?: Expense
  onSubmit: (expense: Omit<Expense, "id" | "createdAt">) => void
  onCancel: () => void
  isLoading?: boolean
}

export default function ExpenseForm({ expense, onSubmit, onCancel, isLoading = false }: ExpenseFormProps) {
  const [description, setDescription] = useState(expense?.description || "")
  const [amount, setAmount] = useState(expense?.amount.toString() || "")
  const [category, setCategory] = useState(expense?.category || "general")
  const [date, setDate] = useState(expense?.date || new Date().toISOString().split("T")[0])
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validar campos
    if (!description.trim()) {
      setError("La descripción es requerida")
      return
    }

    const amountValue = Number.parseFloat(amount)
    if (isNaN(amountValue) || amountValue <= 0) {
      setError("El monto debe ser un número positivo")
      return
    }

    if (!category) {
      setError("La categoría es requerida")
      return
    }

    if (!date) {
      setError("La fecha es requerida")
      return
    }

    // Enviar datos
    onSubmit({
      description,
      amount: amountValue,
      category,
      date,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-100 p-3 rounded text-red-700 text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Compra de supermercado"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Monto</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoría</Label>
          <Select value={category} onValueChange={setCategory} disabled={isLoading}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="alimentacion">Alimentación</SelectItem>
              <SelectItem value="transporte">Transporte</SelectItem>
              <SelectItem value="vivienda">Vivienda</SelectItem>
              <SelectItem value="servicios">Servicios</SelectItem>
              <SelectItem value="salud">Salud</SelectItem>
              <SelectItem value="educacion">Educación</SelectItem>
              <SelectItem value="entretenimiento">Entretenimiento</SelectItem>
              <SelectItem value="ropa">Ropa</SelectItem>
              <SelectItem value="otros">Otros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Fecha</Label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={isLoading} />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Guardando..." : expense ? "Actualizar" : "Guardar"}
        </Button>
      </div>
    </form>
  )
}

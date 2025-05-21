"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import type { Income } from "../types/finance"

interface IncomeFormProps {
  income?: Income
  onSubmit: (income: Omit<Income, "id" | "createdAt">) => void
  onCancel: () => void
  isLoading?: boolean
}

export default function IncomeForm({ income, onSubmit, onCancel, isLoading = false }: IncomeFormProps) {
  const [description, setDescription] = useState(income?.description || "")
  const [amount, setAmount] = useState(income?.amount.toString() || "")
  const [category, setCategory] = useState(income?.category || "general")

  // Inicializar la fecha con la fecha actual en formato YYYY-MM-DD
  const today = new Date()
  const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`

  const [date, setDate] = useState(income?.date || defaultDate)
  const [isFixed, setIsFixed] = useState(income?.isFixed || false)
  const [frequency, setFrequency] = useState(income?.frequency || "mensual")
  const [notes, setNotes] = useState(income?.notes || "")
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
      isFixed,
      frequency: isFixed ? frequency : undefined,
      notes: notes.trim() || undefined,
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
            placeholder="Ej: Salario"
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
              <SelectItem value="salario">Salario</SelectItem>
              <SelectItem value="freelance">Freelance</SelectItem>
              <SelectItem value="inversiones">Inversiones</SelectItem>
              <SelectItem value="ventas">Ventas</SelectItem>
              <SelectItem value="alquiler">Alquiler</SelectItem>
              <SelectItem value="otros">Otros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Fecha</Label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={isLoading} />
        </div>

        <div className="space-y-2 flex items-center">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isFixed"
              checked={isFixed}
              onCheckedChange={(checked) => setIsFixed(checked as boolean)}
              disabled={isLoading}
            />
            <Label htmlFor="isFixed" className="cursor-pointer">
              Ingreso fijo
            </Label>
          </div>
        </div>

        {isFixed && (
          <div className="space-y-2">
            <Label htmlFor="frequency">Frecuencia</Label>
            <Select value={frequency} onValueChange={setFrequency} disabled={isLoading}>
              <SelectTrigger id="frequency">
                <SelectValue placeholder="Selecciona una frecuencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diario">Diario</SelectItem>
                <SelectItem value="semanal">Semanal</SelectItem>
                <SelectItem value="quincenal">Quincenal</SelectItem>
                <SelectItem value="mensual">Mensual</SelectItem>
                <SelectItem value="bimestral">Bimestral</SelectItem>
                <SelectItem value="trimestral">Trimestral</SelectItem>
                <SelectItem value="semestral">Semestral</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas (opcional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas adicionales sobre este ingreso"
          disabled={isLoading}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Guardando..." : income ? "Actualizar" : "Guardar"}
        </Button>
      </div>
    </form>
  )
}

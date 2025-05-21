"use client"

import { useState, useEffect } from "react"
import type { Income } from "../types/finance"
import { formatCurrency } from "../utils/format"
import { Pencil, Trash2 } from "lucide-react"
import { IncomeService } from "../services/income-service"
import { useAuth } from "../contexts/auth-context"
import IncomeForm from "./income-form"
import { Button } from "@/components/ui/button"

export default function IncomeList() {
  const { user } = useAuth()
  const [incomes, setIncomes] = useState<Income[]>([])
  const [sortField, setSortField] = useState<keyof Income>("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isAddingIncome, setIsAddingIncome] = useState(false)
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)

  // Cargar datos
  useEffect(() => {
    if (user) {
      loadIncomes()
    }
  }, [user])

  const loadIncomes = async () => {
    if (!user) return
    setIsLoading(true)
    setError(null)

    try {
      const incomesData = await IncomeService.getIncomes(user.id)
      setIncomes(incomesData)
    } catch (error) {
      console.error("Error al cargar ingresos:", error)
      setError("Error al cargar datos. Por favor, intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  // Manejar ingresos
  const handleAddIncome = async (income: Omit<Income, "id" | "createdAt">) => {
    if (!user) return
    setIsLoading(true)
    setError(null)

    try {
      const newIncome = await IncomeService.addIncome(user.id, income)
      if (newIncome) {
        setIncomes((prev) => [newIncome, ...prev])
        setSuccess("Ingreso añadido correctamente")
        setIsAddingIncome(false)
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (error) {
      console.error("Error al añadir ingreso:", error)
      setError("Error al añadir ingreso. Por favor, intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateIncome = async (id: string, income: Partial<Omit<Income, "id" | "createdAt">>) => {
    if (!user) return
    setIsLoading(true)
    setError(null)

    try {
      const updatedIncome = await IncomeService.updateIncome(user.id, id, income)
      if (updatedIncome) {
        setIncomes((prev) => prev.map((i) => (i.id === id ? updatedIncome : i)))
        setSuccess("Ingreso actualizado correctamente")
        setEditingIncome(null)
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (error) {
      console.error("Error al actualizar ingreso:", error)
      setError("Error al actualizar ingreso. Por favor, intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteIncome = async (id: string) => {
    if (!user) return
    if (!confirm("¿Estás seguro de que deseas eliminar este ingreso?")) return

    setIsLoading(true)
    setError(null)

    try {
      const success = await IncomeService.deleteIncome(user.id, id)
      if (success) {
        setIncomes((prev) => prev.filter((i) => i.id !== id))
        setSuccess("Ingreso eliminado correctamente")
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (error) {
      console.error("Error al eliminar ingreso:", error)
      setError("Error al eliminar ingreso. Por favor, intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  // Función para ordenar los ingresos
  const sortedIncomes = [...incomes].sort((a, b) => {
    if (sortField === "amount") {
      return sortDirection === "asc" ? a.amount - b.amount : b.amount - a.amount
    } else if (sortField === "date") {
      return sortDirection === "asc"
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime()
    } else {
      const aValue = a[sortField] || ""
      const bValue = b[sortField] || ""
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }
  })

  // Función para cambiar el campo de ordenación
  const handleSort = (field: keyof Income) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    // Dividir la fecha en partes (asumiendo formato YYYY-MM-DD)
    const parts = dateString.split("-")
    if (parts.length === 3) {
      // Crear un objeto Date con las partes (año, mes-1, día)
      // Nota: en JavaScript, los meses van de 0 a 11
      const year = Number.parseInt(parts[0], 10)
      const month = Number.parseInt(parts[1], 10) - 1
      const day = Number.parseInt(parts[2], 10)

      // Crear la fecha sin hora para evitar problemas de zona horaria
      const date = new Date(year, month, day)

      return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }

    // Si el formato no es el esperado, devolver la fecha tal cual
    return dateString
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Ingresos</h2>
        <Button onClick={() => setIsAddingIncome(true)} disabled={isLoading}>
          Nuevo Ingreso
        </Button>
      </div>

      {isAddingIncome && (
        <div className="mb-6 p-4 border rounded-lg">
          <h3 className="text-lg font-medium mb-4">Nuevo Ingreso</h3>
          <IncomeForm onSubmit={handleAddIncome} onCancel={() => setIsAddingIncome(false)} isLoading={isLoading} />
        </div>
      )}

      {editingIncome && (
        <div className="mb-6 p-4 border rounded-lg">
          <h3 className="text-lg font-medium mb-4">Editar Ingreso</h3>
          <IncomeForm
            income={editingIncome}
            onSubmit={(data) => handleUpdateIncome(editingIncome.id, data)}
            onCancel={() => setEditingIncome(null)}
            isLoading={isLoading}
          />
        </div>
      )}

      {error && <div className="bg-red-100 p-3 rounded text-red-700 mb-4">{error}</div>}
      {success && <div className="bg-green-100 p-3 rounded text-green-700 mb-4">{success}</div>}

      {isLoading && !isAddingIncome && !editingIncome ? (
        <div className="text-center py-4">Cargando...</div>
      ) : (
        <div className="overflow-x-auto">
          {incomes.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No hay ingresos registrados.</div>
          ) : (
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-4 text-left cursor-pointer" onClick={() => handleSort("description")}>
                    Descripción {sortField === "description" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="py-3 px-4 text-left cursor-pointer" onClick={() => handleSort("amount")}>
                    Monto {sortField === "amount" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="py-3 px-4 text-left cursor-pointer" onClick={() => handleSort("category")}>
                    Categoría {sortField === "category" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="py-3 px-4 text-left cursor-pointer" onClick={() => handleSort("date")}>
                    Fecha {sortField === "date" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="py-3 px-4 text-center">Fijo</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm">
                {sortedIncomes.map((income) => (
                  <tr key={income.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4">{income.description}</td>
                    <td className="py-3 px-4">{formatCurrency(income.amount)}</td>
                    <td className="py-3 px-4">{income.category}</td>
                    <td className="py-3 px-4">{formatDate(income.date)}</td>
                    <td className="py-3 px-4 text-center">
                      {income.isFixed ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {income.frequency || "Mensual"}
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">No</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => setEditingIncome(income)}
                          className="text-blue-500 hover:text-blue-700"
                          aria-label="Editar"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteIncome(income.id)}
                          className="text-red-500 hover:text-red-700"
                          aria-label="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import type { Expense } from "../types/finance"
import { formatCurrency } from "../utils/format"
import { Pencil, Trash2 } from "lucide-react"

interface ExpenseListProps {
  expenses: Expense[]
  onEdit: (expense: Expense) => void
  onDelete: (id: string) => void
}

export default function ExpenseList({ expenses, onEdit, onDelete }: ExpenseListProps) {
  const [sortField, setSortField] = useState<keyof Expense>("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Función para ordenar los gastos
  const sortedExpenses = [...expenses].sort((a, b) => {
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
  const handleSort = (field: keyof Expense) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="overflow-x-auto">
      {expenses.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No hay egresos registrados.</div>
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
              <th className="py-3 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm">
            {sortedExpenses.map((expense) => (
              <tr key={expense.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-4">{expense.description}</td>
                <td className="py-3 px-4">{formatCurrency(expense.amount)}</td>
                <td className="py-3 px-4">{expense.category}</td>
                <td className="py-3 px-4">{formatDate(expense.date)}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => onEdit(expense)}
                      className="text-blue-500 hover:text-blue-700"
                      aria-label="Editar"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => onDelete(expense.id)}
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
  )
}

"use client"

import { useState } from "react"
import type { Income } from "../types/finance"
import { formatCurrency } from "../utils/format"
import { Pencil, Trash2 } from "lucide-react"

interface IncomeListProps {
  incomes: Income[]
  onEdit: (income: Income) => void
  onDelete: (id: string) => void
}

export default function IncomeList({ incomes, onEdit, onDelete }: IncomeListProps) {
  const [sortField, setSortField] = useState<keyof Income>("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Función para ordenar los ingresos
  const sortedIncomes = [...incomes].sort((a, b) => {
    if (sortField === "amount") {
      return sortDirection === "asc" ? a.amount - b.amount : b.amount - a.amount
    } else if (sortField === "date") {
      return sortDirection === "asc"
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime()
    } else if (sortField === "isFixed") {
      return sortDirection === "asc" ? (a.isFixed ? 1 : -1) : a.isFixed ? -1 : 1
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
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
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
              <th className="py-3 px-4 text-center cursor-pointer" onClick={() => handleSort("isFixed")}>
                Fijo {sortField === "isFixed" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th className="py-3 px-4 text-left">Frecuencia</th>
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
                    <span className="bg-green-100 text-green-800 py-1 px-2 rounded-full text-xs">Sí</span>
                  ) : (
                    <span className="bg-gray-100 text-gray-800 py-1 px-2 rounded-full text-xs">No</span>
                  )}
                </td>
                <td className="py-3 px-4">{income.frequency || "N/A"}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => onEdit(income)}
                      className="text-blue-500 hover:text-blue-700"
                      aria-label="Editar"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => onDelete(income.id)}
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

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ExpenseService } from "@/services/expense-service"
import { useAuth } from "@/contexts/auth-context"
import ExpenseForm from "./expense-form"
import type { Expense } from "@/types"
import { Edit, Trash2, Plus } from "lucide-react"

export default function ExpenseList() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const loadExpenses = async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      const data = await ExpenseService.getExpenses(user.id)
      setExpenses(data)
    } catch (error) {
      console.error("Error al cargar egresos:", error)
      setError("Error al cargar egresos. Por favor, intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadExpenses()
  }, [user])

  const handleDelete = async (id: string) => {
    if (!user || !window.confirm("¿Estás seguro de que deseas eliminar este egreso?")) return

    try {
      const success = await ExpenseService.deleteExpense(user.id, id)
      if (success) {
        setExpenses((prev) => prev.filter((expense) => expense.id !== id))
      } else {
        setError("Error al eliminar egreso")
      }
    } catch (error) {
      console.error("Error al eliminar egreso:", error)
      setError("Error al eliminar egreso")
    }
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setIsDialogOpen(true)
  }

  const handleFormSuccess = () => {
    loadExpenses()
    setIsDialogOpen(false)
    setEditingExpense(null)
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

  // Función para obtener el color de la categoría
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      general: "bg-gray-100 text-gray-800",
      alimentacion: "bg-green-100 text-green-800",
      transporte: "bg-blue-100 text-blue-800",
      vivienda: "bg-yellow-100 text-yellow-800",
      servicios: "bg-purple-100 text-purple-800",
      salud: "bg-red-100 text-red-800",
      educacion: "bg-indigo-100 text-indigo-800",
      entretenimiento: "bg-pink-100 text-pink-800",
      otros: "bg-orange-100 text-orange-800",
    }
    return colors[category] || "bg-gray-100 text-gray-800"
  }

  // Función para formatear el nombre de la categoría
  const formatCategory = (category: string) => {
    const names: Record<string, string> = {
      general: "General",
      alimentacion: "Alimentación",
      transporte: "Transporte",
      vivienda: "Vivienda",
      servicios: "Servicios",
      salud: "Salud",
      educacion: "Educación",
      entretenimiento: "Entretenimiento",
      otros: "Otros",
    }
    return names[category] || category
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Egresos</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingExpense(null)}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Egreso
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingExpense ? "Editar Egreso" : "Nuevo Egreso"}</DialogTitle>
            </DialogHeader>
            <ExpenseForm
              onSuccess={handleFormSuccess}
              initialData={editingExpense || undefined}
              isEditing={!!editingExpense}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Cargando egresos...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={loadExpenses} className="mt-2">
            Reintentar
          </Button>
        </div>
      ) : expenses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No hay egresos registrados.</p>
            <p className="text-sm text-gray-400 mt-1">Haz clic en "Nuevo Egreso" para añadir uno.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {expenses.map((expense) => (
            <Card key={expense.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{expense.description}</h3>
                    <div className="flex items-center mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(expense.category)}`}>
                        {formatCategory(expense.category)}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">{formatDate(expense.date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="font-bold text-red-600 mr-4">${expense.amount.toFixed(2)}</span>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(expense)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

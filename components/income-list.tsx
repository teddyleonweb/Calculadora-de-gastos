"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { IncomeService } from "@/services/income-service"
import { useAuth } from "@/contexts/auth-context"
import IncomeForm from "./income-form"
import type { Income } from "@/types"
import { Edit, Trash2, Plus, Calendar, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function IncomeList() {
  const { user } = useAuth()
  const [incomes, setIncomes] = useState<Income[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const loadIncomes = async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      const data = await IncomeService.getIncomes(user.id)
      setIncomes(data)
    } catch (error) {
      console.error("Error al cargar ingresos:", error)
      setError("Error al cargar ingresos. Por favor, intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadIncomes()
  }, [user])

  const handleDelete = async (id: string) => {
    if (!user || !window.confirm("¿Estás seguro de que deseas eliminar este ingreso?")) return

    try {
      const success = await IncomeService.deleteIncome(user.id, id)
      if (success) {
        setIncomes((prev) => prev.filter((income) => income.id !== id))
      } else {
        setError("Error al eliminar ingreso")
      }
    } catch (error) {
      console.error("Error al eliminar ingreso:", error)
      setError("Error al eliminar ingreso")
    }
  }

  const handleEdit = (income: Income) => {
    setEditingIncome(income)
    setIsDialogOpen(true)
  }

  const handleFormSuccess = () => {
    loadIncomes()
    setIsDialogOpen(false)
    setEditingIncome(null)
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
      salario: "bg-green-100 text-green-800",
      freelance: "bg-blue-100 text-blue-800",
      inversiones: "bg-yellow-100 text-yellow-800",
      ventas: "bg-purple-100 text-purple-800",
      otros: "bg-orange-100 text-orange-800",
    }
    return colors[category] || "bg-gray-100 text-gray-800"
  }

  // Función para formatear el nombre de la categoría
  const formatCategory = (category: string) => {
    const names: Record<string, string> = {
      general: "General",
      salario: "Salario",
      freelance: "Freelance",
      inversiones: "Inversiones",
      ventas: "Ventas",
      otros: "Otros",
    }
    return names[category] || category
  }

  // Función para formatear la frecuencia
  const formatFrequency = (frequency: string | undefined) => {
    if (!frequency) return ""

    const names: Record<string, string> = {
      diario: "Diario",
      semanal: "Semanal",
      quincenal: "Quincenal",
      mensual: "Mensual",
      bimestral: "Bimestral",
      trimestral: "Trimestral",
      semestral: "Semestral",
      anual: "Anual",
    }
    return names[frequency] || frequency
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Ingresos</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingIncome(null)}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Ingreso
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingIncome ? "Editar Ingreso" : "Nuevo Ingreso"}</DialogTitle>
            </DialogHeader>
            <IncomeForm
              onSuccess={handleFormSuccess}
              initialData={editingIncome || undefined}
              isEditing={!!editingIncome}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Cargando ingresos...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={loadIncomes} className="mt-2">
            Reintentar
          </Button>
        </div>
      ) : incomes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No hay ingresos registrados.</p>
            <p className="text-sm text-gray-400 mt-1">Haz clic en "Nuevo Ingreso" para añadir uno.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {incomes.map((income) => (
            <Card key={income.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{income.description}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(income.category)}`}>
                        {formatCategory(income.category)}
                      </span>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(income.date)}
                      </div>
                      {income.isFixed && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <RefreshCw className="h-3 w-3" />
                          {formatFrequency(income.frequency)}
                        </Badge>
                      )}
                    </div>
                    {income.notes && <p className="text-sm text-gray-500 mt-2">{income.notes}</p>}
                  </div>
                  <div className="flex items-center">
                    <span className="font-bold text-green-600 mr-4">${income.amount.toFixed(2)}</span>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(income)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(income.id)}>
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

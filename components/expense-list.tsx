"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { ExpenseService } from "@/services/expense-service"
import { ProductService } from "@/services/product-service"
import { formatCurrency } from "@/utils/format"
import { Trash2, Edit, Plus, RefreshCw, ShoppingBag } from "lucide-react"
import ExpenseForm from "./expense-form"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function ExpenseList() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingExpense, setIsAddingExpense] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Estado para controlar si se muestran los gastos de tiendas
  const [showStoreExpenses, setShowStoreExpenses] = useState(() => {
    // Recuperar preferencia del usuario del localStorage
    const saved = localStorage.getItem("showStoreExpenses")
    return saved ? JSON.parse(saved) : false
  })

  // Estado para los productos/gastos de tiendas
  const [storeProducts, setStoreProducts] = useState<any[]>([])
  const [isLoadingStoreProducts, setIsLoadingStoreProducts] = useState(false)
  const [storeExpensesTotal, setStoreExpensesTotal] = useState(0)

  // Cargar los gastos al montar el componente
  useEffect(() => {
    if (user) {
      loadExpenses()
    }
  }, [user])

  // Cargar los productos/gastos de tiendas cuando se activa la opción
  useEffect(() => {
    // Guardar preferencia en localStorage
    localStorage.setItem("showStoreExpenses", JSON.stringify(showStoreExpenses))

    if (showStoreExpenses && user) {
      loadStoreProducts()
    }
  }, [showStoreExpenses, user])

  // Función para cargar los gastos
  const loadExpenses = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const data = await ExpenseService.getExpenses(user.id)
      setExpenses(data)
    } catch (error) {
      console.error("Error al cargar los gastos:", error)
      setErrorMessage("Error al cargar los gastos. Por favor, intenta de nuevo.")
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  // Función para cargar los productos/gastos de tiendas
  const loadStoreProducts = async () => {
    if (!user) return

    try {
      setIsLoadingStoreProducts(true)
      const products = await ProductService.getProductsForExpenses(user.id)

      setStoreProducts(products)

      // Calcular el total de gastos en tiendas
      const total = products.reduce((sum, product) => {
        return sum + product.price * product.quantity
      }, 0)

      setStoreExpensesTotal(total)
    } catch (error) {
      console.error("Error al cargar los productos de tiendas:", error)
    } finally {
      setIsLoadingStoreProducts(false)
    }
  }

  // Función para añadir un gasto
  const handleAddExpense = async (expenseData: any) => {
    if (!user) return

    try {
      setIsLoading(true)
      await ExpenseService.addExpense(user.id, expenseData)

      // Recargar los gastos
      await loadExpenses()

      setIsAddingExpense(false)
      setSuccessMessage("Gasto añadido correctamente")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Error al añadir el gasto:", error)
      setErrorMessage("Error al añadir el gasto. Por favor, intenta de nuevo.")
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  // Función para editar un gasto
  const handleEditExpense = async (id: string, expenseData: any) => {
    if (!user) return

    try {
      setIsLoading(true)
      await ExpenseService.updateExpense(user.id, id, expenseData)

      // Recargar los gastos
      await loadExpenses()

      setEditingExpense(null)
      setSuccessMessage("Gasto actualizado correctamente")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Error al actualizar el gasto:", error)
      setErrorMessage("Error al actualizar el gasto. Por favor, intenta de nuevo.")
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  // Función para eliminar un gasto
  const handleDeleteExpense = async (id: string) => {
    if (!user || !window.confirm("¿Estás seguro de que deseas eliminar este gasto?")) return

    try {
      setIsLoading(true)
      await ExpenseService.deleteExpense(user.id, id)

      // Recargar los gastos
      await loadExpenses()

      setSuccessMessage("Gasto eliminado correctamente")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Error al eliminar el gasto:", error)
      setErrorMessage("Error al eliminar el gasto. Por favor, intenta de nuevo.")
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  // Crear un egreso virtual para los gastos en tiendas
  const storeExpenseVirtual = showStoreExpenses
    ? {
        id: "store-expenses-virtual",
        description: "Total de gastos en tiendas",
        amount: storeExpensesTotal,
        category: "Compras",
        date: new Date().toISOString().split("T")[0], // Fecha actual
        isVirtual: true, // Marcar como virtual para identificarlo
      }
    : null

  // Combinar los egresos reales con el egreso virtual de tiendas si está activado
  const combinedExpenses = storeExpenseVirtual ? [...expenses, storeExpenseVirtual] : expenses

  // Calcular el total de gastos (ahora incluye automáticamente el gasto virtual si existe)
  const totalExpenses = combinedExpenses.reduce((total, expense) => total + Number.parseFloat(expense.amount), 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Egresos</h2>
        <div className="flex space-x-2">
          <button
            onClick={loadExpenses}
            className="flex items-center px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </button>
          <button
            onClick={() => setIsAddingExpense(true)}
            className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            disabled={isLoading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Egreso
          </button>
        </div>
      </div>

      {/* Switch para mostrar/ocultar gastos de tiendas */}
      <div className="flex items-center space-x-2">
        <Switch
          id="show-store-expenses"
          checked={showStoreExpenses}
          onCheckedChange={(checked) => {
            setShowStoreExpenses(checked)
            if (checked && storeExpensesTotal === 0) {
              // Si se activa y no hay datos cargados, cargar los datos
              loadStoreProducts()
            }
          }}
        />
        <Label htmlFor="show-store-expenses">Incluir gastos en tiendas como egreso</Label>
      </div>

      {/* Formulario para añadir/editar gastos */}
      {isAddingExpense && (
        <div className="bg-gray-50 p-4 rounded-lg border mb-4">
          <h3 className="font-semibold mb-3">Nuevo Egreso</h3>
          <ExpenseForm onSubmit={handleAddExpense} onCancel={() => setIsAddingExpense(false)} isLoading={isLoading} />
        </div>
      )}

      {editingExpense && (
        <div className="bg-gray-50 p-4 rounded-lg border mb-4">
          <h3 className="font-semibold mb-3">Editar Egreso</h3>
          <ExpenseForm
            expense={editingExpense}
            onSubmit={(data) => handleEditExpense(editingExpense.id, data)}
            onCancel={() => setEditingExpense(null)}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Lista de gastos */}
      {isLoading && !editingExpense && !isAddingExpense ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : combinedExpenses.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 border-b text-left">Fecha</th>
                <th className="py-2 px-4 border-b text-left">Descripción</th>
                <th className="py-2 px-4 border-b text-left">Categoría</th>
                <th className="py-2 px-4 border-b text-right">Monto</th>
                <th className="py-2 px-4 border-b text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {combinedExpenses.map((expense) => (
                <tr key={expense.id} className={`hover:bg-gray-50 ${expense.isVirtual ? "bg-blue-50" : ""}`}>
                  <td className="py-2 px-4 border-b">
                    {expense.isVirtual ? (
                      <span className="flex items-center text-blue-600">
                        <ShoppingBag className="w-4 h-4 mr-1" />
                        Actual
                      </span>
                    ) : (
                      new Date(expense.date).toLocaleDateString()
                    )}
                  </td>
                  <td className={`py-2 px-4 border-b ${expense.isVirtual ? "font-medium text-blue-600" : ""}`}>
                    {expense.description}
                    {expense.isVirtual && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        {storeProducts.length} productos
                      </span>
                    )}
                  </td>
                  <td className={`py-2 px-4 border-b ${expense.isVirtual ? "text-blue-600" : ""}`}>
                    {expense.category}
                  </td>
                  <td
                    className={`py-2 px-4 border-b text-right font-medium ${expense.isVirtual ? "text-blue-600" : ""}`}
                  >
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="py-2 px-4 border-b text-center">
                    {expense.isVirtual ? (
                      <button
                        onClick={loadStoreProducts}
                        className="text-blue-500 hover:text-blue-700"
                        disabled={isLoadingStoreProducts}
                      >
                        <RefreshCw className={`w-4 h-4 ${isLoadingStoreProducts ? "animate-spin" : ""}`} />
                      </button>
                    ) : (
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => setEditingExpense(expense)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="py-2 px-4 border-t font-semibold text-right">
                  Total de Egresos:
                </td>
                <td className="py-2 px-4 border-t text-right font-bold">{formatCurrency(totalExpenses)}</td>
                <td className="py-2 px-4 border-t"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No hay egresos registrados.</p>
          <button
            onClick={() => setIsAddingExpense(true)}
            className="mt-2 inline-flex items-center px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Añadir Egreso
          </button>
        </div>
      )}

      {/* Mensajes de éxito y error */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-md">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md">
          {errorMessage}
        </div>
      )}
    </div>
  )
}

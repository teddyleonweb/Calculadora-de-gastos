"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/auth-context"
import type { Expense, Income, FinanceTab } from "../types/finance"
import { ExpenseService } from "../services/expense-service"
import { IncomeService } from "../services/income-service"
import { ProductService } from "../services/product-service" // Añadir este import
import ExpenseForm from "./expense-form"
import IncomeForm from "./income-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Trash2, Edit, DollarSign, ArrowDownCircle, ArrowUpCircle, ShoppingBag } from "lucide-react"
import { formatCurrency } from "../utils/format"
import { Switch } from "@/components/ui/switch" // Añadir este import
import { Label } from "@/components/ui/label" // Añadir este import

export default function FinanceManager() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [incomes, setIncomes] = useState<Income[]>([])
  const [activeTab, setActiveTab] = useState<FinanceTab>("expenses")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isAddingExpense, setIsAddingExpense] = useState(false)
  const [isAddingIncome, setIsAddingIncome] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)
  const [showStoreExpenses, setShowStoreExpenses] = useState(() => {
    // Recuperar preferencia del usuario del localStorage
    const saved = localStorage.getItem("showStoreExpenses")
    return saved ? JSON.parse(saved) : false
  })
  const [storeProducts, setStoreProducts] = useState<any[]>([])
  const [isLoadingStoreProducts, setIsLoadingStoreProducts] = useState(false)
  const [storeExpensesTotal, setStoreExpensesTotal] = useState(0)

  // Cargar datos
  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user) return
    setIsLoading(true)
    setError(null)

    try {
      // Cargar egresos
      const expensesData = await ExpenseService.getExpenses(user.id)
      setExpenses(expensesData)

      // Cargar ingresos
      const incomesData = await IncomeService.getIncomes(user.id)
      setIncomes(incomesData)
    } catch (error) {
      console.error("Error al cargar datos financieros:", error)
      setError("Error al cargar datos. Por favor, intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

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

  // Cargar los productos/gastos de tiendas cuando se activa la opción
  useEffect(() => {
    // Guardar preferencia en localStorage
    localStorage.setItem("showStoreExpenses", JSON.stringify(showStoreExpenses))

    if (showStoreExpenses && user) {
      loadStoreProducts()
    }
  }, [showStoreExpenses, user])

  // Manejar egresos
  const handleAddExpense = async (expense: Omit<Expense, "id" | "createdAt">) => {
    if (!user) return
    setIsLoading(true)
    setError(null)

    try {
      const newExpense = await ExpenseService.addExpense(user.id, expense)
      if (newExpense) {
        setExpenses((prev) => [newExpense, ...prev])
        setSuccess("Egreso añadido correctamente")
        setIsAddingExpense(false)
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (error) {
      console.error("Error al añadir egreso:", error)
      setError("Error al añadir egreso. Por favor, intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateExpense = async (id: string, expense: Partial<Omit<Expense, "id" | "createdAt">>) => {
    if (!user) return
    setIsLoading(true)
    setError(null)

    try {
      const updatedExpense = await ExpenseService.updateExpense(user.id, id, expense)
      if (updatedExpense) {
        setExpenses((prev) => prev.map((e) => (e.id === id ? updatedExpense : e)))
        setSuccess("Egreso actualizado correctamente")
        setEditingExpense(null)
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (error) {
      console.error("Error al actualizar egreso:", error)
      setError("Error al actualizar egreso. Por favor, intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteExpense = async (id: string) => {
    if (!user) return
    if (!confirm("¿Estás seguro de que deseas eliminar este egreso?")) return

    setIsLoading(true)
    setError(null)

    try {
      const success = await ExpenseService.deleteExpense(user.id, id)
      if (success) {
        setExpenses((prev) => prev.filter((e) => e.id !== id))
        setSuccess("Egreso eliminado correctamente")
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (error) {
      console.error("Error al eliminar egreso:", error)
      setError("Error al eliminar egreso. Por favor, intenta de nuevo.")
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

  // Calcular totales
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const totalWithStoreExpenses = showStoreExpenses ? totalExpenses + storeExpensesTotal : totalExpenses
  const totalIncomes = incomes.reduce((sum, income) => sum + income.amount, 0)
  const balance = totalIncomes - totalWithStoreExpenses

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      {/* Switch para mostrar/ocultar gastos de tiendas */}
      <div className="flex items-center space-x-2 mb-2">
        <Switch
          id="show-store-expenses-finance"
          checked={showStoreExpenses}
          onCheckedChange={(checked) => {
            setShowStoreExpenses(checked)
            if (checked && storeExpensesTotal === 0) {
              loadStoreProducts()
            }
          }}
        />
        <Label htmlFor="show-store-expenses-finance">Incluir gastos en tiendas</Label>
      </div>

      {/* Resumen financiero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Ingresos Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ArrowUpCircle className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-2xl font-bold text-green-600">{formatCurrency(totalIncomes)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Egresos Totales
              {showStoreExpenses && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Incluye tiendas</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ArrowDownCircle className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-2xl font-bold text-red-600">{formatCurrency(totalWithStoreExpenses)}</span>
              {showStoreExpenses && (
                <div className="ml-2 text-xs text-blue-600 flex items-center">
                  <ShoppingBag className="h-3 w-3 mr-1" />
                  {formatCurrency(storeExpensesTotal)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-blue-500 mr-2" />
              <span className={`text-2xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(balance)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pestañas de ingresos y egresos */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FinanceTab)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expenses">Egresos</TabsTrigger>
          <TabsTrigger value="incomes">Ingresos</TabsTrigger>
        </TabsList>

        {/* Contenido de egresos */}
        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Egresos</CardTitle>
                <Button onClick={() => setIsAddingExpense(true)} disabled={isLoading}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Nuevo Egreso
                </Button>
              </div>
              <CardDescription>Gestiona tus gastos y egresos</CardDescription>
            </CardHeader>
            <CardContent>
              {isAddingExpense && (
                <div className="mb-6 p-4 border rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Nuevo Egreso</h3>
                  <ExpenseForm
                    onSubmit={handleAddExpense}
                    onCancel={() => setIsAddingExpense(false)}
                    isLoading={isLoading}
                  />
                </div>
              )}

              {editingExpense && (
                <div className="mb-6 p-4 border rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Editar Egreso</h3>
                  <ExpenseForm
                    expense={editingExpense}
                    onSubmit={(data) => handleUpdateExpense(editingExpense.id, data)}
                    onCancel={() => setEditingExpense(null)}
                    isLoading={isLoading}
                  />
                </div>
              )}

              {error && <div className="bg-red-100 p-3 rounded text-red-700 mb-4">{error}</div>}
              {success && <div className="bg-green-100 p-3 rounded text-green-700 mb-4">{success}</div>}

              {isLoading && !isAddingExpense && !editingExpense ? (
                <div className="text-center py-4">Cargando...</div>
              ) : expenses.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No hay egresos registrados</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Descripción</th>
                        <th className="text-left py-2">Categoría</th>
                        <th className="text-left py-2">Fecha</th>
                        <th className="text-right py-2">Monto</th>
                        <th className="text-right py-2">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((expense) => (
                        <tr key={expense.id} className="border-b hover:bg-gray-50">
                          <td className="py-2">{expense.description}</td>
                          <td className="py-2">
                            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{expense.category}</span>
                          </td>
                          <td className="py-2">{formatDate(expense.date)}</td>
                          <td className="py-2 text-right font-medium text-red-600">{formatCurrency(expense.amount)}</td>
                          <td className="py-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingExpense(expense)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="h-8 w-8 p-0 text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contenido de ingresos */}
        <TabsContent value="incomes">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Ingresos</CardTitle>
                <Button onClick={() => setIsAddingIncome(true)} disabled={isLoading}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Nuevo Ingreso
                </Button>
              </div>
              <CardDescription>Gestiona tus ingresos y entradas de dinero</CardDescription>
            </CardHeader>
            <CardContent>
              {isAddingIncome && (
                <div className="mb-6 p-4 border rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Nuevo Ingreso</h3>
                  <IncomeForm
                    onSubmit={handleAddIncome}
                    onCancel={() => setIsAddingIncome(false)}
                    isLoading={isLoading}
                  />
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
              ) : incomes.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No hay ingresos registrados</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Descripción</th>
                        <th className="text-left py-2">Categoría</th>
                        <th className="text-left py-2">Fecha</th>
                        <th className="text-center py-2">Fijo</th>
                        <th className="text-right py-2">Monto</th>
                        <th className="text-right py-2">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incomes.map((income) => (
                        <tr key={income.id} className="border-b hover:bg-gray-50">
                          <td className="py-2">{income.description}</td>
                          <td className="py-2">
                            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{income.category}</span>
                          </td>
                          <td className="py-2">{formatDate(income.date)}</td>
                          <td className="py-2 text-center">
                            {income.isFixed ? (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {income.frequency || "Mensual"}
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">No</span>
                            )}
                          </td>
                          <td className="py-2 text-right font-medium text-green-600">
                            {formatCurrency(income.amount)}
                          </td>
                          <td className="py-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingIncome(income)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteIncome(income.id)}
                              className="h-8 w-8 p-0 text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

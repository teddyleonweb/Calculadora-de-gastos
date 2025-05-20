"use client"

import { useState, useEffect } from "react"
import type { Expense, Income, FinanceTab } from "../types/finance"
import { getExpenses, addExpense, updateExpense, deleteExpense } from "../services/expense-service"
import { getIncomes, addIncome, updateIncome, deleteIncome } from "../services/income-service"
import ExpenseList from "./expense-list"
import IncomeList from "./income-list"
import ExpenseForm from "./expense-form"
import IncomeForm from "./income-form"
import { formatCurrency } from "../utils/format"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, DollarSign, TrendingUp, TrendingDown } from "lucide-react"

export default function FinanceManager() {
  const [activeTab, setActiveTab] = useState<FinanceTab>("expenses")
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [incomes, setIncomes] = useState<Income[]>([])
  const [isAddingExpense, setIsAddingExpense] = useState(false)
  const [isAddingIncome, setIsAddingIncome] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [expensesData, incomesData] = await Promise.all([getExpenses(), getIncomes()])
        setExpenses(expensesData)
        setIncomes(incomesData)
      } catch (err) {
        console.error("Error al cargar datos financieros:", err)
        setError("Error al cargar datos financieros. Por favor, intenta de nuevo.")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Calcular totales
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const totalIncomes = incomes.reduce((sum, income) => sum + income.amount, 0)
  const balance = totalIncomes - totalExpenses

  // Manejadores para egresos
  const handleAddExpense = async (expense: Omit<Expense, "id" | "createdAt">) => {
    try {
      const newExpense = await addExpense(expense)
      setExpenses([...expenses, newExpense])
      setIsAddingExpense(false)
    } catch (err) {
      console.error("Error al añadir egreso:", err)
      setError("Error al añadir egreso. Por favor, intenta de nuevo.")
    }
  }

  const handleUpdateExpense = async (expense: Expense) => {
    try {
      const updatedExpense = await updateExpense(expense)
      setExpenses(expenses.map((e) => (e.id === updatedExpense.id ? updatedExpense : e)))
      setEditingExpense(null)
    } catch (err) {
      console.error("Error al actualizar egreso:", err)
      setError("Error al actualizar egreso. Por favor, intenta de nuevo.")
    }
  }

  const handleDeleteExpense = async (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este egreso?")) {
      try {
        await deleteExpense(id)
        setExpenses(expenses.filter((e) => e.id !== id))
      } catch (err) {
        console.error("Error al eliminar egreso:", err)
        setError("Error al eliminar egreso. Por favor, intenta de nuevo.")
      }
    }
  }

  // Manejadores para ingresos
  const handleAddIncome = async (income: Omit<Income, "id" | "createdAt">) => {
    try {
      const newIncome = await addIncome(income)
      setIncomes([...incomes, newIncome])
      setIsAddingIncome(false)
    } catch (err) {
      console.error("Error al añadir ingreso:", err)
      setError("Error al añadir ingreso. Por favor, intenta de nuevo.")
    }
  }

  const handleUpdateIncome = async (income: Income) => {
    try {
      const updatedIncome = await updateIncome(income)
      setIncomes(incomes.map((i) => (i.id === updatedIncome.id ? updatedIncome : i)))
      setEditingIncome(null)
    } catch (err) {
      console.error("Error al actualizar ingreso:", err)
      setError("Error al actualizar ingreso. Por favor, intenta de nuevo.")
    }
  }

  const handleDeleteIncome = async (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este ingreso?")) {
      try {
        await deleteIncome(id)
        setIncomes(incomes.filter((i) => i.id !== id))
      } catch (err) {
        console.error("Error al eliminar ingreso:", err)
        setError("Error al eliminar ingreso. Por favor, intenta de nuevo.")
      }
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Gestión Financiera</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}

      {/* Resumen financiero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalIncomes)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Egresos Totales</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(balance)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pestañas para egresos e ingresos */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FinanceTab)}>
        <TabsList className="mb-4">
          <TabsTrigger value="expenses">Egresos</TabsTrigger>
          <TabsTrigger value="incomes">Ingresos</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Egresos</CardTitle>
                <Button onClick={() => setIsAddingExpense(true)} disabled={isAddingExpense}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Añadir Egreso
                </Button>
              </div>
              <CardDescription>Gestiona tus egresos y gastos</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Cargando egresos...</div>
              ) : isAddingExpense ? (
                <ExpenseForm onSubmit={handleAddExpense} onCancel={() => setIsAddingExpense(false)} />
              ) : editingExpense ? (
                <ExpenseForm
                  expense={editingExpense}
                  onSubmit={handleUpdateExpense}
                  onCancel={() => setEditingExpense(null)}
                />
              ) : (
                <ExpenseList expenses={expenses} onEdit={setEditingExpense} onDelete={handleDeleteExpense} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incomes">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Ingresos</CardTitle>
                <Button onClick={() => setIsAddingIncome(true)} disabled={isAddingIncome}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Añadir Ingreso
                </Button>
              </div>
              <CardDescription>Gestiona tus ingresos y fuentes de dinero</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Cargando ingresos...</div>
              ) : isAddingIncome ? (
                <IncomeForm onSubmit={handleAddIncome} onCancel={() => setIsAddingIncome(false)} />
              ) : editingIncome ? (
                <IncomeForm
                  income={editingIncome}
                  onSubmit={handleUpdateIncome}
                  onCancel={() => setEditingIncome(null)}
                />
              ) : (
                <IncomeList incomes={incomes} onEdit={setEditingIncome} onDelete={handleDeleteIncome} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

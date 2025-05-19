"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { type Expense, EXPENSE_CATEGORIES } from "../types"
import { ExpenseService } from "../services/expense-service"
import { useAuth } from "../contexts/auth-context"
import { Bar, Pie } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js"
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Calendar, DollarSign } from "lucide-react"

// Registrar los componentes necesarios de Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

export default function ExpensesManager() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({})
  const [filterMonth, setFilterMonth] = useState<string>("")
  const [filterCategory, setFilterCategory] = useState<string>("")

  // Estados para el formulario
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0])
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])

  // Cargar los egresos al montar el componente
  useEffect(() => {
    if (user) {
      loadExpenses()
    }
  }, [user])

  // Función para cargar los egresos
  const loadExpenses = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const expenses = await ExpenseService.getExpenses(user.id)
      setExpenses(expenses)
    } catch (error) {
      console.error("Error al cargar egresos:", error)
      setErrorMessage("Error al cargar egresos. Por favor, intenta de nuevo.")
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  // Función para añadir un nuevo egreso
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setIsLoading(true)

      const amountValue = Number.parseFloat(amount)
      if (isNaN(amountValue) || amountValue <= 0) {
        setErrorMessage("El monto debe ser un número positivo")
        setTimeout(() => setErrorMessage(null), 5000)
        return
      }

      const newExpense: Omit<Expense, "id"> = {
        description,
        amount: amountValue,
        category,
        date,
        userId: user.id,
        createdAt: new Date().toISOString(),
      }

      await ExpenseService.addExpense(user.id, newExpense)

      // Limpiar el formulario
      setDescription("")
      setAmount("")
      setCategory(EXPENSE_CATEGORIES[0])
      setDate(new Date().toISOString().split("T")[0])

      // Ocultar el formulario
      setShowAddForm(false)

      // Mostrar mensaje de éxito
      setSuccessMessage("Egreso añadido correctamente")
      setTimeout(() => setSuccessMessage(null), 3000)

      // Recargar los egresos
      loadExpenses()
    } catch (error) {
      console.error("Error al añadir egreso:", error)
      setErrorMessage("Error al añadir egreso. Por favor, intenta de nuevo.")
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  // Función para actualizar un egreso
  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !editingExpenseId) return

    try {
      setIsLoading(true)

      const amountValue = Number.parseFloat(amount)
      if (isNaN(amountValue) || amountValue <= 0) {
        setErrorMessage("El monto debe ser un número positivo")
        setTimeout(() => setErrorMessage(null), 5000)
        return
      }

      const updatedExpense: Partial<Expense> = {
        description,
        amount: amountValue,
        category,
        date,
      }

      const success = await ExpenseService.updateExpense(user.id, editingExpenseId, updatedExpense)

      if (success) {
        // Limpiar el formulario
        setDescription("")
        setAmount("")
        setCategory(EXPENSE_CATEGORIES[0])
        setDate(new Date().toISOString().split("T")[0])

        // Salir del modo edición
        setEditingExpenseId(null)

        // Mostrar mensaje de éxito
        setSuccessMessage("Egreso actualizado correctamente")
        setTimeout(() => setSuccessMessage(null), 3000)

        // Recargar los egresos
        loadExpenses()
      } else {
        setErrorMessage("No se pudo actualizar el egreso")
        setTimeout(() => setErrorMessage(null), 5000)
      }
    } catch (error) {
      console.error("Error al actualizar egreso:", error)
      setErrorMessage("Error al actualizar egreso. Por favor, intenta de nuevo.")
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  // Función para eliminar un egreso
  const handleDeleteExpense = async (expenseId: string) => {
    if (!user) return

    if (!confirm("¿Estás seguro de que deseas eliminar este egreso?")) {
      return
    }

    try {
      setIsLoading(true)

      const success = await ExpenseService.deleteExpense(user.id, expenseId)

      if (success) {
        // Mostrar mensaje de éxito
        setSuccessMessage("Egreso eliminado correctamente")
        setTimeout(() => setSuccessMessage(null), 3000)

        // Recargar los egresos
        loadExpenses()
      } else {
        setErrorMessage("No se pudo eliminar el egreso")
        setTimeout(() => setErrorMessage(null), 5000)
      }
    } catch (error) {
      console.error("Error al eliminar egreso:", error)
      setErrorMessage("Error al eliminar egreso. Por favor, intenta de nuevo.")
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  // Función para editar un egreso
  const handleEditExpense = (expense: Expense) => {
    setDescription(expense.description)
    setAmount(expense.amount.toString())
    setCategory(expense.category)
    setDate(expense.date)
    setEditingExpenseId(expense.id)
    setShowAddForm(true)
  }

  // Función para alternar la expansión de una categoría
  const toggleCategoryExpansion = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  // Filtrar los egresos según los filtros aplicados
  const filteredExpenses = expenses.filter((expense) => {
    let passesMonthFilter = true
    let passesCategoryFilter = true

    if (filterMonth) {
      const expenseMonth = expense.date.substring(0, 7) // YYYY-MM
      passesMonthFilter = expenseMonth === filterMonth
    }

    if (filterCategory) {
      passesCategoryFilter = expense.category === filterCategory
    }

    return passesMonthFilter && passesCategoryFilter
  })

  // Agrupar los egresos por categoría
  const expensesByCategory: { [key: string]: Expense[] } = {}
  filteredExpenses.forEach((expense) => {
    if (!expensesByCategory[expense.category]) {
      expensesByCategory[expense.category] = []
    }
    expensesByCategory[expense.category].push(expense)
  })

  // Calcular el total por categoría
  const totalByCategory: { [key: string]: number } = {}
  Object.keys(expensesByCategory).forEach((category) => {
    totalByCategory[category] = expensesByCategory[category].reduce((sum, expense) => sum + expense.amount, 0)
  })

  // Calcular el total general
  const totalExpenses = Object.values(totalByCategory).reduce((sum, total) => sum + total, 0)

  // Preparar datos para la gráfica de barras
  const barChartData = {
    labels: Object.keys(totalByCategory),
    datasets: [
      {
        label: "Egresos por Categoría ($)",
        data: Object.values(totalByCategory),
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)",
          "rgba(201, 203, 207, 0.6)",
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
          "rgba(201, 203, 207, 1)",
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
        ],
        borderWidth: 1,
      },
    ],
  }

  // Opciones para la gráfica de barras
  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Egresos por Categoría",
        font: {
          size: 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => `$${value.toFixed(2)}`,
        },
      },
    },
  }

  // Preparar datos para la gráfica de pastel
  const pieChartData = {
    labels: Object.keys(totalByCategory),
    datasets: [
      {
        label: "Egresos por Categoría",
        data: Object.values(totalByCategory),
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)",
          "rgba(201, 203, 207, 0.6)",
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
          "rgba(201, 203, 207, 1)",
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
        ],
        borderWidth: 1,
      },
    ],
  }

  // Opciones para la gráfica de pastel
  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Distribución de Egresos",
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || ""
            const value = context.raw || 0
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = Math.round((value / total) * 100)
            return `${label}: $${value.toFixed(2)} (${percentage}%)`
          },
        },
      },
    },
  }

  // Obtener los meses disponibles para el filtro
  const availableMonths = [...new Set(expenses.map((expense) => expense.date.substring(0, 7)))].sort()

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">Gestión de Egresos</h2>

      {/* Filtros */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por mes</label>
          <div className="flex">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los meses</option>
                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {new Date(month + "-01").toLocaleDateString("es", { year: "numeric", month: "long" })}
                  </option>
                ))}
              </select>
            </div>
            {filterMonth && (
              <button
                onClick={() => setFilterMonth("")}
                className="ml-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por categoría</label>
          <div className="flex">
            <div className="relative flex-grow">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas las categorías</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            {filterCategory && (
              <button
                onClick={() => setFilterCategory("")}
                className="ml-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Botón para añadir nuevo egreso */}
      <div className="mb-6">
        <button
          onClick={() => {
            setShowAddForm(!showAddForm)
            if (!showAddForm) {
              setEditingExpenseId(null)
              setDescription("")
              setAmount("")
              setCategory(EXPENSE_CATEGORIES[0])
              setDate(new Date().toISOString().split("T")[0])
            }
          }}
          className="flex items-center justify-center w-full md:w-auto px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          {showAddForm ? "Cancelar" : "Añadir Nuevo Egreso"}
        </button>
      </div>

      {/* Formulario para añadir/editar egreso */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium mb-4">{editingExpenseId ? "Editar Egreso" : "Añadir Nuevo Egreso"}</h3>
          <form onSubmit={editingExpenseId ? handleUpdateExpense : handleAddExpense}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Pago de alquiler"
                />
              </div>
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Monto ($)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="0.01"
                    step="0.01"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? "Procesando..." : editingExpenseId ? "Actualizar Egreso" : "Añadir Egreso"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Resumen de egresos */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Resumen de Egresos</h3>
        <p className="text-gray-700">
          <span className="font-medium">Total de egresos:</span>{" "}
          <span className="text-blue-600 font-bold">${totalExpenses.toFixed(2)}</span>
        </p>
        <p className="text-gray-700 mt-1">
          <span className="font-medium">Número de categorías:</span>{" "}
          <span className="text-blue-600 font-bold">{Object.keys(totalByCategory).length}</span>
        </p>
        {Object.keys(totalByCategory).length > 0 && (
          <p className="text-gray-700 mt-1">
            <span className="font-medium">Categoría con mayor gasto:</span>{" "}
            <span className="text-blue-600 font-bold">
              {
                Object.entries(totalByCategory).reduce(
                  (max, [category, total]) => (total > max[1] ? [category, total] : max),
                  ["", 0],
                )[0]
              }
            </span>
          </p>
        )}
      </div>

      {/* Gráficas */}
      {Object.keys(totalByCategory).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
            <Pie data={pieChartData} options={pieChartOptions} />
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 p-6 rounded-lg text-center my-6">
          <p className="text-lg text-yellow-700">No hay egresos para mostrar en las gráficas.</p>
          <p className="text-sm text-yellow-600 mt-2">Añade egresos para visualizar las estadísticas.</p>
        </div>
      )}

      {/* Lista de egresos por categoría */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Detalle de Egresos por Categoría</h3>

        {Object.keys(expensesByCategory).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(expensesByCategory).map(([category, expenses]) => (
              <div key={category} className="border border-gray-200 rounded-md overflow-hidden">
                <div
                  className="bg-gray-100 p-3 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleCategoryExpansion(category)}
                >
                  <div className="flex items-center">
                    {expandedCategories[category] ? (
                      <ChevronDown className="w-5 h-5 mr-2 text-gray-600" />
                    ) : (
                      <ChevronRight className="w-5 h-5 mr-2 text-gray-600" />
                    )}
                    <span className="font-medium">{category}</span>
                  </div>
                  <div className="font-bold text-blue-600">${totalByCategory[category].toFixed(2)}</div>
                </div>

                {expandedCategories[category] && (
                  <div className="p-3">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Descripción
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Fecha
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Monto
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {expenses.map((expense) => (
                            <tr key={expense.id} className="hover:bg-gray-50">
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                {expense.description}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                {new Date(expense.date).toLocaleDateString("es")}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                ${expense.amount.toFixed(2)}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                                <button
                                  onClick={() => handleEditExpense(expense)}
                                  className="text-blue-600 hover:text-blue-900 mr-3"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteExpense(expense.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 p-6 rounded-lg text-center">
            <p className="text-gray-700">No hay egresos que coincidan con los filtros aplicados.</p>
          </div>
        )}
      </div>

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

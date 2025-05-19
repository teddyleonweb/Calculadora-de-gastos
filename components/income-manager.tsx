"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { type Income, INCOME_CATEGORIES, INCOME_FREQUENCIES } from "../types"
import { IncomeService } from "../services/income-service"
import { useAuth } from "../contexts/auth-context"
import { Bar, Pie } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js"
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Calendar, DollarSign, Clock } from "lucide-react"

// Registrar los componentes necesarios de Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

export default function IncomeManager() {
  const { user } = useAuth()
  const [incomes, setIncomes] = useState<Income[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({})
  const [filterMonth, setFilterMonth] = useState<string>("")
  const [filterCategory, setFilterCategory] = useState<string>("")
  const [filterType, setFilterType] = useState<"all" | "fixed" | "variable">("all")

  // Estados para el formulario
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState(INCOME_CATEGORIES[0])
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [isFixed, setIsFixed] = useState(false)
  const [frequency, setFrequency] = useState(INCOME_FREQUENCIES[3]) // Mensual por defecto

  // Cargar los ingresos al montar el componente
  useEffect(() => {
    if (user) {
      loadIncomes()
    }
  }, [user])

  // Función para cargar los ingresos
  const loadIncomes = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const incomes = await IncomeService.getIncomes(user.id)
      setIncomes(incomes)
    } catch (error) {
      console.error("Error al cargar ingresos:", error)
      setErrorMessage("Error al cargar ingresos. Por favor, intenta de nuevo.")
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  // Función para añadir un nuevo ingreso
  const handleAddIncome = async (e: React.FormEvent) => {
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

      const newIncome: Omit<Income, "id"> = {
        description,
        amount: amountValue,
        category,
        date,
        userId: user.id,
        createdAt: new Date().toISOString(),
        isFixed,
        frequency: isFixed ? frequency : undefined,
      }

      await IncomeService.addIncome(user.id, newIncome)

      // Limpiar el formulario
      setDescription("")
      setAmount("")
      setCategory(INCOME_CATEGORIES[0])
      setDate(new Date().toISOString().split("T")[0])
      setIsFixed(false)
      setFrequency(INCOME_FREQUENCIES[3])

      // Ocultar el formulario
      setShowAddForm(false)

      // Mostrar mensaje de éxito
      setSuccessMessage("Ingreso añadido correctamente")
      setTimeout(() => setSuccessMessage(null), 3000)

      // Recargar los ingresos
      loadIncomes()
    } catch (error) {
      console.error("Error al añadir ingreso:", error)
      setErrorMessage("Error al añadir ingreso. Por favor, intenta de nuevo.")
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  // Función para actualizar un ingreso
  const handleUpdateIncome = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !editingIncomeId) return

    try {
      setIsLoading(true)

      const amountValue = Number.parseFloat(amount)
      if (isNaN(amountValue) || amountValue <= 0) {
        setErrorMessage("El monto debe ser un número positivo")
        setTimeout(() => setErrorMessage(null), 5000)
        return
      }

      const updatedIncome: Partial<Income> = {
        description,
        amount: amountValue,
        category,
        date,
        isFixed,
        frequency: isFixed ? frequency : undefined,
      }

      const success = await IncomeService.updateIncome(user.id, editingIncomeId, updatedIncome)

      if (success) {
        // Limpiar el formulario
        setDescription("")
        setAmount("")
        setCategory(INCOME_CATEGORIES[0])
        setDate(new Date().toISOString().split("T")[0])
        setIsFixed(false)
        setFrequency(INCOME_FREQUENCIES[3])

        // Salir del modo edición
        setEditingIncomeId(null)

        // Mostrar mensaje de éxito
        setSuccessMessage("Ingreso actualizado correctamente")
        setTimeout(() => setSuccessMessage(null), 3000)

        // Recargar los ingresos
        loadIncomes()
      } else {
        setErrorMessage("No se pudo actualizar el ingreso")
        setTimeout(() => setErrorMessage(null), 5000)
      }
    } catch (error) {
      console.error("Error al actualizar ingreso:", error)
      setErrorMessage("Error al actualizar ingreso. Por favor, intenta de nuevo.")
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  // Función para eliminar un ingreso
  const handleDeleteIncome = async (incomeId: string) => {
    if (!user) return

    if (!confirm("¿Estás seguro de que deseas eliminar este ingreso?")) {
      return
    }

    try {
      setIsLoading(true)

      const success = await IncomeService.deleteIncome(user.id, incomeId)

      if (success) {
        // Mostrar mensaje de éxito
        setSuccessMessage("Ingreso eliminado correctamente")
        setTimeout(() => setSuccessMessage(null), 3000)

        // Recargar los ingresos
        loadIncomes()
      } else {
        setErrorMessage("No se pudo eliminar el ingreso")
        setTimeout(() => setErrorMessage(null), 5000)
      }
    } catch (error) {
      console.error("Error al eliminar ingreso:", error)
      setErrorMessage("Error al eliminar ingreso. Por favor, intenta de nuevo.")
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  // Función para editar un ingreso
  const handleEditIncome = (income: Income) => {
    setDescription(income.description)
    setAmount(income.amount.toString())
    setCategory(income.category)
    setDate(income.date)
    setIsFixed(income.isFixed)
    setFrequency(income.frequency || INCOME_FREQUENCIES[3])
    setEditingIncomeId(income.id)
    setShowAddForm(true)
  }

  // Función para alternar la expansión de una categoría
  const toggleCategoryExpansion = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  // Filtrar los ingresos según los filtros aplicados
  const filteredIncomes = incomes.filter((income) => {
    let passesMonthFilter = true
    let passesCategoryFilter = true
    let passesTypeFilter = true

    if (filterMonth) {
      const incomeMonth = income.date.substring(0, 7) // YYYY-MM
      passesMonthFilter = incomeMonth === filterMonth
    }

    if (filterCategory) {
      passesCategoryFilter = income.category === filterCategory
    }

    if (filterType === "fixed") {
      passesTypeFilter = income.isFixed
    } else if (filterType === "variable") {
      passesTypeFilter = !income.isFixed
    }

    return passesMonthFilter && passesCategoryFilter && passesTypeFilter
  })

  // Agrupar los ingresos por categoría
  const incomesByCategory: { [key: string]: Income[] } = {}
  filteredIncomes.forEach((income) => {
    if (!incomesByCategory[income.category]) {
      incomesByCategory[income.category] = []
    }
    incomesByCategory[income.category].push(income)
  })

  // Calcular el total por categoría
  const totalByCategory: { [key: string]: number } = {}
  Object.keys(incomesByCategory).forEach((category) => {
    totalByCategory[category] = incomesByCategory[category].reduce((sum, income) => sum + income.amount, 0)
  })

  // Calcular el total general
  const totalIncomes = Object.values(totalByCategory).reduce((sum, total) => sum + total, 0)

  // Calcular el total de ingresos fijos y variables
  const totalFixedIncomes = filteredIncomes
    .filter((income) => income.isFixed)
    .reduce((sum, income) => sum + income.amount, 0)

  const totalVariableIncomes = filteredIncomes
    .filter((income) => !income.isFixed)
    .reduce((sum, income) => sum + income.amount, 0)

  // Preparar datos para la gráfica de barras
  const barChartData = {
    labels: Object.keys(totalByCategory),
    datasets: [
      {
        label: "Ingresos por Categoría ($)",
        data: Object.values(totalByCategory),
        backgroundColor: [
          "rgba(75, 192, 192, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)",
          "rgba(201, 203, 207, 0.6)",
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(75, 192, 192, 0.6)",
        ],
        borderColor: [
          "rgba(75, 192, 192, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
          "rgba(201, 203, 207, 1)",
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(75, 192, 192, 1)",
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
        text: "Ingresos por Categoría",
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
        label: "Ingresos por Categoría",
        data: Object.values(totalByCategory),
        backgroundColor: [
          "rgba(75, 192, 192, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)",
          "rgba(201, 203, 207, 0.6)",
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(75, 192, 192, 0.6)",
        ],
        borderColor: [
          "rgba(75, 192, 192, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
          "rgba(201, 203, 207, 1)",
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(75, 192, 192, 1)",
        ],
        borderWidth: 1,
      },
    ],
  }

  // Preparar datos para la gráfica de pastel de ingresos fijos vs variables
  const fixedVsVariablePieData = {
    labels: ["Ingresos Fijos", "Ingresos Variables"],
    datasets: [
      {
        label: "Distribución de Ingresos",
        data: [totalFixedIncomes, totalVariableIncomes],
        backgroundColor: ["rgba(54, 162, 235, 0.6)", "rgba(255, 206, 86, 0.6)"],
        borderColor: ["rgba(54, 162, 235, 1)", "rgba(255, 206, 86, 1)"],
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
        text: "Distribución de Ingresos",
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
  const availableMonths = [...new Set(incomes.map((income) => income.date.substring(0, 7)))].sort()

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">Gestión de Ingresos</h2>

      {/* Filtros de tipo de ingreso */}
      <div className="flex mb-4 overflow-x-auto">
        <button
          className={`py-1 px-3 mr-2 rounded-md ${
            filterType === "all"
              ? "bg-green-100 text-green-800 font-medium"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          onClick={() => setFilterType("all")}
        >
          Todos los ingresos
        </button>
        <button
          className={`py-1 px-3 mr-2 rounded-md flex items-center ${
            filterType === "fixed"
              ? "bg-green-100 text-green-800 font-medium"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          onClick={() => setFilterType("fixed")}
        >
          <Clock className="w-4 h-4 mr-1" />
          Ingresos fijos
        </button>
        <button
          className={`py-1 px-3 rounded-md ${
            filterType === "variable"
              ? "bg-green-100 text-green-800 font-medium"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          onClick={() => setFilterType("variable")}
        >
          Ingresos variables
        </button>
      </div>

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
                {INCOME_CATEGORIES.map((cat) => (
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

      {/* Botón para añadir nuevo ingreso */}
      <div className="mb-6">
        <button
          onClick={() => {
            setShowAddForm(!showAddForm)
            if (!showAddForm) {
              setEditingIncomeId(null)
              setDescription("")
              setAmount("")
              setCategory(INCOME_CATEGORIES[0])
              setDate(new Date().toISOString().split("T")[0])
              setIsFixed(false)
              setFrequency(INCOME_FREQUENCIES[3])
            }
          }}
          className="flex items-center justify-center w-full md:w-auto px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          {showAddForm ? "Cancelar" : "Añadir Nuevo Ingreso"}
        </button>
      </div>

      {/* Formulario para añadir/editar ingreso */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium mb-4">{editingIncomeId ? "Editar Ingreso" : "Añadir Nuevo Ingreso"}</h3>
          <form onSubmit={editingIncomeId ? handleUpdateIncome : handleAddIncome}>
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
                  placeholder="Ej: Salario mensual"
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
                  {INCOME_CATEGORIES.map((cat) => (
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
              <div className="md:col-span-2">
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="isFixed"
                    checked={isFixed}
                    onChange={(e) => setIsFixed(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isFixed" className="ml-2 block text-sm text-gray-900">
                    Es un ingreso fijo (recurrente)
                  </label>
                </div>
                {isFixed && (
                  <div>
                    <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
                      Frecuencia
                    </label>
                    <select
                      id="frequency"
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {INCOME_FREQUENCIES.map((freq) => (
                        <option key={freq} value={freq}>
                          {freq}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? "Procesando..." : editingIncomeId ? "Actualizar Ingreso" : "Añadir Ingreso"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Resumen de ingresos */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Resumen de Ingresos</h3>
        <p className="text-gray-700">
          <span className="font-medium">Total de ingresos:</span>{" "}
          <span className="text-green-600 font-bold">${totalIncomes.toFixed(2)}</span>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
          <p className="text-gray-700">
            <span className="font-medium">Ingresos fijos:</span>{" "}
            <span className="text-blue-600 font-bold">${totalFixedIncomes.toFixed(2)}</span>
            {totalIncomes > 0 && (
              <span className="text-gray-500 text-sm ml-1">
                ({Math.round((totalFixedIncomes / totalIncomes) * 100)}%)
              </span>
            )}
          </p>
          <p className="text-gray-700">
            <span className="font-medium">Ingresos variables:</span>{" "}
            <span className="text-yellow-600 font-bold">${totalVariableIncomes.toFixed(2)}</span>
            {totalIncomes > 0 && (
              <span className="text-gray-500 text-sm ml-1">
                ({Math.round((totalVariableIncomes / totalIncomes) * 100)}%)
              </span>
            )}
          </p>
        </div>
        <p className="text-gray-700 mt-2">
          <span className="font-medium">Número de categorías:</span>{" "}
          <span className="text-green-600 font-bold">{Object.keys(totalByCategory).length}</span>
        </p>
        {Object.keys(totalByCategory).length > 0 && (
          <p className="text-gray-700 mt-1">
            <span className="font-medium">Categoría con mayor ingreso:</span>{" "}
            <span className="text-green-600 font-bold">
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
          {totalFixedIncomes > 0 && totalVariableIncomes > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm md:col-span-2">
              <Pie
                data={fixedVsVariablePieData}
                options={{
                  ...pieChartOptions,
                  plugins: {
                    ...pieChartOptions.plugins,
                    title: {
                      ...pieChartOptions.plugins.title,
                      text: "Ingresos Fijos vs Variables",
                    },
                  },
                }}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-yellow-50 p-6 rounded-lg text-center my-6">
          <p className="text-lg text-yellow-700">No hay ingresos para mostrar en las gráficas.</p>
          <p className="text-sm text-yellow-600 mt-2">Añade ingresos para visualizar las estadísticas.</p>
        </div>
      )}

      {/* Lista de ingresos por categoría */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Detalle de Ingresos por Categoría</h3>

        {Object.keys(incomesByCategory).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(incomesByCategory).map(([category, incomes]) => (
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
                  <div className="font-bold text-green-600">${totalByCategory[category].toFixed(2)}</div>
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
                              className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Tipo
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
                          {incomes.map((income) => (
                            <tr key={income.id} className="hover:bg-gray-50">
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                {income.description}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                {new Date(income.date).toLocaleDateString("es")}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-center">
                                {income.isFixed ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Fijo {income.frequency && `(${income.frequency})`}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Variable
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                ${income.amount.toFixed(2)}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                                <button
                                  onClick={() => handleEditIncome(income)}
                                  className="text-blue-600 hover:text-blue-900 mr-3"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteIncome(income.id)}
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
            <p className="text-gray-700">No hay ingresos que coincidan con los filtros aplicados.</p>
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

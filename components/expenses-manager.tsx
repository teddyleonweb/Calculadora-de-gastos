"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ExpenseService } from "@/services/expense-service"
import { type Expense, EXPENSE_CATEGORIES } from "@/types"
import { format, startOfMonth, endOfMonth, isValid } from "date-fns"
import { AlertCircle, Edit, Trash2, Filter } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"

export default function ExpensesManager() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("list")

  // Estado para el formulario de nuevo egreso
  const [newExpense, setNewExpense] = useState<{
    description: string
    amount: string
    category: string
    date: string
  }>({
    description: "",
    amount: "",
    category: EXPENSE_CATEGORIES[0],
    date: format(new Date(), "yyyy-MM-dd"),
  })

  // Estado para el egreso que se está editando
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  // Estado para los filtros
  const [filters, setFilters] = useState({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
    category: "all",
  })

  // Colores para los gráficos
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FFC658", "#8DD1E1", "#A4DE6C"]

  // Cargar egresos al montar el componente
  useEffect(() => {
    loadExpenses()
  }, [])

  // Filtrar egresos cuando cambian los filtros o los egresos
  useEffect(() => {
    filterExpenses()
  }, [expenses, filters])

  // Función para cargar los egresos
  const loadExpenses = async () => {
    try {
      setLoading(true)
      const data = await ExpenseService.getExpenses()
      setExpenses(data)
      setError(null)
    } catch (err) {
      setError("Error al cargar los egresos. Por favor, intenta de nuevo.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Función para filtrar egresos
  const filterExpenses = () => {
    let filtered = [...expenses]

    // Filtrar por fecha
    if (isValid(filters.startDate)) {
      filtered = filtered.filter((expense) => new Date(expense.date) >= filters.startDate)
    }

    if (isValid(filters.endDate)) {
      filtered = filtered.filter((expense) => new Date(expense.date) <= filters.endDate)
    }

    // Filtrar por categoría
    if (filters.category !== "all") {
      filtered = filtered.filter((expense) => expense.category === filters.category)
    }

    // Ordenar por fecha (más reciente primero)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    setFilteredExpenses(filtered)
  }

  // Función para manejar el envío del formulario de nuevo egreso
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const expenseData = {
        description: newExpense.description,
        amount: Number.parseFloat(newExpense.amount),
        category: newExpense.category,
        date: newExpense.date,
      }

      if (editingExpense) {
        // Actualizar egreso existente
        await ExpenseService.updateExpense(editingExpense.id, expenseData)
      } else {
        // Crear nuevo egreso
        await ExpenseService.addExpense(expenseData)
      }

      // Resetear formulario y recargar egresos
      setNewExpense({
        description: "",
        amount: "",
        category: EXPENSE_CATEGORIES[0],
        date: format(new Date(), "yyyy-MM-dd"),
      })
      setEditingExpense(null)
      await loadExpenses()
    } catch (err) {
      setError("Error al guardar el egreso. Por favor, intenta de nuevo.")
      console.error(err)
    }
  }

  // Función para editar un egreso
  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setNewExpense({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date,
    })
  }

  // Función para eliminar un egreso
  const handleDelete = async (id: string) => {
    try {
      await ExpenseService.deleteExpense(id)
      await loadExpenses()
    } catch (err) {
      setError("Error al eliminar el egreso. Por favor, intenta de nuevo.")
      console.error(err)
    }
  }

  // Función para cancelar la edición
  const handleCancelEdit = () => {
    setEditingExpense(null)
    setNewExpense({
      description: "",
      amount: "",
      category: EXPENSE_CATEGORIES[0],
      date: format(new Date(), "yyyy-MM-dd"),
    })
  }

  // Preparar datos para el gráfico de barras (por categoría)
  const getBarChartData = () => {
    const groupedByCategory = ExpenseService.groupByCategory(filteredExpenses)
    return Object.keys(groupedByCategory).map((category) => ({
      name: category,
      amount: ExpenseService.calculateTotal(groupedByCategory[category]),
    }))
  }

  // Preparar datos para el gráfico circular (por categoría)
  const getPieChartData = () => {
    const groupedByCategory = ExpenseService.groupByCategory(filteredExpenses)
    return Object.keys(groupedByCategory).map((category) => ({
      name: category,
      value: ExpenseService.calculateTotal(groupedByCategory[category]),
    }))
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Gestión de Egresos</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="list">Lista</TabsTrigger>
              <TabsTrigger value="charts">Gráficos</TabsTrigger>
              <TabsTrigger value="new">Nuevo Egreso</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <h3 className="text-lg font-medium">Lista de Egresos</h3>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtros
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Filtrar Egresos</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="startDate">Fecha Inicio</Label>
                          <Input
                            id="startDate"
                            type="date"
                            value={format(filters.startDate, "yyyy-MM-dd")}
                            onChange={(e) => {
                              const date = e.target.value ? new Date(e.target.value) : startOfMonth(new Date())
                              setFilters({ ...filters, startDate: date })
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endDate">Fecha Fin</Label>
                          <Input
                            id="endDate"
                            type="date"
                            value={format(filters.endDate, "yyyy-MM-dd")}
                            onChange={(e) => {
                              const date = e.target.value ? new Date(e.target.value) : endOfMonth(new Date())
                              setFilters({ ...filters, endDate: date })
                            }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Categoría</Label>
                        <Select
                          value={filters.category}
                          onValueChange={(value) => setFilters({ ...filters, category: value })}
                        >
                          <SelectTrigger id="category">
                            <SelectValue placeholder="Selecciona una categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas las categorías</SelectItem>
                            {EXPENSE_CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button">Aplicar Filtros</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {loading ? (
                <p>Cargando egresos...</p>
              ) : filteredExpenses.length === 0 ? (
                <p>No hay egresos que mostrar.</p>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <div className="grid grid-cols-1 md:grid-cols-5 p-4 font-medium">
                      <div className="md:col-span-2">Descripción</div>
                      <div>Monto</div>
                      <div>Fecha</div>
                      <div>Acciones</div>
                    </div>
                    <div className="divide-y">
                      {filteredExpenses.map((expense) => (
                        <div key={expense.id} className="grid grid-cols-1 md:grid-cols-5 p-4 items-center">
                          <div className="md:col-span-2">
                            <p>{expense.description}</p>
                            <p className="text-sm text-muted-foreground">{expense.category}</p>
                          </div>
                          <div className="font-medium">${expense.amount.toFixed(2)}</div>
                          <div>{format(new Date(expense.date), "dd/MM/yyyy")}</div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="icon" onClick={() => handleEdit(expense)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="icon">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Confirmar eliminación</DialogTitle>
                                </DialogHeader>
                                <p>¿Estás seguro de que deseas eliminar este egreso?</p>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline">Cancelar</Button>
                                  </DialogClose>
                                  <DialogClose asChild>
                                    <Button variant="destructive" onClick={() => handleDelete(expense.id)}>
                                      Eliminar
                                    </Button>
                                  </DialogClose>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <p>
                      Total:{" "}
                      <span className="font-bold">${ExpenseService.calculateTotal(filteredExpenses).toFixed(2)}</span>
                    </p>
                    <p>
                      Mostrando {filteredExpenses.length} de {expenses.length} egresos
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="charts">
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium mb-4">Egresos por Categoría</h3>
                  <div className="h-[400px]">
                    <ChartContainer
                      config={{
                        amount: {
                          label: "Monto",
                          color: "hsl(var(--chart-1))",
                        },
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getBarChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend />
                          <Bar dataKey="amount" name="Monto" fill="var(--color-amount)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Distribución de Egresos</h3>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getPieChartData()}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={150}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getPieChartData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="new">
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-medium">{editingExpense ? "Editar Egreso" : "Nuevo Egreso"}</h3>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Input
                    id="description"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Monto</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    value={newExpense.category}
                    onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Fecha</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  {editingExpense && (
                    <Button type="button" variant="outline" onClick={handleCancelEdit}>
                      Cancelar
                    </Button>
                  )}
                  <Button type="submit">{editingExpense ? "Actualizar" : "Guardar"} Egreso</Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

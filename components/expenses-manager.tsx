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
import { AlertCircle, Edit, Trash2, Filter, RefreshCw, CloudOff } from "lucide-react"
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
import { toast } from "@/hooks/use-toast"

export default function ExpensesManager() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("list")
  const [refreshing, setRefreshing] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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
      setError(null)
      const data = await ExpenseService.getExpenses()
      console.log("Egresos cargados:", data)
      setExpenses(data)
    } catch (err) {
      console.error("Error al cargar egresos:", err)
      setError("Error al cargar los egresos. Por favor, intenta de nuevo.")

      // Intentar cargar desde localStorage como último recurso
      const localExpenses = ExpenseService.loadExpensesFromLocalStorage()
      if (localExpenses.length > 0) {
        setExpenses(localExpenses)
        toast({
          title: "Usando datos locales",
          description: "No se pudo conectar con el servidor. Mostrando datos guardados localmente.",
          variant: "default",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  // Función para refrescar los egresos desde la API
  const refreshExpenses = async () => {
    try {
      setRefreshing(true)
      await loadExpenses()
      toast({
        title: "Egresos actualizados",
        description: "Los egresos se han actualizado correctamente",
      })
    } catch (err) {
      console.error("Error al refrescar egresos:", err)
      toast({
        title: "Error al actualizar",
        description: "No se pudieron actualizar los egresos. Intenta de nuevo más tarde.",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
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

    if (submitting) return

    setSubmitting(true)

    try {
      const expenseData = {
        description: newExpense.description,
        amount: Number.parseFloat(newExpense.amount),
        category: newExpense.category,
        date: newExpense.date,
      }

      // Mostrar mensaje de carga
      toast({
        title: editingExpense ? "Actualizando egreso..." : "Guardando egreso...",
        description: "Por favor espera mientras procesamos tu solicitud.",
      })

      if (editingExpense) {
        // Actualizar egreso existente
        const updatedExpense = await ExpenseService.updateExpense(editingExpense.id, expenseData)

        // Actualizar el estado local con el egreso actualizado
        setExpenses((prevExpenses) =>
          prevExpenses.map((expense) => (expense.id === editingExpense.id ? updatedExpense : expense)),
        )

        toast({
          title: "Egreso actualizado",
          description: updatedExpense.id.startsWith("local-")
            ? "El egreso se ha actualizado localmente. Se sincronizará cuando te conectes."
            : "El egreso se ha actualizado correctamente",
        })

        console.log("Egreso actualizado correctamente:", updatedExpense)
      } else {
        // Crear nuevo egreso
        const newExpenseResponse = await ExpenseService.addExpense(expenseData)

        // Añadir el nuevo egreso al estado local
        setExpenses((prevExpenses) => [...prevExpenses, newExpenseResponse])

        toast({
          title: "Egreso añadido",
          description: newExpenseResponse.id.startsWith("local-")
            ? "El egreso se ha guardado localmente. Se sincronizará cuando te conectes."
            : "El nuevo egreso se ha añadido correctamente",
        })

        console.log("Nuevo egreso añadido correctamente:", newExpenseResponse)
      }

      // Resetear formulario
      setNewExpense({
        description: "",
        amount: "",
        category: EXPENSE_CATEGORIES[0],
        date: format(new Date(), "yyyy-MM-dd"),
      })
      setEditingExpense(null)

      // Cambiar a la pestaña de lista
      setActiveTab("list")
    } catch (err) {
      console.error("Error al guardar egreso:", err)

      let errorMessage = "Error al guardar el egreso. Por favor, intenta de nuevo."

      if (err instanceof Error) {
        errorMessage = err.message
      }

      toast({
        title: "Error al guardar",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
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
    setActiveTab("new")
  }

  // Función para eliminar un egreso
  const handleDelete = async (id: string) => {
    try {
      const success = await ExpenseService.deleteExpense(id)

      if (success) {
        // Eliminar del estado local
        setExpenses((prevExpenses) => prevExpenses.filter((expense) => expense.id !== id))

        toast({
          title: "Egreso eliminado",
          description: "El egreso se ha eliminado correctamente",
        })

        console.log("Egreso eliminado correctamente:", id)
      } else {
        throw new Error("No se pudo eliminar el egreso")
      }
    } catch (err) {
      console.error("Error al eliminar egreso:", err)

      let errorMessage = "Error al eliminar el egreso. Por favor, intenta de nuevo."

      if (err instanceof Error) {
        errorMessage = err.message
      }

      toast({
        title: "Error al eliminar",
        description: errorMessage,
        variant: "destructive",
      })
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

  // Verificar si hay egresos locales
  const hasLocalExpenses = expenses.some((expense) => expense.id.startsWith("local-"))

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {hasLocalExpenses && (
        <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
          <CloudOff className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Algunos egresos están guardados solo localmente. Se sincronizarán cuando te conectes.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gestión de Egresos</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshExpenses}
            disabled={refreshing}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Actualizando..." : "Actualizar"}
          </Button>
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
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : filteredExpenses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay egresos que mostrar.</p>
                  <Button variant="outline" className="mt-4" onClick={() => setActiveTab("new")}>
                    Añadir nuevo egreso
                  </Button>
                </div>
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
                            <div className="flex items-center gap-2">
                              {expense.id.startsWith("local-") && (
                                <CloudOff className="h-4 w-4 text-yellow-600" title="Guardado localmente" />
                              )}
                              <p>{expense.description}</p>
                            </div>
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
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <div className="animate-spin mr-2 h-4 w-4 border-b-2 border-white rounded-full"></div>
                        {editingExpense ? "Actualizando..." : "Guardando..."}
                      </>
                    ) : (
                      <>{editingExpense ? "Actualizar" : "Guardar"} Egreso</>
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

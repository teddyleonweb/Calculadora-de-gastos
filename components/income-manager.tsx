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
import { IncomeService } from "@/services/income-service"
import { type Income, INCOME_CATEGORIES, INCOME_FREQUENCIES } from "@/types"
import { format, startOfMonth, endOfMonth, isValid } from "date-fns"
import { AlertCircle, Edit, Trash2, Filter, RefreshCw } from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"

export default function IncomeManager() {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [filteredIncomes, setFilteredIncomes] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("list")
  const [refreshing, setRefreshing] = useState(false)

  // Estado para el formulario de nuevo ingreso
  const [newIncome, setNewIncome] = useState<{
    description: string
    amount: string
    category: string
    date: string
    isFixed: boolean
    frequency?: string
    notes?: string
  }>({
    description: "",
    amount: "",
    category: INCOME_CATEGORIES[0],
    date: format(new Date(), "yyyy-MM-dd"),
    isFixed: false,
    frequency: undefined,
    notes: "",
  })

  // Estado para el ingreso que se está editando
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)

  // Estado para los filtros
  const [filters, setFilters] = useState({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
    category: "all",
    type: "all", // 'all', 'fixed', 'variable'
  })

  // Colores para los gráficos
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FFC658", "#8DD1E1", "#A4DE6C"]

  // Cargar ingresos al montar el componente
  useEffect(() => {
    loadIncomes()
  }, [])

  // Filtrar ingresos cuando cambian los filtros o los ingresos
  useEffect(() => {
    filterIncomes()
  }, [incomes, filters])

  // Función para cargar los ingresos
  const loadIncomes = async () => {
    try {
      setLoading(true)
      setError(null)

      // Intentar cargar ingresos desde el servicio (que ahora usa localStorage como respaldo)
      const data = await IncomeService.getIncomes()

      if (data && data.length > 0) {
        setIncomes(data)
        console.log("Ingresos cargados correctamente:", data.length)
      } else {
        // Si no hay datos, usar datos de prueba solo si no hay nada en localStorage
        console.log("No se encontraron ingresos, usando datos de prueba")

        // Datos de prueba
        const mockData: Income[] = [
          {
            id: "mock-1",
            userId: "1",
            description: "Salario mensual",
            amount: 2500,
            category: "Salario",
            date: "2023-05-01",
            isFixed: true,
            frequency: "Mensual",
            createdAt: "2023-05-01T10:00:00Z",
          },
          {
            id: "mock-2",
            userId: "1",
            description: "Dividendos de inversiones",
            amount: 350,
            category: "Inversiones",
            date: "2023-05-15",
            isFixed: false,
            createdAt: "2023-05-15T14:30:00Z",
          },
          {
            id: "mock-3",
            userId: "1",
            description: "Proyecto freelance",
            amount: 800,
            category: "Freelance",
            date: "2023-05-20",
            isFixed: false,
            createdAt: "2023-05-20T09:15:00Z",
          },
        ]

        setIncomes(mockData)

        // Guardar los datos de prueba en localStorage para futuras cargas
        IncomeService.saveIncomesToLocalStorage(mockData)
      }
    } catch (err) {
      setError("Error al cargar los ingresos. Usando datos de prueba.")
      console.error(err)

      // Cargar desde localStorage como último recurso
      const localIncomes = IncomeService.loadIncomesFromLocalStorage()
      if (localIncomes.length > 0) {
        setIncomes(localIncomes)
      } else {
        // Si no hay nada en localStorage, usar datos de prueba
        const mockData: Income[] = [
          {
            id: "mock-1",
            userId: "1",
            description: "Salario mensual",
            amount: 2500,
            category: "Salario",
            date: "2023-05-01",
            isFixed: true,
            frequency: "Mensual",
            createdAt: "2023-05-01T10:00:00Z",
          },
          {
            id: "mock-2",
            userId: "1",
            description: "Dividendos de inversiones",
            amount: 350,
            category: "Inversiones",
            date: "2023-05-15",
            isFixed: false,
            createdAt: "2023-05-15T14:30:00Z",
          },
        ]

        setIncomes(mockData)
        IncomeService.saveIncomesToLocalStorage(mockData)
      }
    } finally {
      setLoading(false)
    }
  }

  // Función para refrescar los ingresos desde la API
  const refreshIncomes = async () => {
    try {
      setRefreshing(true)
      // Limpiar la caché para forzar una recarga desde la API
      IncomeService.clearIncomeCache()
      await loadIncomes()
      toast({
        title: "Ingresos actualizados",
        description: "Los ingresos se han actualizado correctamente",
      })
    } catch (err) {
      console.error("Error al refrescar ingresos:", err)
      toast({
        title: "Error al actualizar",
        description: "No se pudieron actualizar los ingresos. Intenta de nuevo más tarde.",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  // Función para filtrar ingresos
  const filterIncomes = () => {
    let filtered = [...incomes]

    // Filtrar por fecha
    if (isValid(filters.startDate)) {
      filtered = filtered.filter((income) => new Date(income.date) >= filters.startDate)
    }

    if (isValid(filters.endDate)) {
      filtered = filtered.filter((income) => new Date(income.date) <= filters.endDate)
    }

    // Filtrar por categoría
    if (filters.category !== "all") {
      filtered = filtered.filter((income) => income.category === filters.category)
    }

    // Filtrar por tipo (fijo o variable)
    if (filters.type === "fixed") {
      filtered = filtered.filter((income) => income.isFixed)
    } else if (filters.type === "variable") {
      filtered = filtered.filter((income) => !income.isFixed)
    }

    // Ordenar por fecha (más reciente primero)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    setFilteredIncomes(filtered)
  }

  // Función para manejar el envío del formulario de nuevo ingreso
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    let isLocalSave = false
    let errorMessage = "Error al guardar el ingreso. Por favor, intenta de nuevo."

    try {
      const incomeData = {
        description: newIncome.description,
        amount: Number.parseFloat(newIncome.amount),
        category: newIncome.category,
        date: newIncome.date,
        isFixed: newIncome.isFixed,
        frequency: newIncome.isFixed ? newIncome.frequency : undefined,
        notes: newIncome.notes,
      }

      // Mostrar mensaje de carga
      toast({
        title: editingIncome ? "Actualizando ingreso..." : "Guardando ingreso...",
        description: "Por favor espera mientras procesamos tu solicitud.",
      })

      if (editingIncome) {
        // Actualizar ingreso existente
        const updatedIncome = await IncomeService.updateIncome(editingIncome.id, incomeData)

        // Actualizar el estado local con el ingreso actualizado
        setIncomes((prevIncomes) =>
          prevIncomes.map((income) => (income.id === editingIncome.id ? updatedIncome : income)),
        )

        toast({
          title: "Ingreso actualizado",
          description: updatedIncome.id.startsWith("local-")
            ? "El ingreso se ha actualizado localmente. Se sincronizará cuando te conectes."
            : "El ingreso se ha actualizado correctamente",
        })

        console.log("Ingreso actualizado correctamente:", updatedIncome)
      } else {
        // Crear nuevo ingreso
        const newIncomeResponse = await IncomeService.addIncome(incomeData)

        // Añadir el nuevo ingreso al estado local
        setIncomes((prevIncomes) => [...prevIncomes, newIncomeResponse])

        toast({
          title: "Ingreso añadido",
          description: newIncomeResponse.id.startsWith("local-")
            ? "El ingreso se ha guardado localmente. Se sincronizará cuando te conectes."
            : "El nuevo ingreso se ha añadido correctamente",
        })

        console.log("Nuevo ingreso añadido correctamente:", newIncomeResponse)
      }

      // Resetear formulario
      setNewIncome({
        description: "",
        amount: "",
        category: INCOME_CATEGORIES[0],
        date: format(new Date(), "yyyy-MM-dd"),
        isFixed: false,
        frequency: undefined,
        notes: "",
      })
      setEditingIncome(null)

      // Cambiar a la pestaña de lista
      setActiveTab("list")
    } catch (err) {
      console.error("Error al guardar ingreso:", err)

      // Mostrar mensaje de error más específico
      errorMessage = "Error al guardar el ingreso. Por favor, intenta de nuevo."
      isLocalSave = false

      if (err instanceof Error) {
        if (err.message.includes("token") || err.message.includes("HTTP: 4")) {
          errorMessage = "No se pudo conectar con el servidor. Los datos se han guardado localmente."
          isLocalSave = true

          // Intentar guardar localmente de todos modos
          try {
            const incomeData = {
              description: newIncome.description,
              amount: Number.parseFloat(newIncome.amount),
              category: newIncome.category,
              date: newIncome.date,
              isFixed: newIncome.isFixed,
              frequency: newIncome.isFixed ? newIncome.frequency : undefined,
              notes: newIncome.notes,
            }

            const localIncome: Income = {
              id: `local-${Date.now()}`,
              userId: "current-user",
              ...incomeData,
              createdAt: new Date().toISOString(),
            }

            // Añadir a localStorage y al estado
            const existingIncomes = IncomeService.loadIncomesFromLocalStorage()
            IncomeService.saveIncomesToLocalStorage([...existingIncomes, localIncome])
            setIncomes((prevIncomes) => [...prevIncomes, localIncome])

            // Resetear formulario
            setNewIncome({
              description: "",
              amount: "",
              category: INCOME_CATEGORIES[0],
              date: format(new Date(), "yyyy-MM-dd"),
              isFixed: false,
              frequency: undefined,
              notes: "",
            })
            setEditingIncome(null)

            // Cambiar a la pestaña de lista
            setActiveTab("list")

            toast({
              title: "Ingreso guardado localmente",
              description: "El ingreso se ha guardado en tu dispositivo. Se sincronizará cuando te conectes.",
            })

            return // Salir de la función para evitar mostrar el mensaje de error
          } catch (localError) {
            console.error("Error al guardar localmente:", localError)
          }
        }
      }
    }

    if (!isLocalSave) {
      toast({
        title: "Error al guardar",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // Función para editar un ingreso
  const handleEdit = (income: Income) => {
    setEditingIncome(income)
    setNewIncome({
      description: income.description,
      amount: income.amount.toString(),
      category: income.category,
      date: income.date,
      isFixed: income.isFixed,
      frequency: income.frequency,
      notes: income.notes || "",
    })
    setActiveTab("new")
  }

  // Función para eliminar un ingreso
  const handleDelete = async (id: string) => {
    try {
      const success = await IncomeService.deleteIncome(id)

      if (success) {
        // Eliminar del estado local
        setIncomes((prevIncomes) => prevIncomes.filter((income) => income.id !== id))

        toast({
          title: "Ingreso eliminado",
          description: "El ingreso se ha eliminado correctamente",
        })

        console.log("Ingreso eliminado correctamente:", id)
      } else {
        throw new Error("No se pudo eliminar el ingreso")
      }
    } catch (err) {
      setError("Error al eliminar el ingreso. Por favor, intenta de nuevo.")
      console.error(err)

      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar el ingreso. Intenta de nuevo más tarde.",
        variant: "destructive",
      })
    }
  }

  // Función para cancelar la edición
  const handleCancelEdit = () => {
    setEditingIncome(null)
    setNewIncome({
      description: "",
      amount: "",
      category: INCOME_CATEGORIES[0],
      date: format(new Date(), "yyyy-MM-dd"),
      isFixed: false,
      frequency: undefined,
      notes: "",
    })
  }

  // Preparar datos para el gráfico de barras (por categoría)
  const getBarChartData = () => {
    const groupedByCategory = IncomeService.groupByCategory(filteredIncomes)
    return Object.keys(groupedByCategory).map((category) => ({
      name: category,
      amount: IncomeService.calculateTotal(groupedByCategory[category]),
    }))
  }

  // Preparar datos para el gráfico circular (por tipo: fijo vs variable)
  const getPieChartData = () => {
    const fixedIncomes = filteredIncomes.filter((income) => income.isFixed)
    const variableIncomes = filteredIncomes.filter((income) => !income.isFixed)

    return [
      {
        name: "Ingresos Fijos",
        value: IncomeService.calculateTotal(fixedIncomes),
      },
      {
        name: "Ingresos Variables",
        value: IncomeService.calculateTotal(variableIncomes),
      },
    ].filter((item) => item.value > 0)
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gestión de Ingresos</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshIncomes}
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
              <TabsTrigger value="new">Nuevo Ingreso</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <h3 className="text-lg font-medium">Lista de Ingresos</h3>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtros
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Filtrar Ingresos</DialogTitle>
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
                            {INCOME_CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type">Tipo</Label>
                        <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                          <SelectTrigger id="type">
                            <SelectValue placeholder="Selecciona un tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos los tipos</SelectItem>
                            <SelectItem value="fixed">Ingresos Fijos</SelectItem>
                            <SelectItem value="variable">Ingresos Variables</SelectItem>
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
              ) : filteredIncomes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay ingresos que mostrar.</p>
                  <Button variant="outline" className="mt-4" onClick={() => setActiveTab("new")}>
                    Añadir nuevo ingreso
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <div className="grid grid-cols-1 md:grid-cols-6 p-4 font-medium">
                      <div className="md:col-span-2">Descripción</div>
                      <div>Monto</div>
                      <div>Fecha</div>
                      <div>Tipo</div>
                      <div>Acciones</div>
                    </div>
                    <div className="divide-y">
                      {filteredIncomes.map((income) => (
                        <div key={income.id} className="grid grid-cols-1 md:grid-cols-6 p-4 items-center">
                          <div className="md:col-span-2">
                            <p>{income.description}</p>
                            <p className="text-sm text-muted-foreground">{income.category}</p>
                          </div>
                          <div className="font-medium">${income.amount.toFixed(2)}</div>
                          <div>{format(new Date(income.date), "dd/MM/yyyy")}</div>
                          <div>
                            {income.isFixed ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Fijo {income.frequency && `(${income.frequency})`}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Variable
                              </span>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="icon" onClick={() => handleEdit(income)}>
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
                                <p>¿Estás seguro de que deseas eliminar este ingreso?</p>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline">Cancelar</Button>
                                  </DialogClose>
                                  <DialogClose asChild>
                                    <Button variant="destructive" onClick={() => handleDelete(income.id)}>
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
                      <span className="font-bold">${IncomeService.calculateTotal(filteredIncomes).toFixed(2)}</span>
                    </p>
                    <p>
                      Mostrando {filteredIncomes.length} de {incomes.length} ingresos
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="charts">
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium mb-4">Ingresos por Categoría</h3>
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
                  <h3 className="text-lg font-medium mb-4">Ingresos Fijos vs Variables</h3>
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
                <h3 className="text-lg font-medium">{editingIncome ? "Editar Ingreso" : "Nuevo Ingreso"}</h3>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Input
                    id="description"
                    value={newIncome.description}
                    onChange={(e) => setNewIncome({ ...newIncome, description: e.target.value })}
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
                    value={newIncome.amount}
                    onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    value={newIncome.category}
                    onValueChange={(value) => setNewIncome({ ...newIncome, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {INCOME_CATEGORIES.map((category) => (
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
                    value={newIncome.date}
                    onChange={(e) => setNewIncome({ ...newIncome, date: e.target.value })}
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isFixed"
                    checked={newIncome.isFixed}
                    onCheckedChange={(checked) =>
                      setNewIncome({
                        ...newIncome,
                        isFixed: checked === true,
                        frequency: checked === true ? newIncome.frequency || INCOME_FREQUENCIES[2] : undefined,
                      })
                    }
                  />
                  <Label htmlFor="isFixed">Es un ingreso fijo/recurrente</Label>
                </div>

                {newIncome.isFixed && (
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frecuencia</Label>
                    <Select
                      value={newIncome.frequency || INCOME_FREQUENCIES[2]}
                      onValueChange={(value) => setNewIncome({ ...newIncome, frequency: value })}
                    >
                      <SelectTrigger id="frequency">
                        <SelectValue placeholder="Selecciona una frecuencia" />
                      </SelectTrigger>
                      <SelectContent>
                        {INCOME_FREQUENCIES.map((frequency) => (
                          <SelectItem key={frequency} value={frequency}>
                            {frequency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas (opcional)</Label>
                  <Textarea
                    id="notes"
                    value={newIncome.notes || ""}
                    onChange={(e) => setNewIncome({ ...newIncome, notes: e.target.value })}
                    placeholder="Añade notas adicionales sobre este ingreso"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  {editingIncome && (
                    <Button type="button" variant="outline" onClick={handleCancelEdit}>
                      Cancelar
                    </Button>
                  )}
                  <Button type="submit">{editingIncome ? "Actualizar" : "Guardar"} Ingreso</Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

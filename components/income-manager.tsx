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
import { ChartTooltip } from "@/components/ui/chart"
import { IncomeService } from "@/services/income-service"
import { type Income, INCOME_CATEGORIES, INCOME_FREQUENCIES } from "@/types"
import { format, startOfMonth, endOfMonth, isValid } from "date-fns"
import { AlertCircle, Edit, Trash2, RefreshCw } from "lucide-react"
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

  // Modificar la función loadIncomes para asegurar que se carguen los datos del servidor
  const loadIncomes = async () => {
    try {
      setLoading(true)
      setError(null)

      // Limpiar la caché para forzar una recarga desde la API
      IncomeService.clearIncomeCache()

      // Intentar cargar ingresos desde el servicio
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
      setError("Error al cargar los ingresos. Usando datos de respaldo.")
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

  // Modificar la función refreshIncomes para forzar una recarga completa
  const refreshIncomes = async () => {
    try {
      setRefreshing(true)

      // Limpiar la caché para forzar una recarga desde la API
      IncomeService.clearIncomeCache()

      // Forzar una recarga completa desde el servidor
      const token = localStorage.getItem("auth_token")
      if (token) {
        const timestamp = new Date().getTime()
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"}/incomes?_t=${timestamp}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          },
        )

        if (response.ok) {
          const data = await response.json()
          setIncomes(data)
          console.log("Ingresos actualizados correctamente:", data.length)

          // Guardar en localStorage como respaldo
          IncomeService.saveIncomesToLocalStorage(data)

          toast({
            title: "Ingresos actualizados",
            description: "Los ingresos se han actualizado correctamente",
          })
        } else {
          throw new Error(`Error HTTP: ${response.status}`)
        }
      } else {
        // Si no hay token, intentar cargar desde localStorage
        await loadIncomes()
        toast({
          title: "Ingresos actualizados",
          description: "Los ingresos se han actualizado desde el almacenamiento local",
        })
      }
    } catch (err) {
      console.error("Error al refrescar ingresos:", err)
      toast({
        title: "Error al actualizar",
        description: "No se pudieron actualizar los ingresos. Intenta de nuevo más tarde.",
        variant: "destructive",
      })

      // Intentar cargar desde localStorage como último recurso
      const localIncomes = IncomeService.loadIncomesFromLocalStorage()
      if (localIncomes.length > 0) {
        setIncomes(localIncomes)
      }
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

  // Modificar la función handleSubmit para forzar una recarga después de guardar
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
        console.log("Actualizando ingreso:", editingIncome.id, incomeData)
        const updatedIncome = await IncomeService.updateIncome(editingIncome.id, incomeData)

        toast({
          title: "Ingreso actualizado",
          description: String(updatedIncome.id).startsWith("local-")
            ? "El ingreso se ha actualizado localmente. Se sincronizará cuando te conectes."
            : "El ingreso se ha actualizado correctamente",
        })

        console.log("Ingreso actualizado correctamente:", updatedIncome)
      } else {
        // Crear nuevo ingreso
        const newIncomeResponse = await IncomeService.addIncome(incomeData)

        toast({
          title: "Ingreso añadido",
          description: String(newIncomeResponse.id).startsWith("local-")
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

      // Forzar una recarga inmediata de los ingresos
      await refreshIncomes()
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
      console.log("Intentando eliminar ingreso con ID:", id)

      // Si es un ID local, simplemente eliminarlo del estado
      if (String(id).startsWith("local-")) {
        setIncomes((prevIncomes) => prevIncomes.filter((income) => income.id !== id))

        // También eliminarlo de localStorage
        const localIncomes = IncomeService.loadIncomesFromLocalStorage()
        const updatedLocalIncomes = localIncomes.filter((income) => income.id !== id)
        IncomeService.saveIncomesToLocalStorage(updatedLocalIncomes)

        toast({
          title: "Ingreso eliminado",
          description: "El ingreso local se ha eliminado correctamente",
        })

        return
      }

      // Si no es local, intentar eliminarlo a través de la API
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
      console.error("Error al eliminar ingreso:", err)

      // Mostrar mensaje de error más específico
      let errorMessage = "Error al eliminar el ingreso. Por favor, intenta de nuevo."

      if (err instanceof Error) {
        if (err.message.includes("HTTP: 404")) {
          errorMessage = "No se encontró el ingreso en el servidor. Puede que ya haya sido eliminado."

          // Eliminar del estado local de todos modos
          setIncomes((prevIncomes) => prevIncomes.filter((income) => income.id !== id))

          toast({
            title: "Ingreso no encontrado",
            description: errorMessage,
            variant: "destructive",
          })

          return
        }
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
    ]
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Administrador de Ingresos</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="list">Lista de Ingresos</TabsTrigger>
              <TabsTrigger value="new">Nuevo Ingreso</TabsTrigger>
              <TabsTrigger value="analytics">Analíticas</TabsTrigger>
            </TabsList>
            <TabsContent value="list">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">Ingresos</h2>
                <Button variant="outline" onClick={refreshIncomes} disabled={refreshing}>
                  {refreshing ? "Actualizando..." : "Actualizar"}
                  <RefreshCw className="ml-2 h-4 w-4" />
                </Button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="mb-4">
                <Label>Filtrar por:</Label>
                <div className="flex space-x-4">
                  <div>
                    <Label htmlFor="startDate">Fecha de inicio</Label>
                    <Input
                      type="date"
                      id="startDate"
                      value={format(filters.startDate, "yyyy-MM-dd")}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          startDate: new Date(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">Fecha de fin</Label>
                    <Input
                      type="date"
                      id="endDate"
                      value={format(filters.endDate, "yyyy-MM-dd")}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          endDate: new Date(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Categoría</Label>
                    <Select onValueChange={(value) => setFilters({ ...filters, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {INCOME_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="type">Tipo</Label>
                    <Select onValueChange={(value) => setFilters({ ...filters, type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="fixed">Fijos</SelectItem>
                        <SelectItem value="variable">Variables</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {loading ? (
                <p>Cargando ingresos...</p>
              ) : filteredIncomes.length === 0 ? (
                <p>No hay ingresos para mostrar.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descripción
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Monto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Categoría
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredIncomes.map((income) => (
                        <tr key={income.id}>
                          <td className="px-6 py-4 whitespace-nowrap">{income.description}</td>
                          <td className="px-6 py-4 whitespace-nowrap">${income.amount}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{income.category}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{format(new Date(income.date), "yyyy-MM-dd")}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{income.isFixed ? "Fijo" : "Variable"}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(income)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-500">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                  <DialogTitle>¿Estás seguro?</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <p>¿Estás seguro de que quieres eliminar este ingreso?</p>
                                </div>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button type="button" variant="secondary">
                                      Cancelar
                                    </Button>
                                  </DialogClose>
                                  <Button type="submit" onClick={() => handleDelete(income.id)} variant="destructive">
                                    Eliminar
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
            <TabsContent value="new">
              <h2 className="text-2xl font-semibold mb-4">{editingIncome ? "Editar Ingreso" : "Nuevo Ingreso"}</h2>
              <form onSubmit={handleSubmit} className="grid gap-4">
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Input
                    type="text"
                    id="description"
                    value={newIncome.description}
                    onChange={(e) => setNewIncome({ ...newIncome, description: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Monto</Label>
                  <Input
                    type="number"
                    id="amount"
                    value={newIncome.amount}
                    onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    onValueChange={(value) => setNewIncome({ ...newIncome, category: value })}
                    defaultValue={newIncome.category}
                  >
                    <SelectTrigger>
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
                <div>
                  <Label htmlFor="date">Fecha</Label>
                  <Input
                    type="date"
                    id="date"
                    value={newIncome.date}
                    onChange={(e) => setNewIncome({ ...newIncome, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="isFixed">
                    <Checkbox
                      id="isFixed"
                      checked={newIncome.isFixed}
                      onCheckedChange={(checked) =>
                        setNewIncome({
                          ...newIncome,
                          isFixed: !!checked,
                          frequency: checked ? INCOME_FREQUENCIES[0] : undefined,
                        })
                      }
                    />
                    <span>Ingreso Fijo</span>
                  </Label>
                </div>
                {newIncome.isFixed && (
                  <div>
                    <Label htmlFor="frequency">Frecuencia</Label>
                    <Select
                      onValueChange={(value) => setNewIncome({ ...newIncome, frequency: value })}
                      defaultValue={newIncome.frequency}
                    >
                      <SelectTrigger>
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
                <div>
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    value={newIncome.notes || ""}
                    onChange={(e) => setNewIncome({ ...newIncome, notes: e.target.value })}
                  />
                </div>
                <div className="flex justify-end">
                  {editingIncome && (
                    <Button type="button" variant="ghost" onClick={handleCancelEdit}>
                      Cancelar
                    </Button>
                  )}
                  <Button type="submit">{editingIncome ? "Actualizar Ingreso" : "Guardar Ingreso"}</Button>
                </div>
              </form>
            </TabsContent>
            <TabsContent value="analytics">
              <h2 className="text-2xl font-semibold mb-4">Analíticas de Ingresos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Ingresos por Categoría</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={getBarChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend />
                        <Bar dataKey="amount" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Ingresos Fijos vs Variables</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={getPieChartData()}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          label
                        >
                          {getPieChartData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

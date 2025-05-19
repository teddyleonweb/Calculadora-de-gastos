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
import { DatePicker } from "@/components/ui/date-picker"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

export default function IncomeManager() {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [filteredIncomes, setFilteredIncomes] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("list")

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
      const data = await IncomeService.getIncomes()
      setIncomes(data)
      setError(null)
    } catch (err) {
      setError("Error al cargar los ingresos. Por favor, intenta de nuevo.")
      console.error(err)
    } finally {
      setLoading(false)
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

      if (editingIncome) {
        // Actualizar ingreso existente
        await IncomeService.updateIncome(editingIncome.id, incomeData)
      } else {
        // Crear nuevo ingreso
        await IncomeService.addIncome(incomeData)
      }

      // Resetear formulario y recargar ingresos
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
      await loadIncomes()
    } catch (err) {
      setError("Error al guardar el ingreso. Por favor, intenta de nuevo.")
      console.error(err)
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
  }

  // Función para eliminar un ingreso
  const handleDelete = async (id: string) => {
    try {
      await IncomeService.deleteIncome(id)
      await loadIncomes()
    } catch (err) {
      setError("Error al eliminar el ingreso. Por favor, intenta de nuevo.")
      console.error(err)
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
        <CardHeader>
          <CardTitle>Gestión de Ingresos</CardTitle>
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
                          <DatePicker
                            id="startDate"
                            selected={filters.startDate}
                            onSelect={(date) => setFilters({ ...filters, startDate: date || startOfMonth(new Date()) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endDate">Fecha Fin</Label>
                          <DatePicker
                            id="endDate"
                            selected={filters.endDate}
                            onSelect={(date) => setFilters({ ...filters, endDate: date || endOfMonth(new Date()) })}
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
                <p>Cargando ingresos...</p>
              ) : filteredIncomes.length === 0 ? (
                <p>No hay ingresos que mostrar.</p>
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

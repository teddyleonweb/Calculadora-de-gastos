"use client"

import { useState, useEffect } from "react"
import { Calendar, ChevronDown, ChevronUp } from "lucide-react"

interface DateFilterProps {
  onDateChange: (date: string | null) => void
  onMonthChange: (month: string | null) => void // Nueva función para filtrar por mes
  onReset: () => void
  activeStoreId: string
}

export default function DateFilter({ onDateChange, onMonthChange, onReset, activeStoreId }: DateFilterProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null) // Nuevo estado para el mes seleccionado
  const [isOpen, setIsOpen] = useState(false)
  const [filterType, setFilterType] = useState<"day" | "month">("day") // Tipo de filtro: día o mes
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [availableMonths, setAvailableMonths] = useState<string[]>([]) // Meses disponibles

  // Cargar fechas disponibles desde localStorage, filtradas por tienda activa
  useEffect(() => {
    try {
      const cachedProducts = localStorage.getItem("cached_products")
      if (cachedProducts) {
        const products = JSON.parse(cachedProducts)

        // Extraer fechas únicas de los productos, filtradas por tienda activa si no es "total"
        const dates = products
          .filter((product: any) => {
            // Si estamos en la vista "Total", mostrar todas las fechas
            // Si no, filtrar por tienda activa
            return product.createdAt && (activeStoreId === "total" || product.storeId === activeStoreId)
          })
          .map((product: any) => {
            // Convertir a fecha local y extraer solo la parte de la fecha (sin hora)
            const date = new Date(product.createdAt)
            return date.toISOString().split("T")[0]
          })
          .filter(
            (date: string, index: number, self: string[]) => self.indexOf(date) === index, // Eliminar duplicados
          )
          .sort((a: string, b: string) => b.localeCompare(a)) // Ordenar por fecha descendente

        console.log("Fechas disponibles cargadas:", dates.length)
        setAvailableDates(dates)

        // Extraer meses únicos (YYYY-MM)
        const months = dates
          .map((date: string) => date.substring(0, 7)) // Extraer YYYY-MM
          .filter((month: string, index: number, self: string[]) => self.indexOf(month) === index) // Eliminar duplicados
          .sort((a: string, b: string) => b.localeCompare(a)) // Ordenar por mes descendente

        console.log("Meses disponibles cargados:", months.length)
        setAvailableMonths(months)
      }
    } catch (error) {
      console.error("Error al cargar fechas disponibles:", error)
    }
  }, [activeStoreId]) // Actualizar cuando cambie la tienda activa

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setSelectedMonth(null) // Resetear el mes seleccionado
    onDateChange(date)
    onMonthChange(null) // Resetear el filtro de mes
    setIsOpen(false)
  }

  const handleMonthSelect = (month: string) => {
    setSelectedMonth(month)
    setSelectedDate(null) // Resetear la fecha seleccionada
    onMonthChange(month)
    onDateChange(null) // Resetear el filtro de día
    setIsOpen(false)
  }

  const handleReset = () => {
    setSelectedDate(null)
    setSelectedMonth(null)
    onReset()
    onDateChange(null)
    onMonthChange(null)
  }

  // Formatear fecha para mostrar
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Formatear mes para mostrar
  const formatMonth = (monthString: string): string => {
    const [year, month] = monthString.split("-")
    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, 1)
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
    })
  }

  // Depuración
  console.log("Estado actual del filtro:", {
    availableDates: availableDates.length,
    availableMonths: availableMonths.length,
    selectedDate,
    selectedMonth,
    filterType,
    activeStoreId,
  })

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 bg-white border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <Calendar className="h-4 w-4" />
            {selectedDate
              ? `Día: ${formatDate(selectedDate)}`
              : selectedMonth
                ? `Mes: ${formatMonth(selectedMonth)}`
                : "Filtrar por fecha"}
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {isOpen && (
            <div className="absolute z-10 mt-1 w-64 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-y-auto">
              {/* Selector de tipo de filtro */}
              <div className="flex border-b">
                <button
                  onClick={() => setFilterType("day")}
                  className={`flex-1 py-2 text-sm font-medium ${
                    filterType === "day" ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Por día
                </button>
                <button
                  onClick={() => setFilterType("month")}
                  className={`flex-1 py-2 text-sm font-medium ${
                    filterType === "month" ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Por mes
                </button>
              </div>

              {/* Lista de fechas o meses según el tipo de filtro */}
              {filterType === "day" ? (
                availableDates.length > 0 ? (
                  <ul className="py-1">
                    {availableDates.map((date) => (
                      <li
                        key={date}
                        onClick={() => handleDateSelect(date)}
                        className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                          selectedDate === date ? "bg-blue-50 text-blue-600" : ""
                        }`}
                      >
                        {formatDate(date)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-3 py-2 text-gray-500">No hay fechas disponibles</div>
                )
              ) : // Mostrar meses
              availableMonths.length > 0 ? (
                <ul className="py-1">
                  {availableMonths.map((month) => (
                    <li
                      key={month}
                      onClick={() => handleMonthSelect(month)}
                      className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                        selectedMonth === month ? "bg-blue-50 text-blue-600" : ""
                      }`}
                    >
                      {formatMonth(month)}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-3 py-2 text-gray-500">No hay meses disponibles</div>
              )}
            </div>
          )}
        </div>

        {(selectedDate || selectedMonth) && (
          <button onClick={handleReset} className="text-sm text-blue-600 hover:text-blue-800">
            Mostrar todos
          </button>
        )}
      </div>
      {/* Botón de depuración - solo visible en desarrollo */}
      {process.env.NODE_ENV === "development" && (
        <button
          onClick={() => {
            console.log("Fechas disponibles:", availableDates)
            console.log("Meses disponibles:", availableMonths)
            alert(`Fechas disponibles: ${availableDates.length}\nMeses disponibles: ${availableMonths.length}`)
          }}
          className="text-xs text-gray-400 hover:text-gray-600 mt-1"
        >
          Debug: {availableDates.length} fechas / {availableMonths.length} meses
        </button>
      )}
    </div>
  )
}

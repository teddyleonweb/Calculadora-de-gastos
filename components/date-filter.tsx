"use client"

import { useState, useEffect } from "react"
import { Calendar, ChevronDown, ChevronUp } from "lucide-react"

interface DateFilterProps {
  onDateChange: (date: string | null) => void
  onMonthChange: (month: string | null) => void
  onReset: () => void
  activeStoreId: string
}

export default function DateFilter({ onDateChange, onMonthChange, onReset, activeStoreId }: DateFilterProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [filterType, setFilterType] = useState<"day" | "month">("day")
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [debugInfo, setDebugInfo] = useState<string>("")

  // Cargar fechas disponibles desde localStorage
  useEffect(() => {
    try {
      const cachedProducts = localStorage.getItem("cached_products")
      if (cachedProducts) {
        const products = JSON.parse(cachedProducts)

        // Verificar si los productos tienen fechas
        const productsWithDates = products.filter((product: any) => product.createdAt)
        console.log("Productos con fechas:", productsWithDates.length, "de", products.length)

        if (productsWithDates.length === 0) {
          // Si no hay productos con fechas, mostrar mensaje de depuración
          setDebugInfo("No hay productos con fechas de creación")

          // Intentar añadir fechas a los productos existentes
          const updatedProducts = products.map((product: any) => {
            if (!product.createdAt) {
              return {
                ...product,
                createdAt: new Date().toISOString(), // Añadir fecha actual
              }
            }
            return product
          })

          // Guardar productos actualizados en localStorage
          localStorage.setItem("cached_products", JSON.stringify(updatedProducts))
          console.log("Productos actualizados con fechas:", updatedProducts.length)

          // Extraer fechas de los productos actualizados
          extractDatesFromProducts(updatedProducts)
        } else {
          // Extraer fechas de los productos existentes
          extractDatesFromProducts(products)
        }
      } else {
        setDebugInfo("No hay productos en caché")
      }
    } catch (error) {
      console.error("Error al cargar fechas disponibles:", error)
      setDebugInfo(`Error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }, [activeStoreId])

  // Función para extraer fechas de los productos
  const extractDatesFromProducts = (products: any[]) => {
    // Extraer fechas únicas de todos los productos (sin filtrar por tienda en la vista Total)
    const dates = products
      .filter((product: any) => product.createdAt)
      .map((product: any) => {
        try {
          // Convertir a fecha local y extraer solo la parte de la fecha (sin hora)
          const date = new Date(product.createdAt)
          return date.toISOString().split("T")[0]
        } catch (e) {
          console.error("Error al procesar fecha:", product.createdAt, e)
          return null
        }
      })
      .filter((date: string | null) => date !== null) // Eliminar fechas inválidas
      .filter((date: string, index: number, self: string[]) => self.indexOf(date) === index) // Eliminar duplicados
      .sort((a: string, b: string) => b.localeCompare(a)) // Ordenar por fecha descendente

    console.log("Fechas disponibles:", dates)
    setAvailableDates(dates)
    setDebugInfo(`Fechas encontradas: ${dates.length}`)

    // Extraer meses únicos (YYYY-MM)
    const months = dates
      .map((date: string) => date.substring(0, 7)) // Extraer YYYY-MM
      .filter((month: string, index: number, self: string[]) => self.indexOf(month) === index) // Eliminar duplicados
      .sort((a: string, b: string) => b.localeCompare(a)) // Ordenar por mes descendente

    console.log("Meses disponibles:", months)
    setAvailableMonths(months)
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setSelectedMonth(null)
    onDateChange(date)
    onMonthChange(null)
    setIsOpen(false)
  }

  const handleMonthSelect = (month: string) => {
    setSelectedMonth(month)
    setSelectedDate(null)
    onMonthChange(month)
    onDateChange(null)
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

  // Función para forzar la actualización de fechas en productos
  const forceUpdateProductDates = () => {
    try {
      const cachedProducts = localStorage.getItem("cached_products")
      if (cachedProducts) {
        const products = JSON.parse(cachedProducts)

        // Añadir fechas a todos los productos
        const updatedProducts = products.map((product: any) => {
          // Generar una fecha aleatoria en los últimos 30 días
          const randomDays = Math.floor(Math.random() * 30)
          const date = new Date()
          date.setDate(date.getDate() - randomDays)

          return {
            ...product,
            createdAt: date.toISOString(),
          }
        })

        // Guardar productos actualizados en localStorage
        localStorage.setItem("cached_products", JSON.stringify(updatedProducts))
        console.log("Productos actualizados con fechas aleatorias:", updatedProducts.length)

        // Extraer fechas de los productos actualizados
        extractDatesFromProducts(updatedProducts)

        // Mostrar mensaje de éxito
        setDebugInfo(`${updatedProducts.length} productos actualizados con fechas aleatorias`)

        // Recargar la página para aplicar los cambios
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      }
    } catch (error) {
      console.error("Error al actualizar fechas:", error)
      setDebugInfo(`Error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

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
                  <div className="px-3 py-2 text-gray-500">
                    No hay fechas disponibles
                    <button
                      onClick={forceUpdateProductDates}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800 block"
                    >
                      Añadir fechas a productos
                    </button>
                  </div>
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
                <div className="px-3 py-2 text-gray-500">
                  No hay meses disponibles
                  <button
                    onClick={forceUpdateProductDates}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 block"
                  >
                    Añadir fechas a productos
                  </button>
                </div>
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

      {/* Información de depuración */}
      {debugInfo && <div className="text-xs text-gray-500 mt-1">{debugInfo}</div>}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Calendar, ChevronDown, ChevronUp } from "lucide-react"

interface DateFilterProps {
  onDateChange: (date: string | null) => void
  onReset: () => void
  activeStoreId: string // Añadir el ID de la tienda activa
}

export default function DateFilter({ onDateChange, onReset, activeStoreId }: DateFilterProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [availableDates, setAvailableDates] = useState<string[]>([])

  // Función para normalizar fechas (considerando zona horaria)
  const normalizeDate = (dateString: string): string => {
    try {
      // Crear fecha en la zona horaria local
      const date = new Date(dateString)

      // Obtener año, mes y día en la zona horaria local
      const year = date.getFullYear()
      const month = date.getMonth() + 1 // getMonth() devuelve 0-11
      const day = date.getDate()

      // Formatear como YYYY-MM-DD
      return `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`
    } catch (error) {
      console.error("Error al normalizar fecha:", dateString, error)
      return ""
    }
  }

  // Cargar fechas disponibles desde localStorage, filtradas por tienda activa
  useEffect(() => {
    try {
      const cachedProducts = localStorage.getItem("cached_products")
      if (cachedProducts) {
        const products = JSON.parse(cachedProducts)

        console.log("Productos en caché:", products.length)

        // Extraer fechas únicas de los productos
        const dates = products
          .filter((product: any) => {
            return product.createdAt // Solo verificar que tenga fecha
          })
          .map((product: any) => {
            // Normalizar la fecha considerando la zona horaria local
            return normalizeDate(product.createdAt)
          })
          .filter((date: string) => date !== "") // Eliminar fechas inválidas
          .filter(
            (date: string, index: number, self: string[]) => self.indexOf(date) === index, // Eliminar duplicados
          )
          .sort((a: string, b: string) => b.localeCompare(a)) // Ordenar por fecha descendente

        console.log("Fechas disponibles:", dates)
        setAvailableDates(dates)
      }
    } catch (error) {
      console.error("Error al cargar fechas disponibles:", error)
    }
  }, [activeStoreId]) // Actualizar cuando cambie la tienda activa

  const handleDateChange = (date: string | null) => {
    console.log("Fecha seleccionada:", date)
    if (date) {
      // Normalizar la fecha seleccionada
      const formattedDate = normalizeDate(date)
      console.log("Fecha normalizada:", formattedDate)
      onDateChange(formattedDate)
    } else {
      onDateChange(null)
    }
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    handleDateChange(date)
    setIsOpen(false)
  }

  const handleReset = () => {
    setSelectedDate(null)
    onReset()
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

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 bg-white border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <Calendar className="h-4 w-4" />
            {selectedDate ? formatDate(selectedDate) : "Filtrar por fecha"}
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {isOpen && (
            <div className="absolute z-10 mt-1 w-64 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {availableDates.length > 0 ? (
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
              )}
            </div>
          )}
        </div>

        {selectedDate && (
          <button onClick={handleReset} className="text-sm text-blue-600 hover:text-blue-800">
            Mostrar todos
          </button>
        )}
      </div>
    </div>
  )
}

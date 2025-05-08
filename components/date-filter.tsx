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

  // Cargar fechas disponibles desde localStorage, filtradas por tienda activa
  useEffect(() => {
    try {
      const cachedProducts = localStorage.getItem("cached_products")
      if (cachedProducts) {
        const products = JSON.parse(cachedProducts)

        // Extraer fechas únicas de los productos
        // Importante: No filtrar por tienda activa cuando estamos en la vista "Total"
        const dates = products
          .filter((product: any) => {
            return product.createdAt // Solo verificar que tenga fecha, no filtrar por tienda en "Total"
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

        setAvailableDates(dates)
      }
    } catch (error) {
      console.error("Error al cargar fechas disponibles:", error)
    }
  }, [activeStoreId]) // Actualizar cuando cambie la tienda activa

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    onDateChange(date)
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

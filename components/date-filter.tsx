"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Calendar, ChevronDown, ChevronUp } from "lucide-react"

interface DateFilterProps {
  onDateChange: (date: string | null) => void
  onReset: () => void
  activeStoreId: string // Añadir el ID de la tienda activa
  externalSelectedDate?: string | null // Fecha seleccionada externamente
}

export default function DateFilter({ onDateChange, onReset, activeStoreId, externalSelectedDate }: DateFilterProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [availableDates, setAvailableDates] = useState<string[]>([])

  // Sincronizar con fecha externa cuando cambie
  useEffect(() => {
    if (externalSelectedDate !== undefined) {
      setSelectedDate(externalSelectedDate)
    }
  }, [externalSelectedDate])

  // Cargar fechas disponibles desde localStorage, filtradas por tienda activa
  useEffect(() => {
    try {
      const cachedProducts = localStorage.getItem("cached_products")
      if (cachedProducts) {
        const products = JSON.parse(cachedProducts)

        // Filtrar productos por tienda activa (si no es "total", solo mostrar de esa tienda)
        const filteredProducts = products.filter((product: any) => {
          if (!product.createdAt) return false
          // Si es "total", mostrar todos los productos
          if (activeStoreId === "total") return true
          // Si no, solo mostrar productos de la tienda activa
          return product.storeId === activeStoreId
        })

        // Extraer fechas únicas de los productos filtrados
        const dates = filteredProducts
          .map((product: any) => {
            // Extraer solo la fecha (YYYY-MM-DD)
            const date = new Date(product.createdAt)
            return date.toISOString().split("T")[0]
          })
          .filter(
            (date: string, index: number, self: string[]) => self.indexOf(date) === index, // Eliminar duplicados
          )
          .sort((a: string, b: string) => b.localeCompare(a)) // Ordenar por fecha descendente

        setAvailableDates(dates)
      } else {
        setAvailableDates([])
      }
    } catch (error) {
      console.error("Error al cargar fechas disponibles:", error)
      setAvailableDates([])
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

  // Cuando se selecciona una fecha
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value
    console.log("Fecha seleccionada en DateFilter:", selectedDate)
    onDateChange(selectedDate)
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
            {selectedDate ? formatDate(selectedDate) : "Todas las fechas"}
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {isOpen && (
            <div className="absolute z-10 mt-1 w-64 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              <ul className="py-1">
                {/* Opcion para ver todas las fechas */}
                <li
                  onClick={() => {
                    setSelectedDate(null)
                    onDateChange(null)
                    setIsOpen(false)
                  }}
                  className={`px-3 py-2 cursor-pointer hover:bg-gray-100 font-medium ${
                    selectedDate === null ? "bg-blue-50 text-blue-600" : ""
                  }`}
                >
                  Todas las fechas
                </li>
                {availableDates.length > 0 ? (
                  availableDates.map((date) => (
                    <li
                      key={date}
                      onClick={() => handleDateSelect(date)}
                      className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                        selectedDate === date ? "bg-blue-50 text-blue-600" : ""
                      }`}
                    >
                      {formatDate(date)}
                    </li>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500">No hay otras fechas disponibles</div>
                )}
              </ul>
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

"use client"

import type React from "react"
import { useEffect, useState } from "react"
import type { Product } from "@/types"

interface DateFilterProps {
  products: Product[]
  onDateSelect: (date: string | null) => void
  onMonthSelect: (month: string | null) => void
  selectedDate: string | null
  selectedMonth: string | null
}

const DateFilter: React.FC<DateFilterProps> = ({
  products,
  onDateSelect,
  onMonthSelect,
  selectedDate,
  selectedMonth,
}) => {
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [filterType, setFilterType] = useState<"date" | "month">("date")
  const [debugInfo, setDebugInfo] = useState<string>("")

  useEffect(() => {
    // Extraer fechas únicas de los productos
    const dates = new Set<string>()
    const months = new Set<string>()

    products.forEach((product) => {
      if (product.createdAt) {
        const date = new Date(product.createdAt)
        const formattedDate = date.toISOString().split("T")[0]
        dates.add(formattedDate)

        const formattedMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        months.add(formattedMonth)
      }
    })

    // Convertir a arrays y ordenar
    const datesArray = Array.from(dates).sort()
    const monthsArray = Array.from(months).sort()

    setAvailableDates(datesArray)
    setAvailableMonths(monthsArray)

    // Guardar en localStorage para depuración
    localStorage.setItem("availableDates", JSON.stringify(datesArray))
    localStorage.setItem("availableMonths", JSON.stringify(monthsArray))

    // Actualizar información de depuración
    setDebugInfo(`Fechas: ${datesArray.length}, Meses: ${monthsArray.length}`)
  }, [products])

  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    onDateSelect(value === "" ? null : value)
    if (value !== "") {
      onMonthSelect(null)
    }
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    onMonthSelect(value === "" ? null : value)
    if (value !== "") {
      onDateSelect(null)
    }
  }

  const handleFilterTypeChange = (type: "date" | "month") => {
    setFilterType(type)
    if (type === "date") {
      onMonthSelect(null)
    } else {
      onDateSelect(null)
    }
  }

  const formatMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split("-")
    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, 1)
    return `${date.toLocaleString("default", { month: "long" })} ${year}`
  }

  const showDebugInfo = () => {
    alert(
      `Fechas disponibles: ${availableDates.length}\nMeses disponibles: ${availableMonths.length}\n\nFechas: ${JSON.stringify(availableDates)}\n\nMeses: ${JSON.stringify(availableMonths)}`,
    )
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Filtrar por fecha</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => handleFilterTypeChange("date")}
            className={`px-3 py-1 rounded-md ${filterType === "date" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            Día
          </button>
          <button
            onClick={() => handleFilterTypeChange("month")}
            className={`px-3 py-1 rounded-md ${filterType === "month" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            Mes
          </button>
        </div>
      </div>

      {filterType === "date" ? (
        <div>
          <select value={selectedDate || ""} onChange={handleDateChange} className="w-full p-2 border rounded-md">
            <option value="">Todos los días</option>
            {availableDates.map((date) => (
              <option key={date} value={date}>
                {new Date(date).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <select value={selectedMonth || ""} onChange={handleMonthChange} className="w-full p-2 border rounded-md">
            <option value="">Todos los meses</option>
            {availableMonths.map((month) => (
              <option key={month} value={month}>
                {formatMonthName(month)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-2 text-xs text-gray-500 flex justify-between">
        <span>{debugInfo}</span>
        <button onClick={showDebugInfo} className="text-blue-500 hover:underline">
          Debug
        </button>
      </div>
    </div>
  )
}

export default DateFilter

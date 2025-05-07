"use client"

import type React from "react"

import { Search, X } from "lucide-react"
import { useState } from "react"

interface SearchBarProps {
  onSearch: (term: string) => void
  placeholder?: string
  className?: string
}

export default function SearchBar({ onSearch, placeholder = "Buscar productos...", className = "" }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("")

  // Manejar cambios en el término de búsqueda
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    onSearch(value)
  }

  // Limpiar la búsqueda
  const clearSearch = () => {
    setSearchTerm("")
    onSearch("")
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-4 h-4 text-gray-500" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={handleChange}
          className="block w-full p-2 pl-10 pr-10 text-sm border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500"
          placeholder={placeholder}
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
            aria-label="Limpiar búsqueda"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

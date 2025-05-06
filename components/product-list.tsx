"use client"

import { useState } from "react"
import ProductItem from "./product-item"
import type { Product, Store } from "../types"

interface ProductListProps {
  products: Product[]
  activeStoreId: string
  onRemoveProduct: (id: string) => void
  onUpdateProduct: (id: string, title: string, price: number, quantity: number, image?: string) => void
  stores: Store[]
}

export default function ProductList({
  products,
  activeStoreId,
  onRemoveProduct,
  onUpdateProduct,
  stores,
}: ProductListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "price" | "name">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Filtrar productos por tienda activa y término de búsqueda
  const filteredProducts = products.filter((product) => {
    // Si estamos en la vista "Total", mostrar todos los productos
    const storeMatch = activeStoreId === "total" || product.storeId === activeStoreId

    // Filtrar por término de búsqueda (ignorar mayúsculas/minúsculas)
    const searchMatch = product.title.toLowerCase().includes(searchTerm.toLowerCase())

    return storeMatch && searchMatch
  })

  // Ordenar productos
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "date") {
      // Ordenar por fecha (más reciente primero)
      const dateA = new Date(a.createdAt || 0).getTime()
      const dateB = new Date(b.createdAt || 0).getTime()
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA
    } else if (sortBy === "price") {
      // Ordenar por precio
      return sortOrder === "asc" ? a.price - b.price : b.price - a.price
    } else {
      // Ordenar por nombre
      return sortOrder === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
    }
  })

  // Función para cambiar el criterio de ordenación
  const handleSortChange = (newSortBy: "date" | "price" | "name") => {
    if (sortBy === newSortBy) {
      // Si ya estamos ordenando por este criterio, cambiar el orden
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      // Si cambiamos el criterio, establecer el orden predeterminado
      setSortBy(newSortBy)
      setSortOrder(newSortBy === "date" ? "desc" : "asc") // Más reciente primero para fechas, ascendente para lo demás
    }
  }

  // Función para obtener el nombre de la tienda a partir del ID
  const getStoreName = (storeId: string): string => {
    const store = stores.find((s) => s.id === storeId)
    return store ? store.name : "Tienda desconocida"
  }

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <span className="text-sm text-gray-600">Ordenar por:</span>
        <button
          onClick={() => handleSortChange("date")}
          className={`text-sm px-2 py-1 rounded ${
            sortBy === "date" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
          }`}
        >
          Fecha {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
        </button>
        <button
          onClick={() => handleSortChange("price")}
          className={`text-sm px-2 py-1 rounded ${
            sortBy === "price" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
          }`}
        >
          Precio {sortBy === "price" && (sortOrder === "asc" ? "↑" : "↓")}
        </button>
        <button
          onClick={() => handleSortChange("name")}
          className={`text-sm px-2 py-1 rounded ${
            sortBy === "name" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
          }`}
        >
          Nombre {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
        </button>
      </div>

      {sortedProducts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm
            ? "No se encontraron productos que coincidan con la búsqueda."
            : "No hay productos en esta tienda."}
        </div>
      ) : (
        <div>
          {sortedProducts.map((product) => (
            <ProductItem
              key={product.id}
              id={product.id}
              title={product.title}
              price={product.price}
              quantity={product.quantity}
              image={product.image}
              storeId={product.storeId}
              onRemove={onRemoveProduct}
              onUpdate={onUpdateProduct}
              // Solo mostrar el nombre de la tienda en la vista "Total"
              storeName={activeStoreId === "total" ? getStoreName(product.storeId) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}

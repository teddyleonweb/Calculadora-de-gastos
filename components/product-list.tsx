"use client"

import { useState } from "react"
import type { Product, Store } from "../types"
import { Edit2, Check, X, Trash2, ShoppingBag } from "lucide-react"

interface ProductListProps {
  products: Product[]
  activeStoreId: string
  onRemoveProduct: (id: string) => void
  onUpdateProduct: (id: string, title: string, price: number, quantity: number) => void
  stores: Store[] // Añadir la lista de tiendas para mostrar el nombre
}

export default function ProductList({
  products,
  activeStoreId,
  onRemoveProduct,
  onUpdateProduct,
  stores,
}: ProductListProps) {
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState<string>("")
  const [editPrice, setEditPrice] = useState<string>("")
  const [editQuantity, setEditQuantity] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Filtrar productos por tienda activa
  const filteredProducts =
    activeStoreId === "total" ? products : products.filter((product) => product.storeId === activeStoreId)

  const startEditing = (product: Product) => {
    setEditingProduct(product.id)
    setEditTitle(product.title)
    setEditPrice(product.price.toFixed(2))
    setEditQuantity(product.quantity.toString())
    setErrorMessage(null)
  }

  const cancelEditing = () => {
    setEditingProduct(null)
    setErrorMessage(null)
  }

  const saveEditing = (id: string) => {
    // Normalizar el precio: si ya tiene punto, dejarlo; si tiene coma, convertirla a punto
    let normalizedPrice = editPrice
    if (!normalizedPrice.includes(".") && normalizedPrice.includes(",")) {
      normalizedPrice = normalizedPrice.replace(",", ".")
    }

    const price = Number.parseFloat(normalizedPrice)
    const quantity = Number.parseInt(editQuantity, 10)

    if (!editTitle.trim()) {
      setErrorMessage("Por favor ingrese un título para el producto")
      return
    }

    if (isNaN(price) || price <= 0) {
      setErrorMessage("Por favor ingrese un precio válido")
      return
    }

    if (isNaN(quantity) || quantity <= 0) {
      setErrorMessage("Por favor ingrese una cantidad válida")
      return
    }

    onUpdateProduct(id, editTitle, price, quantity)
    setEditingProduct(null)
    setErrorMessage(null)
  }

  // Función para obtener el nombre de la tienda a partir del ID
  const getStoreName = (storeId: string): string => {
    const store = stores.find((s) => s.id === storeId)
    return store ? store.name : "Desconocida"
  }

  if (filteredProducts.length === 0) {
    return <p className="text-gray-500">No hay productos añadidos aún</p>
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {errorMessage && <div className="p-2 bg-red-100 border border-red-400 text-red-700 rounded">{errorMessage}</div>}

      {filteredProducts.map((product) => (
        <div key={product.id} className="border rounded-lg shadow-sm overflow-hidden bg-white">
          {editingProduct === product.id ? (
            <div className="flex flex-col sm:flex-row w-full">
              {/* Imagen del producto en modo edición */}
              {product.image && (
                <div className="sm:w-1/4 md:w-1/5 p-2 flex items-center justify-center bg-gray-50">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt="Vista previa"
                    className="max-h-24 object-contain"
                  />
                </div>
              )}

              {/* Formulario de edición */}
              <div className={`p-3 space-y-3 flex-grow ${product.image ? "sm:w-3/4 md:w-4/5" : "w-full"}`}>
                <div>
                  <label htmlFor={`edit-title-${product.id}`} className="text-xs text-gray-500 block">
                    Nombre del producto
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    id={`edit-title-${product.id}`}
                    className="border border-gray-300 rounded px-2 py-1 w-full text-sm md:text-base"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="flex-1 min-w-[120px]">
                    <label htmlFor={`edit-price-${product.id}`} className="text-xs text-gray-500 block">
                      Precio
                    </label>
                    <input
                      type="text"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      id={`edit-price-${product.id}`}
                      className="border border-gray-300 rounded px-2 py-1 w-full text-right text-sm md:text-base"
                    />
                  </div>
                  <div className="w-24">
                    <label htmlFor={`edit-quantity-${product.id}`} className="text-xs text-gray-500 block">
                      Cant.
                    </label>
                    <input
                      type="number"
                      value={editQuantity}
                      onChange={(e) => setEditQuantity(e.target.value)}
                      min="1"
                      id={`edit-quantity-${product.id}`}
                      className="border border-gray-300 rounded px-2 py-1 w-full text-center text-sm md:text-base"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => saveEditing(product.id)}
                    className="px-3 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200 flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" /> Guardar
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 flex items-center gap-1"
                  >
                    <X className="w-4 h-4" /> Cancelar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row w-full">
              {/* Imagen del producto */}
              {product.image && (
                <div className="sm:w-1/4 md:w-1/5 p-2 flex items-center justify-center bg-gray-50">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.title}
                    className="max-h-24 object-contain"
                  />
                </div>
              )}

              {/* Información del producto */}
              <div className={`p-3 flex-grow ${product.image ? "sm:w-3/4 md:w-4/5" : "w-full"}`}>
                <h3 className="font-medium text-base md:text-lg line-clamp-2 mb-1" title={product.title}>
                  {product.title}
                </h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <div>
                    <span className="text-gray-500">Precio:</span> ${product.price.toFixed(2)}
                  </div>
                  <div>
                    <span className="text-gray-500">Cantidad:</span> {product.quantity}
                  </div>
                  <div className="font-semibold">
                    <span className="text-gray-500">Subtotal:</span> ${(product.price * product.quantity).toFixed(2)}
                  </div>
                  {/* Mostrar la tienda solo en la vista "Total" */}
                  {activeStoreId === "total" && (
                    <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full text-xs">
                      <ShoppingBag size={12} />
                      <span>{getStoreName(product.storeId)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex sm:flex-col justify-end p-2 sm:border-l border-gray-100 bg-gray-50">
                <button
                  onClick={() => startEditing(product)}
                  className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 flex items-center gap-1 mb-1"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Editar</span>
                </button>
                <button
                  onClick={() => onRemoveProduct(product.id)}
                  className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 flex items-center gap-1"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Eliminar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

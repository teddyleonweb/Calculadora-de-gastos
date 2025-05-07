"use client"

import { useState, useMemo } from "react"
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
  // Estados básicos
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState<string>("")
  const [editPrice, setEditPrice] = useState<string>("")
  const [editQuantity, setEditQuantity] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
  const [showImageUploader, setShowImageUploader] = useState<boolean>(false)
  const [editImage, setEditImage] = useState<string | null>(null)
  const [sortField, setSortField] = useState<"title" | "price" | "date">("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Filtrar productos según la tienda activa
  const filteredProducts = useMemo(() => {
    if (activeStoreId === "total") {
      return products
    } else {
      return products.filter((product) => product.storeId === activeStoreId)
    }
  }, [products, activeStoreId])

  // Versión simplificada para pruebas
  return (
    <div className="grid grid-cols-1 gap-4">
      {filteredProducts.length === 0 ? (
        <p className="text-gray-500">No hay productos para mostrar</p>
      ) : (
        filteredProducts.map((product) => (
          <div key={product.id} className="border p-4 rounded">
            <h3>{product.title}</h3>
            <p>Precio: ${product.price.toFixed(2)}</p>
            <p>Cantidad: {product.quantity}</p>
          </div>
        ))
      )}
    </div>
  )
}

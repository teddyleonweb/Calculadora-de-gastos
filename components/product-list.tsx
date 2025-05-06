"use client"

import { useState, useEffect } from "react"
import { ProductService } from "../services/product-service"
import { StoreService } from "../services/store-service"
import type { Store, Product } from "../types"
import ProductItem from "./product-item"
import { Search, SortAsc, SortDesc } from "lucide-react"

interface ProductListProps {
  userId: string
  selectedStoreId?: string
  onProductsLoaded?: (products: Product[]) => void
}

export default function ProductList({ userId, selectedStoreId, onProductsLoaded }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [sortField, setSortField] = useState<"title" | "price" | "date">("date")

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const fetchedProducts = await ProductService.getProducts(userId)
      setProducts(fetchedProducts)
      if (onProductsLoaded) {
        onProductsLoaded(fetchedProducts)
      }
      setError(null)
    } catch (error) {
      console.error("Error al cargar productos:", error)
      setError("Error al cargar productos. Inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const fetchStores = async () => {
    try {
      const fetchedStores = await StoreService.getStores(userId)
      setStores(fetchedStores)
    } catch (error) {
      console.error("Error al cargar tiendas:", error)
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchStores()
  }, [userId])

  const handleRemoveProduct = async (productId: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      try {
        await ProductService.deleteProduct(userId, productId)
        setProducts((prevProducts) => prevProducts.filter((product) => product.id !== productId))
      } catch (error) {
        console.error("Error al eliminar producto:", error)
        alert("Error al eliminar producto. Inténtalo de nuevo.")
      }
    }
  }

  const handleUpdateProduct = async (
    productId: string,
    title: string,
    price: number,
    quantity: number,
    image?: string,
  ) => {
    try {
      await ProductService.updateProduct(userId, productId, {
        title,
        price,
        quantity,
        image,
      })

      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.id === productId
            ? {
                ...product,
                title,
                price,
                quantity,
                image,
              }
            : product,
        ),
      )
    } catch (error) {
      console.error("Error al actualizar producto:", error)
      alert("Error al actualizar producto. Inténtalo de nuevo.")
    }
  }

  const getStoreName = (storeId: string) => {
    const store = stores.find((s) => s.id === storeId)
    return store ? store.name : "Tienda desconocida"
  }

  const filteredProducts = products
    .filter((product) => {
      // Filtrar por tienda si hay una seleccionada
      if (selectedStoreId && selectedStoreId !== "all" && product.storeId !== selectedStoreId) {
        return false
      }

      // Filtrar por término de búsqueda
      if (searchTerm) {
        return product.title.toLowerCase().includes(searchTerm.toLowerCase())
      }

      return true
    })
    .sort((a, b) => {
      // Ordenar productos
      if (sortField === "title") {
        return sortOrder === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
      } else if (sortField === "price") {
        return sortOrder === "asc" ? a.price - b.price : b.price - a.price
      } else {
        // Por fecha (createdAt)
        const dateA = new Date(a.createdAt || 0).getTime()
        const dateB = new Date(b.createdAt || 0).getTime()
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA
      }
    })

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as "title" | "price" | "date")}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="date">Fecha</option>
            <option value="title">Nombre</option>
            <option value="price">Precio</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="border border-gray-300 rounded-md px-3 py-2 flex items-center"
            title={sortOrder === "asc" ? "Ordenar descendente" : "Ordenar ascendente"}
          >
            {sortOrder === "asc" ? <SortAsc className="h-5 w-5" /> : <SortDesc className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4">Cargando productos...</div>
      ) : error ? (
        <div className="text-center py-4 text-red-500">{error}</div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-4">
          {searchTerm
            ? "No se encontraron productos que coincidan con la búsqueda."
            : selectedStoreId && selectedStoreId !== "all"
              ? "No hay productos en esta tienda."
              : "No hay productos. Añade uno nuevo."}
        </div>
      ) : (
        <div>
          {filteredProducts.map((product) => (
            <ProductItem
              key={product.id}
              id={product.id}
              title={product.title}
              price={product.price}
              quantity={product.quantity}
              image={product.image}
              storeId={product.storeId}
              onRemove={handleRemoveProduct}
              onUpdate={handleUpdateProduct}
              storeName={selectedStoreId === "all" ? getStoreName(product.storeId) : undefined}
              refreshProducts={fetchProducts}
            />
          ))}
        </div>
      )}
    </div>
  )
}

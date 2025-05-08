"use client"

import type React from "react"
import { useEffect, useState } from "react"
import type { Product } from "@/types"
import ImageWithFallback from "./image-with-fallback"

interface ProductListProps {
  products: Product[]
  selectedStore: string
  onDeleteProduct: (productId: string) => void
  selectedDate: string | null
  selectedMonth: string | null
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  selectedStore,
  onDeleteProduct,
  selectedDate,
  selectedMonth,
}) => {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [storeProducts, setStoreProducts] = useState<{ [key: string]: Product[] }>({})

  useEffect(() => {
    // Filtrar productos por fecha o mes si están seleccionados
    let filtered = [...products]

    if (selectedDate) {
      filtered = filtered.filter((product) => {
        if (!product.createdAt) return false
        const productDate = new Date(product.createdAt)
        const formattedProductDate = productDate.toISOString().split("T")[0]
        return formattedProductDate === selectedDate
      })
    } else if (selectedMonth) {
      filtered = filtered.filter((product) => {
        if (!product.createdAt) return false
        const productDate = new Date(product.createdAt)
        const formattedProductMonth = `${productDate.getFullYear()}-${String(productDate.getMonth() + 1).padStart(2, "0")}`
        return formattedProductMonth === selectedMonth
      })
    }

    // Si estamos en la vista de una tienda específica, filtrar por esa tienda
    if (selectedStore !== "total") {
      filtered = filtered.filter((product) => product.storeName === selectedStore)
      setFilteredProducts(filtered)
    } else {
      // En la vista "Total", agrupar productos por tienda
      const groupedByStore: { [key: string]: Product[] } = {}

      filtered.forEach((product) => {
        const storeName = product.storeName || "Sin tienda"
        if (!groupedByStore[storeName]) {
          groupedByStore[storeName] = []
        }
        groupedByStore[storeName].push(product)
      })

      setStoreProducts(groupedByStore)
      setFilteredProducts(filtered)
    }
  }, [products, selectedStore, selectedDate, selectedMonth])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  // Si estamos en la vista de una tienda específica
  if (selectedStore !== "total") {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">{selectedStore}</h2>
        {filteredProducts.length === 0 ? (
          <p className="text-gray-500">No hay productos para mostrar</p>
        ) : (
          <ul className="space-y-4">
            {filteredProducts.map((product) => (
              <li key={product.id} className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  {product.imageUrl && (
                    <div className="w-16 h-16 relative">
                      <ImageWithFallback
                        src={product.imageUrl || "/placeholder.svg"}
                        alt={product.name || "Producto"}
                        width={64}
                        height={64}
                        className="rounded-md object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">{product.name || "Producto sin nombre"}</h3>
                    <p className="text-green-600 font-medium">${product.price}</p>
                    {product.createdAt && <p className="text-xs text-gray-500">{formatDate(product.createdAt)}</p>}
                  </div>
                </div>
                <button onClick={() => onDeleteProduct(product.id)} className="text-red-500 hover:text-red-700">
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  // En la vista "Total", mostrar productos agrupados por tienda
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Todos los Productos</h2>

      {Object.keys(storeProducts).length === 0 ? (
        <p className="text-gray-500">No hay productos para mostrar en el período seleccionado</p>
      ) : (
        Object.entries(storeProducts).map(([storeName, products]) => (
          <div key={storeName} className="space-y-4">
            <h3 className="text-lg font-semibold">{storeName}</h3>
            <ul className="space-y-4">
              {products.map((product) => (
                <li key={product.id} className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    {product.imageUrl && (
                      <div className="w-16 h-16 relative">
                        <ImageWithFallback
                          src={product.imageUrl || "/placeholder.svg"}
                          alt={product.name || "Producto"}
                          width={64}
                          height={64}
                          className="rounded-md object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">{product.name || "Producto sin nombre"}</h3>
                      <p className="text-green-600 font-medium">${product.price}</p>
                      {product.createdAt && <p className="text-xs text-gray-500">{formatDate(product.createdAt)}</p>}
                    </div>
                  </div>
                  <button onClick={() => onDeleteProduct(product.id)} className="text-red-500 hover:text-red-700">
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  )
}

export default ProductList

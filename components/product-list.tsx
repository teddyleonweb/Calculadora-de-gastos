"use client"

import { useState, useEffect } from "react"
import type { Product, Store } from "../types"
import { Edit2, Check, X, Trash2, ShoppingBag, ImageIcon, Calendar } from "lucide-react"
import ImageModal from "./image-modal"
import ImageWithFallback from "./image-with-fallback"
import ImageUploader from "./image-uploader"

interface ProductListProps {
  products: Product[]
  activeStoreId: string
  onRemoveProduct: (id: string) => void
  onUpdateProduct: (id: string, title: string, price: number, quantity: number, image?: string) => void
  stores: Store[]
  searchTerm?: string
  exchangeRates: { bcv: string; parallel: string }
  dateFilter?: string | null
  monthFilter?: string | null
}

export default function ProductList({
  products,
  activeStoreId,
  onRemoveProduct,
  onUpdateProduct,
  stores,
  searchTerm = "",
  exchangeRates,
  dateFilter = null,
  monthFilter = null,
}: ProductListProps) {
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
  const [productsWithoutDates, setProductsWithoutDates] = useState<number>(0)

  // Verificar productos sin fechas
  useEffect(() => {
    const withoutDates = products.filter((product) => !product.createdAt).length
    setProductsWithoutDates(withoutDates)

    if (withoutDates > 0) {
      console.log(`Advertencia: ${withoutDates} productos no tienen fecha de creación`)
    }
  }, [products])

  const getStoreName = (storeId: string): string => {
    const store = stores.find((s) => s.id === storeId)
    return store ? store.name : "Desconocida"
  }

  const sortProducts = (products: Product[]): Product[] => {
    return [...products].sort((a, b) => {
      if (sortField === "title") {
        const comparison = a.title.localeCompare(b.title)
        return sortDirection === "asc" ? comparison : -comparison
      } else if (sortField === "price") {
        const subtotalA = a.price * a.quantity
        const subtotalB = b.price * b.quantity
        const comparison = subtotalA - subtotalB
        return sortDirection === "asc" ? comparison : -comparison
      } else if (sortField === "date") {
        // Manejar productos sin fecha (ponerlos al final)
        if (!a.createdAt && !b.createdAt) return 0
        if (!a.createdAt) return sortDirection === "asc" ? 1 : -1
        if (!b.createdAt) return sortDirection === "asc" ? -1 : 1

        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        const comparison = dateA - dateB
        return sortDirection === "asc" ? comparison : -comparison
      }
      return 0
    })
  }

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "Fecha desconocida"

    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Fecha inválida"

      const adjustedDate = new Date(date.getTime() - 4 * 60 * 60 * 1000)
      const formatter = new Intl.DateTimeFormat("es", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })

      return formatter.format(adjustedDate) + " GMT-4"
    } catch (error) {
      console.error("Error al formatear fecha:", error)
      return "Error en fecha"
    }
  }

  const openImageModal = (imageSrc: string) => {
    console.log("Abriendo modal con imagen:", imageSrc)
    setSelectedImage(imageSrc)
  }

  const closeImageModal = () => {
    setSelectedImage(null)
  }

  const handleDelete = async (id: string) => {
    setDeletingProductId(id)
    try {
      await onRemoveProduct(id)
    } finally {
      setDeletingProductId(null)
    }
  }

  const renderSortControls = () => {
    return (
      <div className="flex items-center gap-2 mb-3 bg-gray-50 p-2 rounded-lg">
        <span className="text-sm text-gray-600">Ordenar por:</span>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => {
              setSortField("date")
              setSortDirection(sortField === "date" && sortDirection === "desc" ? "asc" : "desc")
            }}
            className={`px-2 py-1 text-xs rounded-full ${
              sortField === "date" ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-700"
            }`}
          >
            Fecha {sortField === "date" && (sortDirection === "asc" ? "↑" : "↓")}
          </button>
          <button
            onClick={() => {
              setSortField("price")
              setSortDirection(sortField === "price" && sortDirection === "desc" ? "asc" : "desc")
            }}
            className={`px-2 py-1 text-xs rounded-full ${
              sortField === "price" ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-700"
            }`}
          >
            Subtotal {sortField === "price" && (sortDirection === "asc" ? "↑" : "↓")}
          </button>
          <button
            onClick={() => {
              setSortField("title")
              setSortDirection(sortField === "title" && sortDirection === "desc" ? "asc" : "desc")
            }}
            className={`px-2 py-1 text-xs rounded-full ${
              sortField === "title" ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-700"
            }`}
          >
            Nombre {sortField === "title" && (sortDirection === "asc" ? "↑" : "↓")}
          </button>
        </div>
      </div>
    )
  }

  // Función para añadir fechas a todos los productos
  const addDatesToAllProducts = () => {
    try {
      const cachedProducts = localStorage.getItem("cached_products")
      if (cachedProducts) {
        const allProducts = JSON.parse(cachedProducts)

        // Añadir fechas a todos los productos
        const updatedProducts = allProducts.map((product: any) => {
          if (!product.createdAt) {
            // Generar una fecha aleatoria en los últimos 30 días
            const randomDays = Math.floor(Math.random() * 30)
            const date = new Date()
            date.setDate(date.getDate() - randomDays)

            return {
              ...product,
              createdAt: date.toISOString(),
            }
          }
          return product
        })

        // Guardar productos actualizados en localStorage
        localStorage.setItem("cached_products", JSON.stringify(updatedProducts))
        console.log("Productos actualizados con fechas:", updatedProducts.length)

        // Mostrar mensaje de éxito
        setErrorMessage("Productos actualizados con fechas. Recargando...")

        // Recargar la página para aplicar los cambios
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      }
    } catch (error) {
      console.error("Error al actualizar fechas:", error)
      setErrorMessage(`Error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const filteredProducts = sortProducts(
    products
      .filter((product) => activeStoreId === "total" || product.storeId === activeStoreId)
      .filter((product) => {
        if (!searchTerm) return true
        const term = searchTerm.toLowerCase()
        return product.title.toLowerCase().includes(term)
      })
      .filter((product) => {
        if (!dateFilter && !monthFilter) return true
        if (!product.createdAt) return false

        const productDate = new Date(product.createdAt).toISOString().split("T")[0]

        if (dateFilter) {
          return productDate === dateFilter
        }

        if (monthFilter) {
          const productMonth = productDate.substring(0, 7)
          return productMonth === monthFilter
        }

        return true
      }),
  )

  const handleImageCapture = (image: string) => {
    setEditImage(image)
    setShowImageUploader(false)
  }

  const saveEditing = async (id: string) => {
    if (!editTitle.trim() || !editPrice.trim() || !editQuantity.trim()) {
      setErrorMessage("Todos los campos son obligatorios")
      return
    }

    const price = Number.parseFloat(editPrice.replace(",", "."))
    const quantity = Number.parseInt(editQuantity)

    if (isNaN(price) || isNaN(quantity)) {
      setErrorMessage("Precio y cantidad deben ser números válidos")
      return
    }

    setErrorMessage(null)
    await onUpdateProduct(id, editTitle, price, quantity, editImage)
    setEditingProduct(null)
    setEditImage(null)
  }

  const cancelEditing = () => {
    setEditingProduct(null)
    setErrorMessage(null)
    setEditImage(null)
  }

  const startEditing = (product: Product) => {
    setEditingProduct(product.id)
    setEditTitle(product.title)
    setEditPrice(product.price.toString())
    setEditQuantity(product.quantity.toString())
    setEditImage(product.image || null)
  }

  const convertToBolivares = (dollarAmount: number, rate: string): string => {
    const rateValue = Number.parseFloat(rate.replace(",", "."))
    if (isNaN(rateValue) || rateValue === 0) return "N/A"
    return (dollarAmount * rateValue).toFixed(2)
  }

  if (filteredProducts.length === 0) {
    if (activeStoreId === "total" || activeStoreId === stores.find((store) => store.name === "Total")?.id) {
      if (dateFilter) {
        return (
          <p className="text-gray-500">
            No hay productos para el día{" "}
            {new Date(dateFilter).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )
      } else if (monthFilter) {
        const [year, month] = monthFilter.split("-")
        const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, 1)
        return (
          <p className="text-gray-500">
            No hay productos para el mes de{" "}
            {date.toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
            })}
          </p>
        )
      }
      return <p className="text-gray-500">Gastos por tienda</p>
    }

    if (dateFilter) {
      return (
        <p className="text-gray-500">
          No hay productos en esta tienda para el día{" "}
          {new Date(dateFilter).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      )
    } else if (monthFilter) {
      const [year, month] = monthFilter.split("-")
      const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, 1)
      return (
        <p className="text-gray-500">
          No hay productos en esta tienda para el mes de{" "}
          {date.toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
          })}
        </p>
      )
    }

    return <p className="text-gray-500">No hay productos añadidos aún</p>
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {filteredProducts.length > 0 && renderSortControls()}

      {errorMessage && <div className="p-2 bg-red-100 border border-red-400 text-red-700 rounded">{errorMessage}</div>}

      {/* Mostrar advertencia si hay productos sin fechas */}
      {productsWithoutDates > 0 && (
        <div className="p-2 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded flex justify-between items-center">
          <span>
            <Calendar className="inline-block w-4 h-4 mr-1" />
            {productsWithoutDates} productos no tienen fecha de creación
          </span>
          <button
            onClick={addDatesToAllProducts}
            className="bg-yellow-200 hover:bg-yellow-300 text-yellow-800 px-2 py-1 rounded text-xs"
          >
            Añadir fechas
          </button>
        </div>
      )}

      <ImageModal imageSrc={selectedImage} onClose={closeImageModal} />

      {filteredProducts.map((product) => (
        <div key={product.id} className="border rounded-lg shadow-sm overflow-hidden bg-white">
          {editingProduct === product.id ? (
            <div className="flex flex-col sm:flex-row w-full">
              <div className="sm:w-1/4 md:w-1/5 p-2 flex flex-col items-center justify-center bg-gray-50">
                {showImageUploader ? (
                  <div className="w-full">
                    <ImageUploader onImageCapture={handleImageCapture} />
                    <button
                      onClick={() => setShowImageUploader(false)}
                      className="mt-2 bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded text-xs"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : editImage ? (
                  <div className="relative">
                    <ImageWithFallback
                      src={editImage || "/placeholder.svg"}
                      alt="Vista previa"
                      className="max-h-24 object-contain cursor-pointer"
                      onClick={() => {
                        if (editImage) openImageModal(editImage)
                      }}
                    />
                    <button
                      onClick={() => setEditImage(null)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                      title="Eliminar imagen"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowImageUploader(true)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-1 px-3 rounded text-sm flex items-center"
                  >
                    <ImageIcon className="w-4 h-4 mr-1" />
                    Añadir imagen
                  </button>
                )}
              </div>

              <div className="p-3 space-y-3 flex-grow sm:w-3/4 md:w-4/5">
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
                      inputMode="decimal"
                      value={editPrice}
                      onChange={(e) => {
                        const value = e.target.value
                        const filteredValue = value.replace(/[^0-9.,]/g, "")
                        setEditPrice(filteredValue)
                      }}
                      id={`edit-price-${product.id}`}
                      className="border border-gray-300 rounded px-2 py-1 w-full text-right text-sm md:text-base"
                    />
                  </div>
                  <div className="w-24">
                    <label htmlFor={`edit-quantity-${product.id}`} className="text-xs text-gray-500 block">
                      Cant.
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editQuantity}
                      onChange={(e) => {
                        const value = e.target.value
                        const filteredValue = value.replace(/[^0-9]/g, "")
                        setEditQuantity(filteredValue)
                      }}
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
              {product.image && (
                <div className="sm:w-1/4 md:w-1/5 p-2 flex items-center justify-center bg-gray-50">
                  <ImageWithFallback
                    src={product.image || "/placeholder.svg"}
                    alt={product.title}
                    className="max-h-24 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => {
                      console.log("Clic en imagen del producto:", product.image)
                      if (product.image) openImageModal(product.image)
                    }}
                    fallbackSrc="/placeholder.svg"
                  />
                </div>
              )}

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
                  <div className="w-full mt-1 grid grid-cols-2 gap-2 text-xs bg-gray-50 p-1 rounded">
                    <div>
                      <span className="text-gray-500">BCV:</span> Bs.{" "}
                      {convertToBolivares(product.price * product.quantity, exchangeRates.bcv)}
                    </div>
                    <div>
                      <span className="text-gray-500">Paralelo:</span> Bs.{" "}
                      {convertToBolivares(product.price * product.quantity, exchangeRates.parallel)}
                    </div>
                  </div>

                  {/* Mostrar la fecha de creación con un icono de calendario */}
                  <div className="text-xs text-gray-500 mt-1 w-full flex items-center">
                    <Calendar className="w-3 h-3 mr-1 inline-block" />
                    Añadido: {product.createdAt ? formatDate(product.createdAt) : "Fecha desconocida"}
                  </div>

                  {/* Mostrar la tienda solo en la vista "Total" */}
                  {activeStoreId === "total" && (
                    <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full text-xs">
                      {stores.find((s) => s.id === product.storeId)?.image ? (
                        <div className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0">
                          <ImageWithFallback
                            src={stores.find((s) => s.id === product.storeId)?.image || "/placeholder.svg"}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <ShoppingBag size={12} />
                      )}
                      <span>{getStoreName(product.storeId)}</span>
                    </div>
                  )}
                </div>
              </div>

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
                  onClick={() => handleDelete(product.id)}
                  className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 flex items-center gap-1"
                  title="Eliminar"
                  disabled={deletingProductId === product.id}
                >
                  {deletingProductId === product.id ? (
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">
                    {deletingProductId === product.id ? "Eliminando..." : "Eliminar"}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

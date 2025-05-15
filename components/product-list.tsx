"use client"

import { useState } from "react"
import type { Product, Store } from "../types"
import { Edit2, Check, X, Trash2, ShoppingBag, ImageIcon, AlertTriangle } from "lucide-react"
import ImageModal from "./image-modal"
import ImageWithFallback from "./image-with-fallback"
import ImageUploader from "./image-uploader"

// Modificar la interfaz ProductListProps para incluir el filtro de fecha
interface ProductListProps {
  products: Product[]
  activeStoreId: string
  onRemoveProduct: (id: string) => void
  onUpdateProduct: (id: string, title: string, price: number, quantity: number, image?: string) => void
  stores: Store[] // Añadir la lista de tiendas para mostrar el nombre
  searchTerm?: string // Añadir el término de búsqueda como prop opcional
  exchangeRates: { bcv: string; parallel: string } // Añadir las tasas de cambio
  dateFilter?: string | null // Añadir el filtro de fecha
  hideNoProductsMessage?: boolean // Añadir esta propiedad
  storeSubtotals: { [key: string]: number } // Añadir los subtotales por tienda
}

// Componente para mostrar el resumen del total
const TotalSummaryCard = ({
  activeStoreId,
  stores,
  storeSubtotals,
  exchangeRates,
  dateFilter,
  products,
}: {
  activeStoreId: string
  stores: Store[]
  storeSubtotals: { [key: string]: number }
  exchangeRates: { bcv: string; parallel: string }
  dateFilter?: string | null
  products: Product[]
}) => {
  // Función para convertir dólares a bolívares
  const convertToBolivares = (dollarAmount: number, rate: string): string => {
    const rateValue = Number.parseFloat(rate.replace(",", "."))
    if (isNaN(rateValue) || rateValue === 0) return "N/A"
    return (dollarAmount * rateValue).toFixed(2)
  }

  // Función para comparar si dos fechas son el mismo día
  const isSameDay = (date1: string, date2: string): boolean => {
    try {
      const d1 = new Date(date1)
      const d2 = new Date(date2)

      return (
        d1.getUTCFullYear() === d2.getUTCFullYear() &&
        d1.getUTCMonth() === d2.getUTCMonth() &&
        d1.getUTCDate() === d2.getUTCDate()
      )
    } catch (error) {
      console.error("Error al comparar fechas:", error)
      return false
    }
  }

  // Calcular el total filtrado si hay un filtro de fecha
  const calculateFilteredTotal = () => {
    if (!dateFilter) return null

    // Filtrar productos por fecha
    const filteredProducts = products.filter((product) => {
      if (!product.createdAt) return false

      // En la vista Total, incluir productos de todas las tiendas
      // En otras vistas, solo incluir productos de la tienda activa
      const belongsToActiveStore = activeStoreId === "total" || product.storeId === activeStoreId

      const isMatchingDate = isSameDay(product.createdAt, dateFilter)

      return belongsToActiveStore && isMatchingDate
    })

    // Calcular total de productos filtrados
    const filteredTotal = filteredProducts.reduce((sum, product) => {
      return sum + product.price * product.quantity
    }, 0)

    return {
      total: filteredTotal,
      count: filteredProducts.length,
    }
  }

  const filteredData = calculateFilteredTotal()

  // Determinar qué total mostrar basado en si hay un filtro de fecha
  const totalToShow = dateFilter
    ? filteredData?.total || 0
    : activeStoreId === "total"
      ? Object.values(storeSubtotals).reduce((sum, subtotal) => sum + subtotal, 0)
      : storeSubtotals[activeStoreId] || 0

  // Determinar el título
  const title =
    activeStoreId === "total"
      ? "Total General:"
      : `Total en ${stores.find((s) => s.id === activeStoreId)?.name || "esta tienda"}:`

  // Determinar el número de productos
  const productCount = dateFilter
    ? filteredData?.count || 0
    : activeStoreId === "total"
      ? products.length
      : products.filter((p) => p.storeId === activeStoreId).length

  return (
    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
      <h3 className="font-medium text-blue-800">
        {title}
        {dateFilter && (
          <span>
            {" "}
            del día{" "}
            {new Date(dateFilter).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        )}
      </h3>
      <div className="mt-2 grid grid-cols-1 gap-1">
        <div className="font-bold text-xl">${totalToShow.toFixed(2)}</div>
        <div className="text-sm text-gray-600">
          <div>BCV: Bs. {convertToBolivares(totalToShow, exchangeRates.bcv)}</div>
          <div>Paralelo: Bs. {convertToBolivares(totalToShow, exchangeRates.parallel)}</div>
        </div>
        <div className="text-sm text-gray-600 mt-1">
          {productCount} producto{productCount !== 1 ? "s" : ""}
          {dateFilter ? " en este día" : ""}
        </div>
      </div>
    </div>
  )
}

// Añadir un nuevo componente de confirmación de eliminación
const DeleteConfirmation = ({
  isOpen,
  onClose,
  onConfirm,
  productTitle,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  productTitle: string
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 max-w-sm w-full">
        <div className="flex items-center text-red-500 mb-3">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <h3 className="text-lg font-semibold">Confirmar eliminación</h3>
        </div>
        <p className="mb-4">
          ¿Estás seguro de que deseas eliminar el producto <span className="font-semibold">"{productTitle}"</span>?
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
            Cancelar
          </button>
          <button onClick={onConfirm} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

// Modificar la función ProductList para añadir el estado de confirmación
export default function ProductList({
  products,
  activeStoreId,
  onRemoveProduct,
  onUpdateProduct,
  stores,
  searchTerm = "",
  exchangeRates,
  dateFilter = null,
  hideNoProductsMessage,
  storeSubtotals,
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

  // Añadir estados para la confirmación de eliminación
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false)
  const [productToDelete, setProductToDelete] = useState<{ id: string; title: string } | null>(null)

  // Modificar la función handleDelete para mostrar la confirmación
  const handleDelete = async (id: string, title: string) => {
    setProductToDelete({ id, title })
    setShowDeleteConfirmation(true)
  }

  // Añadir una nueva función para confirmar la eliminación
  const confirmDelete = async () => {
    if (!productToDelete) return

    setShowDeleteConfirmation(false)
    setDeletingProductId(productToDelete.id)

    try {
      await onRemoveProduct(productToDelete.id)
    } finally {
      setDeletingProductId(null)
      setProductToDelete(null)
    }
  }

  // Añadir una función para cancelar la eliminación
  const cancelDelete = () => {
    setShowDeleteConfirmation(false)
    setProductToDelete(null)
  }

  // Función para obtener el nombre de la tienda a partir del ID
  const getStoreName = (storeId: string): string => {
    const store = stores.find((s) => s.id === storeId)
    return store ? store.name : "Desconocida"
  }

  // Añadir esta función de ordenación después de la función getStoreName
  const sortProducts = (products: Product[]): Product[] => {
    return [...products].sort((a, b) => {
      if (sortField === "title") {
        const comparison = a.title.localeCompare(b.title)
        return sortDirection === "asc" ? comparison : -comparison
      } else if (sortField === "price") {
        // Usar el subtotal (precio × cantidad) en lugar de solo el precio
        const subtotalA = a.price * a.quantity
        const subtotalB = b.price * b.quantity
        const comparison = subtotalA - subtotalB
        return sortDirection === "asc" ? comparison : -comparison
      } else if (sortField === "date") {
        // Ordenar por fecha de creación
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        const comparison = dateA - dateB
        return sortDirection === "asc" ? comparison : -comparison
      }
      return 0
    })
  }

  // Modificar la función formatDate para restar manualmente 4 horas a la fecha
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "Fecha desconocida"

    try {
      // Crear objeto de fecha a partir del string
      const date = new Date(dateString)

      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) return "Fecha inválida"

      // Restar 4 horas manualmente para ajustar a GMT-4
      const adjustedDate = new Date(date.getTime() - 4 * 60 * 60 * 1000)

      // Formatear la fecha
      const formatter = new Intl.DateTimeFormat("es", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })

      // Obtener la fecha formateada
      const formattedDate = formatter.format(adjustedDate)

      // Añadir GMT-4 al final
      return formattedDate + " GMT-4"
    } catch (error) {
      console.error("Error al formatear fecha:", error)
      return "Error en fecha"
    }
  }

  // Modificar la función openImageModal para asegurar que se está pasando correctamente la URL de la imagen
  const openImageModal = (imageSrc: string) => {
    console.log("Abriendo modal con imagen:", imageSrc)
    setSelectedImage(imageSrc)
  }

  // Función para cerrar el modal de imagen
  const closeImageModal = () => {
    setSelectedImage(null)
  }

  // Añadir esta función después de la función handleDelete
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

  // Modificar la lógica de filtrado para aplicar primero el filtro de tienda y luego el de fecha
  const filteredProducts = sortProducts(
    products
      // Primero filtrar por tienda activa
      .filter((product) => activeStoreId === "total" || product.storeId === activeStoreId)
      // Luego filtrar por término de búsqueda
      .filter((product) => {
        if (!searchTerm) return true
        const term = searchTerm.toLowerCase()
        return product.title.toLowerCase().includes(term)
      })
      // Finalmente filtrar por fecha
      .filter((product) => {
        if (!dateFilter) return true
        if (!product.createdAt) return false

        // Extraer solo la parte de la fecha (sin hora) para comparar
        const productDate = new Date(product.createdAt)
        const filterDate = new Date(dateFilter)

        // Normalizar ambas fechas a UTC y comparar solo año, mes y día
        return (
          productDate.getUTCFullYear() === filterDate.getUTCFullYear() &&
          productDate.getUTCMonth() === filterDate.getUTCMonth() &&
          productDate.getUTCDate() === filterDate.getUTCDate()
        )
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

  if (filteredProducts.length === 0) {
    // Si estamos en la vista Total, mostrar "Gastos por tienda"
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
    }

    return <p className="text-gray-500">No hay productos añadidos aún</p>
  }

  // Añadir esta función para convertir dólares a bolívares
  const convertToBolivares = (dollarAmount: number, rate: string): string => {
    const rateValue = Number.parseFloat(rate.replace(",", "."))
    if (isNaN(rateValue) || rateValue === 0) return "N/A"
    return (dollarAmount * rateValue).toFixed(2)
  }

  // Modificar el return principal para añadir los controles de ordenación
  return (
    <div className="space-y-4">
      {/* Componente de confirmación de eliminación */}
      <DeleteConfirmation
        isOpen={showDeleteConfirmation}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        productTitle={productToDelete?.title || ""}
      />
      {/* Mostrar el resumen del total en la parte superior */}
      {filteredProducts.length > 0 && (
        <TotalSummaryCard
          activeStoreId={activeStoreId}
          stores={stores}
          storeSubtotals={storeSubtotals}
          exchangeRates={exchangeRates}
          dateFilter={dateFilter}
          products={products}
        />
      )}

      {filteredProducts.length > 0 && renderSortControls()}

      {errorMessage && <div className="p-2 bg-red-100 border border-red-400 text-red-700 rounded">{errorMessage}</div>}

      {/* Modal para mostrar la imagen en grande */}
      <ImageModal imageSrc={selectedImage} onClose={closeImageModal} />

      {/* Grid de productos con diferentes columnas según el tamaño de pantalla */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filteredProducts.map((product) => (
          <div key={product.id} className="border rounded-lg shadow-sm overflow-hidden bg-white flex flex-col h-full">
            {editingProduct === product.id ? (
              <div className="flex flex-col w-full">
                {/* Imagen del producto en modo edición */}
                <div className="p-2 flex flex-col items-center justify-center bg-gray-50">
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

                {/* Formulario de edición */}
                <div className="p-3 space-y-3 flex-grow">
                  <div>
                    <label htmlFor={`edit-title-${product.id}`} className="text-xs text-gray-500 block">
                      Nombre del producto
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      id={`edit-title-${product.id}`}
                      className="border border-gray-300 rounded px-2 py-1 w-full text-sm"
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
                          // Solo permitir números, punto y coma
                          const value = e.target.value
                          const filteredValue = value.replace(/[^0-9.,]/g, "")
                          setEditPrice(filteredValue)
                        }}
                        id={`edit-price-${product.id}`}
                        className="border border-gray-300 rounded px-2 py-1 w-full text-right text-sm"
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
                          // Solo permitir números enteros positivos
                          const value = e.target.value
                          const filteredValue = value.replace(/[^0-9]/g, "")
                          setEditQuantity(filteredValue)
                        }}
                        id={`edit-quantity-${product.id}`}
                        className="border border-gray-300 rounded px-2 py-1 w-full text-center text-sm"
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
              <div className="flex flex-col w-full h-full">
                {/* Imagen del producto */}
                {product.image && (
                  <div className="w-full p-2 flex items-center justify-center bg-gray-50 h-24">
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

                {/* Información del producto */}
                <div className="p-3 flex-grow w-full">
                  <h3 className="font-medium text-sm line-clamp-2 mb-1" title={product.title}>
                    {product.title}
                  </h3>
                  <div className="flex flex-col gap-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Precio:</span>
                      <span>${product.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cantidad:</span>
                      <span>{product.quantity}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-500">Subtotal:</span>
                      <span>${(product.price * product.quantity).toFixed(2)}</span>
                    </div>
                    <div className="w-full mt-1 flex flex-col gap-1 text-xs bg-gray-50 p-2 rounded">
                      <div className="flex justify-between">
                        <span className="text-gray-500">BCV:</span>
                        <span>Bs. {convertToBolivares(product.price * product.quantity, exchangeRates.bcv)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Paralelo:</span>
                        <span>Bs. {convertToBolivares(product.price * product.quantity, exchangeRates.parallel)}</span>
                      </div>
                    </div>
                    {/* Mostrar la fecha de creación */}
                    <div className="text-xs text-gray-500 mt-1 w-full">Añadido: {formatDate(product.createdAt)}</div>
                    {/* Mostrar la tienda solo en la vista "Total" */}
                    {activeStoreId === "total" && (
                      <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full text-xs mt-1">
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

                {/* Botones de acción */}
                <div className="flex justify-between p-2 border-t border-gray-100 bg-gray-50 mt-auto">
                  <button
                    onClick={() => startEditing(product)}
                    className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 flex items-center"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id, product.title)}
                    className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 flex items-center"
                    title="Eliminar"
                    disabled={deletingProductId === product.id}
                  >
                    {deletingProductId === product.id ? (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Aquí iría el resumen del total en la parte inferior, pero lo eliminamos para evitar duplicación */}
    </div>
  )
}

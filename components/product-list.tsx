"use client"

import { useState } from "react"
import type { Product, Store } from "../types"
import { Edit2, Check, X, Trash2, ShoppingBag, ImageIcon } from "lucide-react"
import ImageModal from "./image-modal"
import ImageWithFallback from "./image-with-fallback"
import ImageUploader from "./image-uploader"

// Modificar la interfaz ProductListProps para incluir el término de búsqueda
interface ProductListProps {
  products: Product[]
  activeStoreId: string
  onRemoveProduct: (id: string) => void
  onUpdateProduct: (id: string, title: string, price: number, quantity: number, image?: string) => void
  stores: Store[] // Añadir la lista de tiendas para mostrar el nombre
  searchTerm?: string // Añadir el término de búsqueda como prop opcional
}

// Actualizar la desestructuración de props para incluir searchTerm
export default function ProductList({
  products,
  activeStoreId,
  onRemoveProduct,
  onUpdateProduct,
  stores,
  searchTerm = "", // Valor por defecto vacío
}: ProductListProps) {
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState<string>("")
  const [editPrice, setEditPrice] = useState<string>("")
  const [editQuantity, setEditQuantity] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  // Añadir un nuevo estado para controlar el producto que se está eliminando
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)

  // Añadir un nuevo estado para controlar la visualización del selector de imágenes
  const [showImageUploader, setShowImageUploader] = useState<boolean>(false)
  // Añadir un estado para la imagen temporal durante la edición
  const [editImage, setEditImage] = useState<string | null>(null)

  // Añadir estos nuevos estados después de los estados existentes (línea ~25)
  const [sortField, setSortField] = useState<"title" | "price" | "date">("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc") // Por defecto, más recientes primero

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

  // Modificar la función que maneja la eliminación
  const handleDelete = async (id: string) => {
    setDeletingProductId(id)
    try {
      await onRemoveProduct(id)
    } finally {
      setDeletingProductId(null)
    }
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

  // Modificar la línea donde se filtran los productos (después de la función handleDelete)
  // Reemplazar:
  // const filteredProducts = activeStoreId === "total" ? products : products.filter((product) => product.storeId === activeStoreId)

  // Con:
  const filteredProducts = sortProducts(
    (activeStoreId === "total" ? products : products.filter((product) => product.storeId === activeStoreId))
      // Añadir filtro por término de búsqueda
      .filter((product) => {
        if (!searchTerm) return true
        const term = searchTerm.toLowerCase()
        return product.title.toLowerCase().includes(term)
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
      return <p className="text-gray-500">Gastos por tienda</p>
    }

    return <p className="text-gray-500">No hay productos añadidos aún</p>
  }

  // Modificar el return principal para añadir los controles de ordenación
  // Reemplazar:
  // return (
  //   <div className="grid grid-cols-1 gap-4">

  // Con:
  return (
    <div className="grid grid-cols-1 gap-4">
      {filteredProducts.length > 0 && renderSortControls()}

      {errorMessage && <div className="p-2 bg-red-100 border border-red-400 text-red-700 rounded">{errorMessage}</div>}

      {/* Modal para mostrar la imagen en grande */}
      <ImageModal imageSrc={selectedImage} onClose={closeImageModal} />

      {filteredProducts.map((product) => (
        <div key={product.id} className="border rounded-lg shadow-sm overflow-hidden bg-white">
          {editingProduct === product.id ? (
            <div className="flex flex-col sm:flex-row w-full">
              {/* Imagen del producto en modo edición */}
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

              {/* Formulario de edición */}
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
                        // Solo permitir números, punto y coma
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
                        // Solo permitir números enteros positivos
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
              {/* Imagen del producto */}
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
                  {/* Mostrar la fecha de creación */}
                  <div className="text-xs text-gray-500 mt-1 w-full">Añadido: {formatDate(product.createdAt)}</div>
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

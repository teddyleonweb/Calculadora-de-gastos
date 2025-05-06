"use client"

import { useState } from "react"
import { Pencil, Trash2, Check, X, Camera } from "lucide-react"
import ImageWithFallback from "./image-with-fallback"
import ImageModal from "./image-modal"
import ImageUploader from "./image-uploader"

interface ProductItemProps {
  id: string
  title: string
  price: number
  quantity: number
  image?: string
  storeId: string
  onRemove: (id: string) => void
  onUpdate: (id: string, title: string, price: number, quantity: number, image?: string) => void
  storeName?: string
}

export default function ProductItem({
  id,
  title,
  price,
  quantity,
  image,
  storeId,
  onRemove,
  onUpdate,
  storeName,
}: ProductItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(title)
  const [editPrice, setEditPrice] = useState(price.toString())
  const [editQuantity, setEditQuantity] = useState(quantity.toString())
  const [editImage, setEditImage] = useState<string | undefined>(image)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showImageUploader, setShowImageUploader] = useState(false)

  const handleSave = () => {
    // Normalizar el precio: si ya tiene punto, dejarlo; si tiene coma, convertirla a punto
    let normalizedPrice = editPrice
    if (!normalizedPrice.includes(".") && normalizedPrice.includes(",")) {
      normalizedPrice = normalizedPrice.replace(",", ".")
    }

    const newPrice = Number.parseFloat(normalizedPrice)
    const newQuantity = Number.parseInt(editQuantity, 10)

    if (!isNaN(newPrice) && !isNaN(newQuantity) && newPrice > 0 && newQuantity > 0) {
      onUpdate(id, editTitle, newPrice, newQuantity, editImage)
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setEditTitle(title)
    setEditPrice(price.toString())
    setEditQuantity(quantity.toString())
    setEditImage(image)
    setIsEditing(false)
    setShowImageUploader(false)
  }

  const handleImageCapture = (imageSrc: string) => {
    setEditImage(imageSrc)
    setShowImageUploader(false)
  }

  const handleRemoveImage = () => {
    setEditImage(undefined)
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  return (
    <div className="border border-gray-200 rounded p-3 mb-2 bg-white">
      {isEditing ? (
        <div className="flex flex-col space-y-2">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 w-full"
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="w-full sm:w-1/2">
              <label className="text-sm text-gray-600 block">Precio</label>
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
                className="border border-gray-300 rounded px-2 py-1 w-full"
              />
            </div>
            <div className="w-full sm:w-1/2">
              <label className="text-sm text-gray-600 block">Cantidad</label>
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
                className="border border-gray-300 rounded px-2 py-1 w-full"
              />
            </div>
          </div>

          {/* Sección para la imagen */}
          <div className="w-full">
            <label className="text-sm text-gray-600 block">Imagen del producto (opcional)</label>

            {showImageUploader ? (
              <div className="border border-gray-300 rounded p-2">
                <ImageUploader onImageCapture={handleImageCapture} />
                <button
                  onClick={() => setShowImageUploader(false)}
                  className="mt-2 bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-sm"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {editImage && (
                  <div className="relative">
                    <ImageWithFallback
                      src={editImage || "/placeholder.svg"}
                      alt={editTitle}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      title="Eliminar imagen"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setShowImageUploader(true)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-1 px-3 rounded text-sm flex items-center"
                >
                  <Camera size={16} className="mr-1" />
                  {editImage ? "Cambiar imagen" : "Añadir imagen"}
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={handleSave}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded flex items-center"
            >
              <Check size={16} className="mr-1" />
              Guardar
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded flex items-center"
            >
              <X size={16} className="mr-1" />
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-3 flex-grow">
            {image && (
              <div className="cursor-pointer" onClick={() => setShowImageModal(true)} title="Ver imagen completa">
                <ImageWithFallback
                  src={image || "/placeholder.svg"}
                  alt={title}
                  className="w-16 h-16 object-cover rounded"
                />
              </div>
            )}
            <div className="flex-grow">
              <h3 className="font-semibold text-gray-800">{title}</h3>
              <div className="flex flex-wrap gap-x-4 text-sm text-gray-600">
                <span>
                  Precio: <span className="font-semibold">${formatPrice(price)}</span>
                </span>
                <span>
                  Cantidad: <span className="font-semibold">{quantity}</span>
                </span>
                <span>
                  Total: <span className="font-semibold">${formatPrice(price * quantity)}</span>
                </span>
                {storeName && (
                  <span>
                    Tienda: <span className="font-semibold">{storeName}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-500 hover:text-blue-700 p-1"
              title="Editar producto"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={() => onRemove(id)}
              className="text-red-500 hover:text-red-700 p-1"
              title="Eliminar producto"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Modal para ver la imagen completa */}
      {showImageModal && image && <ImageModal imageSrc={image} alt={title} onClose={() => setShowImageModal(false)} />}
    </div>
  )
}

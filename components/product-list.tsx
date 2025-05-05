"use client"

import { useState } from "react"
import { Trash2, Edit2, Check, X, ImageIcon } from "lucide-react"
import type { Product, Store } from "../types"
import ImageModal from "./image-modal"
import ImageWithFallback from "./image-with-fallback"

interface ProductListProps {
  products: Product[]
  activeStoreId: string
  onRemoveProduct: (id: string) => void
  onUpdateProduct: (id: string, title: string, price: number, quantity: number) => void
  stores: Store[]
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
  const [modalImage, setModalImage] = useState<string | null>(null)
  const [modalTitle, setModalTitle] = useState<string>("")
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

  // Filtrar productos según la tienda activa
  const filteredProducts =
    activeStoreId === stores.find((store) => store.name === "Total")?.id
      ? products // Si es "Total", mostrar todos los productos
      : products.filter((product) => product.storeId === activeStoreId)

  const startEditing = (product: Product) => {
    setEditingProduct(product.id)
    setEditTitle(product.title)
    setEditPrice(product.price.toString())
    setEditQuantity(product.quantity.toString())
  }

  const cancelEditing = () => {
    setEditingProduct(null)
    setEditTitle("")
    setEditPrice("")
    setEditQuantity("")
  }

  const saveEditing = (id: string) => {
    // Normalizar el precio: si ya tiene punto, dejarlo; si tiene coma, convertirla a punto
    let normalizedPrice = editPrice
    if (!normalizedPrice.includes(".") && normalizedPrice.includes(",")) {
      normalizedPrice = normalizedPrice.replace(",", ".")
    }

    const price = Number.parseFloat(normalizedPrice)
    const quantity = Number.parseInt(editQuantity, 10)

    if (editTitle.trim() && !isNaN(price) && price > 0 && !isNaN(quantity) && quantity > 0) {
      onUpdateProduct(id, editTitle, price, quantity)
      cancelEditing()
    }
  }

  const openImageModal = (product: Product) => {
    if (product.image) {
      setModalImage(product.image)
      setModalTitle(product.title)
      setIsModalOpen(true)
    }
  }

  // Calcular el total
  const total = filteredProducts.reduce((sum, product) => sum + product.price * product.quantity, 0)

  return (
    <div>
      {filteredProducts.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No hay productos en esta tienda</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-4 text-left">Producto</th>
                <th className="py-3 px-4 text-right">Precio</th>
                <th className="py-3 px-4 text-center">Cant.</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">
                  {editingProduct === product.id ? (
                    // Modo edición
                    <>
                      <td className="py-2 px-4">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 w-full"
                        />
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="text"
                          value={editPrice}
                          onChange={(e) => {
                            // Solo permitir números, punto y coma
                            const value = e.target.value
                            const filteredValue = value.replace(/[^0-9.,]/g, "")
                            setEditPrice(filteredValue)
                          }}
                          className="border border-gray-300 rounded px-2 py-1 w-24 text-right"
                        />
                      </td>
                      <td className="py-2 px-4 text-center">
                        <input
                          type="text"
                          value={editQuantity}
                          onChange={(e) => {
                            // Solo permitir números enteros positivos
                            const value = e.target.value
                            const filteredValue = value.replace(/[^0-9]/g, "")
                            setEditQuantity(filteredValue)
                          }}
                          className="border border-gray-300 rounded px-2 py-1 w-16 text-center"
                        />
                      </td>
                      <td className="py-2 px-4 text-right">
                        {(
                          Number.parseFloat(editPrice.replace(",", ".")) * Number.parseInt(editQuantity, 10) || 0
                        ).toFixed(2)}
                        €
                      </td>
                      <td className="py-2 px-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => saveEditing(product.id)}
                            className="text-green-500 hover:text-green-700"
                            title="Guardar"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="text-gray-500 hover:text-gray-700"
                            title="Cancelar"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    // Modo visualización
                    <>
                      <td className="py-3 px-4 flex items-center">
                        {product.image && (
                          <div
                            className="w-10 h-10 rounded overflow-hidden mr-3 cursor-pointer"
                            onClick={() => openImageModal(product)}
                          >
                            <ImageWithFallback
                              src={product.image || "/placeholder.svg"}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <span className="font-medium">{product.title}</span>
                      </td>
                      <td className="py-3 px-4 text-right">{product.price.toFixed(2)}€</td>
                      <td className="py-3 px-4 text-center">{product.quantity}</td>
                      <td className="py-3 px-4 text-right">{(product.price * product.quantity).toFixed(2)}€</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => startEditing(product)}
                            className="text-blue-500 hover:text-blue-700"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => onRemoveProduct(product.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                          {product.image && (
                            <button
                              onClick={() => openImageModal(product)}
                              className="text-gray-500 hover:text-gray-700"
                              title="Ver imagen"
                            >
                              <ImageIcon size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {/* Fila de total */}
              <tr className="bg-gray-50">
                <td className="py-3 px-4 font-bold">Total</td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4 text-right font-bold">{total.toFixed(2)}€</td>
                <td className="py-3 px-4"></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para ver imágenes */}
      <ImageModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} imageSrc={modalImage} title={modalTitle} />
    </div>
  )
}

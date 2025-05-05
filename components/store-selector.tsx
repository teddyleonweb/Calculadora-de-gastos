"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Plus, Edit2, Trash2, Check, X, ShoppingBag, Upload } from "lucide-react"
import type { Store } from "../types"
import ImageWithFallback from "./image-with-fallback"

interface StoreSelectorProps {
  stores: Store[]
  activeStoreId: string
  onStoreChange: (storeId: string) => void
  onAddStore: (name: string) => Promise<void>
  onDeleteStore: (storeId: string) => Promise<void>
  onUpdateStore: (storeId: string, name: string, image?: string) => Promise<void>
}

export default function StoreSelector({
  stores,
  activeStoreId,
  onStoreChange,
  onAddStore,
  onDeleteStore,
  onUpdateStore,
}: StoreSelectorProps) {
  const [isAddingStore, setIsAddingStore] = useState<boolean>(false)
  const [newStoreName, setNewStoreName] = useState<string>("")
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null)
  const [editStoreName, setEditStoreName] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [storeImage, setStoreImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Función para manejar la carga de imágenes
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setStoreImage(result)
    }
    reader.readAsDataURL(file)
  }

  // Función para abrir el selector de archivos
  const openFileSelector = () => {
    fileInputRef.current?.click()
  }

  // Función para añadir una nueva tienda
  const handleAddStore = async () => {
    if (!newStoreName.trim()) {
      setErrorMessage("Por favor ingrese un nombre para la tienda")
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      await onAddStore(newStoreName)
      setNewStoreName("")
      setIsAddingStore(false)
    } catch (error) {
      console.error("Error al añadir tienda:", error)
      setErrorMessage("Error al añadir tienda")
    } finally {
      setIsLoading(false)
    }
  }

  // Función para iniciar la edición de una tienda
  const startEditingStore = (store: Store) => {
    setEditingStoreId(store.id)
    setEditStoreName(store.name)
    setStoreImage(store.image || null)
    setErrorMessage(null)
  }

  // Función para cancelar la edición
  const cancelEditing = () => {
    setEditingStoreId(null)
    setEditStoreName("")
    setStoreImage(null)
    setErrorMessage(null)
  }

  // Función para guardar los cambios de la tienda
  const saveStoreEdits = async (storeId: string) => {
    if (!editStoreName.trim()) {
      setErrorMessage("Por favor ingrese un nombre para la tienda")
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      await onUpdateStore(storeId, editStoreName, storeImage || undefined)
      setEditingStoreId(null)
      setEditStoreName("")
      setStoreImage(null)
    } catch (error) {
      console.error("Error al actualizar tienda:", error)
      setErrorMessage("Error al actualizar tienda")
    } finally {
      setIsLoading(false)
    }
  }

  // Función para eliminar una tienda
  const handleDeleteStore = async (storeId: string) => {
    // No permitir eliminar la tienda "Total"
    const totalStore = stores.find((store) => store.name === "Total")
    if (storeId === totalStore?.id) return

    if (confirm("¿Estás seguro de que deseas eliminar esta tienda?")) {
      setIsLoading(true)
      try {
        await onDeleteStore(storeId)
      } catch (error) {
        console.error("Error al eliminar tienda:", error)
        setErrorMessage("Error al eliminar tienda")
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold mb-2">Tiendas</h2>
      {errorMessage && (
        <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded">{errorMessage}</div>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        {stores.map((store) =>
          editingStoreId === store.id ? (
            <div key={store.id} className="border rounded-lg p-2 bg-gray-50 flex flex-col gap-2 min-w-[200px]">
              <div>
                <label htmlFor={`edit-store-${store.id}`} className="text-xs text-gray-500 block">
                  Nombre de la tienda
                </label>
                <input
                  type="text"
                  id={`edit-store-${store.id}`}
                  value={editStoreName}
                  onChange={(e) => setEditStoreName(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 w-full"
                />
              </div>

              {/* Imagen de la tienda */}
              <div>
                <label className="text-xs text-gray-500 block">Imagen (opcional)</label>
                <div className="flex items-center gap-2">
                  {storeImage ? (
                    <div className="relative">
                      <img
                        src={storeImage || "/placeholder.svg"}
                        alt="Vista previa"
                        className="w-10 h-10 object-cover rounded-full"
                      />
                      <button
                        onClick={() => setStoreImage(null)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                        title="Eliminar imagen"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={openFileSelector}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-1 px-2 rounded text-xs flex items-center gap-1"
                    >
                      <Upload size={12} /> Imagen
                    </button>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-1">
                <button
                  onClick={() => saveStoreEdits(store.id)}
                  disabled={isLoading}
                  className="px-2 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200 flex items-center gap-1 text-sm"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Check size={16} />
                  )}
                  Guardar
                </button>
                <button
                  onClick={cancelEditing}
                  className="px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 flex items-center gap-1 text-sm"
                >
                  <X size={16} /> Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div
              key={store.id}
              onClick={() => onStoreChange(store.id)}
              className={`border rounded-lg p-2 cursor-pointer flex items-center gap-2 ${
                activeStoreId === store.id ? "bg-blue-100 border-blue-300" : "bg-white hover:bg-gray-50"
              }`}
            >
              {store.image ? (
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  <ImageWithFallback
                    src={store.image || "/placeholder.svg"}
                    alt={store.name}
                    className="w-full h-full object-cover"
                    fallbackSrc="/placeholder.svg"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <ShoppingBag size={16} className="text-gray-500" />
                </div>
              )}
              <span className="font-medium">{store.name}</span>

              {/* No mostrar botones de edición para la tienda "Total" */}
              {store.name !== "Total" && (
                <div className="flex ml-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      startEditingStore(store)
                    }}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteStore(store.id)
                    }}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                    title="Eliminar"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              )}
            </div>
          ),
        )}

        {/* Formulario para añadir nueva tienda */}
        {isAddingStore ? (
          <div className="border rounded-lg p-2 bg-gray-50 flex flex-col gap-2 min-w-[200px]">
            <div>
              <label htmlFor="new-store-name" className="text-xs text-gray-500 block">
                Nombre de la tienda
              </label>
              <input
                type="text"
                id="new-store-name"
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 w-full"
                placeholder="Ej: Supermercado"
              />
            </div>
            <div className="flex justify-end gap-2 mt-1">
              <button
                onClick={handleAddStore}
                disabled={isLoading}
                className="px-2 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200 flex items-center gap-1 text-sm"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Check size={16} />
                )}
                Añadir
              </button>
              <button
                onClick={() => {
                  setIsAddingStore(false)
                  setNewStoreName("")
                  setErrorMessage(null)
                }}
                className="px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 flex items-center gap-1 text-sm"
              >
                <X size={16} /> Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingStore(true)}
            className="border rounded-lg p-2 bg-gray-50 hover:bg-gray-100 flex items-center gap-2"
          >
            <Plus size={16} /> Añadir tienda
          </button>
        )}
      </div>
    </div>
  )
}

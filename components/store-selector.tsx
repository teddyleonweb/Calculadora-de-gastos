"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import type { Store } from "../types"
import { Plus, X, Edit2, Check, ImageIcon } from "lucide-react"

interface StoreSelectorProps {
  stores: Store[]
  activeStoreId: string
  onStoreChange: (storeId: string) => void
  onAddStore: (name: string) => void
  onDeleteStore: (storeId: string) => void
  onUpdateStore: (storeId: string, name: string, image?: string) => void
}

export default function StoreSelector({
  stores,
  activeStoreId,
  onStoreChange,
  onAddStore,
  onDeleteStore,
  onUpdateStore,
}: StoreSelectorProps) {
  const [newStoreName, setNewStoreName] = useState<string>("")
  const [isAddingStore, setIsAddingStore] = useState<boolean>(false)
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null)
  const [editStoreName, setEditStoreName] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleAddStore = () => {
    if (newStoreName.trim()) {
      onAddStore(newStoreName.trim())
      setNewStoreName("")
      setIsAddingStore(false)
    }
  }

  const startEditingStore = (store: Store) => {
    setEditingStoreId(store.id)
    setEditStoreName(store.name)
  }

  const cancelEditingStore = () => {
    setEditingStoreId(null)
    setEditStoreName("")
  }

  const saveEditingStore = (storeId: string) => {
    if (editStoreName.trim()) {
      onUpdateStore(storeId, editStoreName.trim())
      setEditingStoreId(null)
      setEditStoreName("")
    }
  }

  const handleImageUpload = (storeId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Verificar el tamaño del archivo (limitar a 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("La imagen es demasiado grande. Por favor selecciona una imagen de menos de 5MB.")
        return
      }

      // Mostrar un mensaje de carga temporal
      setSuccessMessage("Cargando imagen...")

      const reader = new FileReader()

      reader.onload = (e) => {
        if (typeof e.target?.result === "string") {
          console.log("Cargando imagen...", file.name, file.type, file.size, "bytes")

          try {
            // Comprimir la imagen si es necesario
            const img = new Image()
            img.onload = () => {
              const canvas = document.createElement("canvas")
              // Limitar el tamaño máximo a 800px en cualquier dimensión
              let width = img.width
              let height = img.height

              if (width > height && width > 800) {
                height = Math.round((height * 800) / width)
                width = 800
              } else if (height > 800) {
                width = Math.round((width * 800) / height)
                height = 800
              }

              canvas.width = width
              canvas.height = height

              const ctx = canvas.getContext("2d")
              ctx?.drawImage(img, 0, 0, width, height)

              // Convertir a formato JPEG con calidad reducida
              const compressedImage = canvas.toDataURL("image/jpeg", 0.7)
              console.log("Imagen comprimida:", compressedImage.length, "caracteres")

              // Llamar a la función de actualización con el nombre actual de la tienda y la nueva imagen
              const storeName = stores.find((s) => s.id === storeId)?.name || ""
              onUpdateStore(storeId, storeName, compressedImage)

              // Si estamos en modo edición, cerrar el modo edición
              if (editingStoreId === storeId) {
                setEditingStoreId(null)
              }
              setSuccessMessage("Imagen actualizada con éxito!")
            }

            img.src = e.target.result
          } catch (error) {
            console.error("Error al procesar la imagen:", error)
            alert("Error al procesar la imagen. Por favor intenta con otra imagen.")
          }
        }
      }

      reader.onerror = (error) => {
        console.error("Error al leer el archivo:", error)
        alert("Error al leer la imagen. Por favor intenta con otra imagen.")
      }

      reader.readAsDataURL(file)
    }
  }

  // Separar la tienda "Total" del resto de tiendas
  const totalStore = stores.find((store) => store.name === "Total")
  // Filtrar las tiendas que no son "Total" y ordenarlas
  const regularStores = stores.filter((store) => store.name !== "Total")

  console.log(
    "Tiendas con imágenes:",
    stores.map((s) => ({ id: s.id, name: s.name, hasImage: !!s.image })),
  )

  // Mostrar mensajes de éxito
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  console.log(
    "Renderizando tiendas con imágenes:",
    stores
      .filter((s) => s.image)
      .map((s) => ({
        id: s.id,
        name: s.name,
        imageUrl: s.image,
      })),
  )

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center border-b border-gray-200">
        {/* Primero mostrar las tiendas regulares */}
        {regularStores.map((store) => (
          <div key={store.id} className="relative mb-1 mr-1">
            {editingStoreId === store.id ? (
              <div className="flex items-center bg-white border border-blue-500 rounded-t-lg p-1">
                <input
                  type="text"
                  value={editStoreName}
                  onChange={(e) => setEditStoreName(e.target.value)}
                  className="px-2 py-1 text-sm w-32 border-none focus:outline-none"
                  autoFocus
                />
                <div className="flex">
                  <button
                    onClick={() => saveEditingStore(store.id)}
                    className="p-1 text-green-600 hover:text-green-800"
                    title="Guardar"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={cancelEditingStore}
                    className="p-1 text-gray-600 hover:text-gray-800"
                    title="Cancelar"
                  >
                    <X size={16} />
                  </button>
                  <button
                    onClick={() => editFileInputRef.current?.click()}
                    className="p-1 text-blue-600 hover:text-blue-800"
                    title="Cambiar imagen"
                  >
                    <ImageIcon size={16} />
                  </button>
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(store.id, e)}
                    className="hidden"
                  />
                </div>
              </div>
            ) : (
              <button
                className={`py-2 px-4 flex items-center gap-2 ${
                  activeStoreId === store.id ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                } rounded-t-lg`}
                onClick={() => onStoreChange(store.id)}
              >
                {store.image && (
                  <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 border border-gray-300">
                    <img
                      src={store.image || "/placeholder.svg"}
                      alt={store.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error("Error al cargar la imagen:", store.image)
                        e.currentTarget.src = "/placeholder.svg"
                      }}
                      onLoad={() => console.log("Imagen cargada correctamente:", store.name, store.image)}
                    />
                  </div>
                )}
                <span>{store.name}</span>
              </button>
            )}

            {/* Botones de acción para tiendas (no para Total) */}
            {store.name !== "Total" && !editingStoreId && (
              <div className="absolute -top-2 -right-2 flex">
                <button
                  className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center mr-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    startEditingStore(store)
                  }}
                  title="Editar tienda"
                >
                  <Edit2 size={12} />
                </button>
                <button
                  className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteStore(store.id)
                  }}
                  title="Eliminar tienda"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Mostrar la tienda "Total" al final */}
        {totalStore && (
          <div className="relative mb-1 mr-1">
            <button
              className={`py-2 px-4 flex items-center gap-2 ${
                activeStoreId === totalStore.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              } rounded-t-lg`}
              onClick={() => onStoreChange(totalStore.id)}
            >
              {totalStore.image && (
                <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 border border-gray-300">
                  <img
                    src={totalStore.image || "/placeholder.svg"}
                    alt={totalStore.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error("Error al cargar la imagen:", totalStore.image)
                      e.currentTarget.src = "/placeholder.svg"
                    }}
                    onLoad={() => console.log("Imagen cargada correctamente:", totalStore.name, totalStore.image)}
                  />
                </div>
              )}
              <span>{totalStore.name}</span>
            </button>

            {/* Botón para editar la tienda Total (solo cambiar imagen) */}
            <button
              className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation()
                fileInputRef.current?.click()
              }}
              title="Cambiar imagen"
            >
              <ImageIcon size={12} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(totalStore.id, e)}
              className="hidden"
            />
          </div>
        )}

        <div className="ml-2 mb-1">
          {isAddingStore ? (
            <div className="flex items-center">
              <input
                type="text"
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                placeholder="Nombre de tienda"
                className="border border-gray-300 rounded px-2 py-1 text-sm w-40"
                autoFocus
              />
              <button onClick={handleAddStore} className="ml-2 bg-green-500 text-white px-2 py-1 rounded text-sm">
                Añadir
              </button>
              <button
                onClick={() => {
                  setIsAddingStore(false)
                  setNewStoreName("")
                }}
                className="ml-1 bg-gray-500 text-white px-2 py-1 rounded text-sm"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingStore(true)}
              className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-2 rounded-lg"
            >
              <Plus size={16} className="mr-1" /> Nueva tienda
            </button>
          )}
        </div>
      </div>
      {/* Mostrar mensajes de éxito */}
      {successMessage && (
        <div className="mt-2 p-2 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
          {successMessage}
        </div>
      )}
    </div>
  )
}

"use client"

import type React from "react"

import { useState, useRef } from "react"

export default function ImageStorageTest() {
  const [isOpen, setIsOpen] = useState(false)
  const [testImage, setTestImage] = useState<string | null>(null)
  const [storedImage, setStoredImage] = useState<string | null>(null)
  const [status, setStatus] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (typeof e.target?.result === "string") {
          setTestImage(e.target.result)
          setStatus("Imagen cargada. Haz clic en 'Guardar en localStorage' para probar.")
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const saveToLocalStorage = () => {
    if (testImage) {
      try {
        localStorage.setItem("test_image", testImage)
        setStatus("Imagen guardada en localStorage. Haz clic en 'Cargar desde localStorage' para verificar.")
      } catch (error) {
        setStatus(`Error al guardar en localStorage: ${error instanceof Error ? error.message : String(error)}`)
        console.error("Error al guardar en localStorage:", error)
      }
    }
  }

  const loadFromLocalStorage = () => {
    try {
      const image = localStorage.getItem("test_image")
      if (image) {
        setStoredImage(image)
        setStatus("Imagen cargada desde localStorage correctamente.")
      } else {
        setStatus("No se encontró ninguna imagen en localStorage.")
      }
    } catch (error) {
      setStatus(`Error al cargar desde localStorage: ${error instanceof Error ? error.message : String(error)}`)
      console.error("Error al cargar desde localStorage:", error)
    }
  }

  const clearLocalStorage = () => {
    try {
      localStorage.removeItem("test_image")
      setStoredImage(null)
      setStatus("Imagen eliminada de localStorage.")
    } catch (error) {
      setStatus(`Error al eliminar de localStorage: ${error instanceof Error ? error.message : String(error)}`)
      console.error("Error al eliminar de localStorage:", error)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg z-50"
        title="Probar almacenamiento de imágenes"
      >
        🖼️
      </button>
    )
  }

  return (
    <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-300 z-50 max-w-md max-h-[80vh] overflow-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Prueba de almacenamiento de imágenes</h3>
        <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">
            Esta herramienta te permite probar si el almacenamiento de imágenes funciona correctamente en tu navegador.
          </p>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
            >
              Seleccionar imagen
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </div>
        </div>

        {testImage && (
          <div>
            <p className="font-semibold mb-1">Imagen seleccionada:</p>
            <div className="border border-gray-300 rounded p-2">
              <img src={testImage || "/placeholder.svg"} alt="Imagen de prueba" className="max-h-32 mx-auto" />
              <p className="text-xs text-gray-500 mt-1 truncate">Tamaño: {testImage.length} caracteres</p>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={saveToLocalStorage}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
              >
                Guardar en localStorage
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={loadFromLocalStorage}
            className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm"
          >
            Cargar desde localStorage
          </button>

          <button
            onClick={clearLocalStorage}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
          >
            Limpiar localStorage
          </button>
        </div>

        {storedImage && (
          <div>
            <p className="font-semibold mb-1">Imagen desde localStorage:</p>
            <div className="border border-gray-300 rounded p-2">
              <img src={storedImage || "/placeholder.svg"} alt="Imagen almacenada" className="max-h-32 mx-auto" />
              <p className="text-xs text-gray-500 mt-1 truncate">Tamaño: {storedImage.length} caracteres</p>
            </div>
          </div>
        )}

        {status && (
          <div className="mt-2 p-2 bg-gray-100 border border-gray-300 rounded text-sm">
            <p className="font-semibold">Estado:</p>
            <p>{status}</p>
          </div>
        )}
      </div>
    </div>
  )
}

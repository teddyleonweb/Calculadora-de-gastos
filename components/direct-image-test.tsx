"use client"

import { useState, useEffect } from "react"
import { createClientSupabaseClient } from "../lib/supabase/client"

export default function DirectImageTest() {
  const [isOpen, setIsOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const testImage = async () => {
    if (!imageUrl) return

    setLoading(true)
    setTestResults([`Probando URL: ${imageUrl}`])

    try {
      // Método 1: Fetch con HEAD
      try {
        const headResponse = await fetch(imageUrl, {
          method: "HEAD",
          mode: "no-cors", // Intentar sin CORS primero
        })
        setTestResults((prev) => [...prev, `HEAD request (no-cors): ${headResponse.status} ${headResponse.statusText}`])
      } catch (e) {
        setTestResults((prev) => [...prev, `HEAD request falló: ${e instanceof Error ? e.message : String(e)}`])
      }

      // Método 2: Cargar imagen directamente
      const img = new Image()

      // Crear promesa para esperar a que la imagen cargue o falle
      const imgPromise = new Promise((resolve, reject) => {
        img.onload = () => resolve("Imagen cargada correctamente")
        img.onerror = () => reject(new Error("Error al cargar la imagen"))

        // Intentar primero sin crossOrigin
        img.src = imageUrl

        // Si después de 2 segundos no carga, intentar con crossOrigin
        setTimeout(() => {
          if (!img.complete) {
            img.crossOrigin = "anonymous"
            img.src = imageUrl + "?t=" + new Date().getTime() // Evitar caché
          }
        }, 2000)
      })

      try {
        const result = await Promise.race([
          imgPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000)),
        ])
        setTestResults((prev) => [...prev, `Carga de imagen: ${result}`])
      } catch (e) {
        setTestResults((prev) => [...prev, `Carga de imagen falló: ${e instanceof Error ? e.message : String(e)}`])
      }

      // Método 3: Verificar con fetch GET
      try {
        const getResponse = await fetch(imageUrl, { mode: "cors" })
        const contentType = getResponse.headers.get("content-type")
        setTestResults((prev) => [
          ...prev,
          `GET request: ${getResponse.status} ${getResponse.statusText}`,
          `Content-Type: ${contentType || "No disponible"}`,
        ])
      } catch (e) {
        setTestResults((prev) => [...prev, `GET request falló: ${e instanceof Error ? e.message : String(e)}`])
      }
    } catch (error) {
      setTestResults((prev) => [...prev, `Error general: ${error instanceof Error ? error.message : String(error)}`])
    } finally {
      setLoading(false)
    }
  }

  // Obtener la primera imagen disponible al abrir
  useEffect(() => {
    if (isOpen && !imageUrl) {
      const getFirstImage = async () => {
        try {
          const supabase = createClientSupabaseClient()
          const { data: files } = await supabase.storage.from("store-images").list()

          if (files && files.length > 0) {
            const { data } = await supabase.storage.from("store-images").getPublicUrl(files[0].name)
            if (data?.publicUrl) {
              setImageUrl(data.publicUrl)
            }
          }
        } catch (e) {
          console.error("Error al obtener imagen:", e)
        }
      }

      getFirstImage()
    }
  }, [isOpen, imageUrl])

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-20 right-4 bg-green-600 text-white p-2 rounded-full shadow-lg z-50"
        title="Test directo de imagen"
      >
        🔍
      </button>
    )
  }

  return (
    <div className="fixed top-20 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-300 z-50 max-w-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Test Directo de Imagen</h3>
        <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL de la imagen</label>
          <input
            type="text"
            value={imageUrl || ""}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="https://..."
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={testImage}
            disabled={!imageUrl || loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
          >
            {loading ? "Probando..." : "Probar imagen"}
          </button>
        </div>

        {imageUrl && (
          <div className="border border-gray-200 rounded p-2">
            <p className="text-xs text-gray-500 mb-2">Vista previa:</p>
            <div className="bg-gray-100 h-40 flex items-center justify-center">
              <img
                src={imageUrl || "/placeholder.svg"}
                alt="Imagen de prueba"
                className="max-h-40 max-w-full object-contain"
                crossOrigin="anonymous"
                onError={(e) => {
                  console.error("Error al cargar imagen en vista previa")
                  e.currentTarget.src = "/placeholder.svg"
                }}
              />
            </div>
          </div>
        )}

        {testResults.length > 0 && (
          <div className="mt-2">
            <p className="text-sm font-medium text-gray-700 mb-1">Resultados:</p>
            <div className="bg-gray-100 p-2 rounded text-xs font-mono whitespace-pre-wrap max-h-40 overflow-auto">
              {testResults.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

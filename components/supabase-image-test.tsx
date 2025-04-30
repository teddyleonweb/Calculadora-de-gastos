"use client"

import { useState } from "react"
import { createClientSupabaseClient } from "../lib/supabase/client"

export default function SupabaseImageTest() {
  const [isOpen, setIsOpen] = useState(false)
  const [images, setImages] = useState<{ name: string; url: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<string | null>(null)

  const loadImages = async () => {
    setLoading(true)
    setError(null)
    setTestResult(null)

    try {
      const supabase = createClientSupabaseClient()

      // Listar archivos en el bucket store-images
      const { data: files, error: listError } = await supabase.storage.from("store-images").list()

      if (listError) {
        throw new Error(`Error al listar archivos: ${listError.message}`)
      }

      if (!files || files.length === 0) {
        setTestResult("No se encontraron imágenes en el bucket 'store-images'")
        setImages([])
        return
      }

      // Obtener URLs públicas para cada archivo
      const imageList = await Promise.all(
        files.slice(0, 5).map(async (file) => {
          const { data: urlData } = await supabase.storage.from("store-images").getPublicUrl(file.name)

          return {
            name: file.name,
            url: urlData?.publicUrl || "",
          }
        }),
      )

      setImages(imageList)
      setTestResult(`Se encontraron ${files.length} imágenes, mostrando las primeras 5`)
    } catch (err) {
      console.error("Error en la prueba de imágenes:", err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-purple-600 text-white p-2 rounded-full shadow-lg"
          title="Probar imágenes de Supabase"
        >
          🖼️
        </button>
      ) : (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-300 max-w-md max-h-[80vh] overflow-auto">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Prueba de imágenes de Supabase</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={loadImages}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                disabled={loading}
              >
                {loading ? "Cargando..." : "Cargar imágenes de Supabase"}
              </button>
            </div>

            {error && <div className="p-2 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

            {testResult && (
              <div className="p-2 bg-blue-100 border border-blue-400 text-blue-700 rounded">{testResult}</div>
            )}

            {images.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Imágenes encontradas:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {images.map((img, index) => (
                    <div key={index} className="border border-gray-200 rounded p-2">
                      <p className="text-xs text-gray-500 truncate mb-1">{img.name}</p>
                      <div className="relative bg-gray-100 h-24 flex items-center justify-center">
                        <img
                          src={img.url || "/placeholder.svg"}
                          alt={`Imagen ${index + 1}`}
                          className="max-h-24 max-w-full object-contain"
                          onError={(e) => {
                            console.error("Error al cargar imagen:", img.url)
                            e.currentTarget.src = "/placeholder.svg"
                            e.currentTarget.title = "Error al cargar la imagen"
                          }}
                        />
                      </div>
                      <div className="mt-1">
                        <a
                          href={img.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline"
                        >
                          Abrir en nueva pestaña
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500 mt-2">
              Esta herramienta verifica si las imágenes de Supabase Storage se pueden cargar correctamente.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

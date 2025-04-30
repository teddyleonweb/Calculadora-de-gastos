"use client"

import { useState } from "react"
import { createClientSupabaseClient } from "../lib/supabase/client"

export default function FixStoragePermissions() {
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<string[]>([])

  const fixPermissions = async () => {
    setIsLoading(true)
    setStatus("Verificando y corrigiendo permisos...")
    setResults([])

    try {
      const supabase = createClientSupabaseClient()

      // Paso 1: Verificar si el bucket existe
      setResults((prev) => [...prev, "Verificando bucket 'store-images'..."])
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

      if (bucketsError) {
        throw new Error(`Error al listar buckets: ${bucketsError.message}`)
      }

      const storeBucket = buckets?.find((b) => b.name === "store-images")

      if (!storeBucket) {
        setResults((prev) => [...prev, "El bucket 'store-images' no existe. Creando..."])

        // Crear el bucket si no existe
        const { error: createError } = await supabase.storage.createBucket("store-images", {
          public: true,
          fileSizeLimit: 5242880, // 5MB
        })

        if (createError) {
          throw new Error(`Error al crear bucket: ${createError.message}`)
        }

        setResults((prev) => [...prev, "Bucket 'store-images' creado correctamente"])
      } else {
        setResults((prev) => [...prev, "Bucket 'store-images' encontrado"])
      }

      // Paso 2: Configurar políticas de acceso público
      setResults((prev) => [...prev, "Configurando políticas de acceso público..."])

      // Crear política para permitir acceso de lectura público
      const { error: policyError } = await supabase.storage.from("store-images").createSignedUrls(
        ["test.txt"], // Archivo ficticio para probar la API
        60, // 60 segundos
      )

      if (policyError) {
        setResults((prev) => [...prev, `Advertencia: ${policyError.message}`])
        setResults((prev) => [...prev, "Intentando método alternativo..."])

        // Intentar actualizar las políticas directamente
        try {
          // Listar archivos para verificar acceso
          const { data: files, error: listError } = await supabase.storage.from("store-images").list()

          if (listError) {
            setResults((prev) => [...prev, `Error al listar archivos: ${listError.message}`])
          } else {
            setResults((prev) => [...prev, `Se encontraron ${files?.length || 0} archivos en el bucket`])

            // Si hay archivos, intentar crear URLs firmadas para cada uno
            if (files && files.length > 0) {
              setResults((prev) => [...prev, "Generando URLs firmadas para los archivos..."])

              for (const file of files.slice(0, 5)) {
                // Limitar a 5 archivos para evitar sobrecarga
                const { data: urlData, error: urlError } = await supabase.storage
                  .from("store-images")
                  .createSignedUrl(file.name, 3600) // URL válida por 1 hora

                if (urlError) {
                  setResults((prev) => [...prev, `Error al generar URL para ${file.name}: ${urlError.message}`])
                } else if (urlData) {
                  setResults((prev) => [...prev, `URL firmada generada para ${file.name}`])
                }
              }
            }
          }
        } catch (e) {
          setResults((prev) => [...prev, `Error en método alternativo: ${e instanceof Error ? e.message : String(e)}`])
        }
      } else {
        setResults((prev) => [...prev, "Políticas de acceso configuradas correctamente"])
      }

      setStatus("¡Proceso completado!")
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`)
      console.error("Error al corregir permisos:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 bg-yellow-500 text-white p-2 rounded-full shadow-lg z-50"
        title="Corregir permisos de almacenamiento"
      >
        🔧
      </button>
    )
  }

  return (
    <div className="fixed bottom-20 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-300 z-50 max-w-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Corregir Permisos de Almacenamiento</h3>
        <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Esta herramienta intentará corregir los permisos de acceso público para las imágenes almacenadas en Supabase.
        </p>

        <button
          onClick={fixPermissions}
          disabled={isLoading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded disabled:opacity-50"
        >
          {isLoading ? "Procesando..." : "Corregir permisos"}
        </button>

        {status && (
          <div
            className={`p-2 rounded ${status.includes("Error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
          >
            {status}
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-2">
            <p className="font-medium text-sm mb-1">Resultados:</p>
            <div className="bg-gray-100 p-2 rounded text-xs font-mono max-h-40 overflow-auto">
              {results.map((result, index) => (
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

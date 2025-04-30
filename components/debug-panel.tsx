"use client"

import { useState } from "react"
import type { Store } from "../types"

interface DebugPanelProps {
  stores: Store[]
}

export default function DebugPanel({ stores }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-full shadow-lg z-50"
        title="Abrir panel de depuración"
      >
        🐞
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-300 z-50 max-w-md max-h-[80vh] overflow-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Panel de depuración</h3>
        <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold mb-1">Tiendas ({stores.length}):</h4>
        <div className="space-y-2">
          {stores.map((store) => (
            <div key={store.id} className="border border-gray-200 p-2 rounded">
              <div>
                <strong>ID:</strong> {store.id}
              </div>
              <div>
                <strong>Nombre:</strong> {store.name}
              </div>
              <div>
                <strong>Por defecto:</strong> {store.isDefault ? "Sí" : "No"}
              </div>
              <div>
                <strong>Imagen:</strong>{" "}
                {store.image ? (
                  <div>
                    <div className="text-xs text-gray-500 truncate">{store.image.substring(0, 30)}...</div>
                    <img
                      src={store.image || "/placeholder.svg"}
                      alt={store.name}
                      className="mt-1 w-16 h-16 object-cover border border-gray-300 rounded"
                    />
                  </div>
                ) : (
                  "No tiene"
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Este panel es solo para depuración y no debería estar visible en producción.
      </div>
    </div>
  )
}

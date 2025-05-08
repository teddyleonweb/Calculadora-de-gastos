"use client"

import type React from "react"
import type { Rectangle } from "../types"

interface ImageEditorProps {
  imageSrc: string
  onProcessFullImage: () => void
  onProcessSelectedArea: () => void
  onProcessBothAreas: () => void
  isLoading: boolean
  errorMessage: string | null
  debugText: string | null
  debugSteps: string[]
  showDebugSteps: boolean
  onToggleDebugSteps: () => void
  rect: Rectangle | null
  setRect: (rect: Rectangle | null) => void
  titleRect: Rectangle | null
  setTitleRect: (rect: Rectangle | null) => void
  priceRect: Rectangle | null
  setPriceRect: (rect: Rectangle | null) => void
  scanMode: "basic" | "advanced"
  setScanMode: (mode: "basic" | "advanced") => void
  selectionMode: "title" | "price" | "basic" | null
  setSelectionMode: (mode: "title" | "price" | "basic" | null) => void
  selectionsReady: boolean
  setSelectionsReady: (ready: boolean) => void
  resetSelection: () => void
}

const ImageEditor: React.FC<ImageEditorProps> = ({
  imageSrc,
  onProcessFullImage,
  onProcessSelectedArea,
  onProcessBothAreas,
  isLoading,
  errorMessage,
  debugText,
  debugSteps,
  showDebugSteps,
  onToggleDebugSteps,
  rect,
  setRect,
  titleRect,
  setTitleRect,
  priceRect,
  setPriceRect,
  scanMode,
  setScanMode,
  selectionMode,
  setSelectionMode,
  selectionsReady,
  setSelectionsReady,
  resetSelection,
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <h2 className="text-lg font-bold mb-4">Editor de Imagen</h2>

      <div className="mb-4">
        <img src={imageSrc || "/placeholder.svg"} alt="Imagen cargada" className="max-w-full h-auto rounded-md" />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={onProcessFullImage}
          className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600"
          disabled={isLoading}
        >
          {isLoading ? "Procesando..." : "Procesar Imagen Completa"}
        </button>

        <button
          onClick={resetSelection}
          className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
          disabled={isLoading}
        >
          Resetear Selección
        </button>
      </div>

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{errorMessage}</div>
      )}

      {debugText && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Texto Extraído:</h3>
            <button onClick={onToggleDebugSteps} className="text-blue-500 text-sm hover:underline">
              {showDebugSteps ? "Ocultar Pasos" : "Mostrar Pasos"}
            </button>
          </div>
          <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-auto max-h-40">{debugText}</pre>

          {showDebugSteps && debugSteps.length > 0 && (
            <div className="mt-2">
              <h3 className="font-bold mb-1">Pasos de Procesamiento:</h3>
              <ol className="list-decimal list-inside bg-gray-100 p-3 rounded-md text-sm overflow-auto max-h-40">
                {debugSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ImageEditor

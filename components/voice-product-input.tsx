"use client"

import { useState, useEffect } from "react"
import { Mic, MicOff } from "lucide-react"

interface VoiceProductInputProps {
  onProductDetected: (title: string, price: number) => void
}

export default function VoiceProductInput({ onProductDetected }: VoiceProductInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [recognition, setRecognition] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition()
        recognitionInstance.continuous = true
        recognitionInstance.lang = "es-ES"
        recognitionInstance.interimResults = true
        recognitionInstance.maxAlternatives = 1

        recognitionInstance.onresult = (event: any) => {
          let interimTranscript = ""
          let finalTranscript = ""

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }

          const currentText = (finalTranscript || interimTranscript).toLowerCase()
          console.log("[v0] Texto reconocido:", currentText)
          setTranscript(currentText)

          if (currentText.length > 5) {
            processVoiceCommand(currentText)
          }
        }

        recognitionInstance.onerror = (event: any) => {
          console.error("[v0] Error en reconocimiento de voz:", event.error)
          if (event.error !== "no-speech") {
            setError(`Error: ${event.error}`)
          }
          setIsListening(false)
        }

        recognitionInstance.onend = () => {
          console.log("[v0] Reconocimiento de voz finalizado")
          setIsListening(false)
        }

        setRecognition(recognitionInstance)
      } else {
        setError("Tu navegador no soporta reconocimiento de voz")
      }
    }
  }, [])

  const processVoiceCommand = (text: string) => {
    console.log("[v0] Procesando comando de voz:", text)

    const patterns = [
      /(?:agrega|añade|agregar|añadir)\s+(.+?)\s+(?:precio|a|por|en|de)?\s*(\d+(?:[.,]\d{1,2})?)\s*(?:dólares?|dolares?|bolívares?|bolivares?|bs|usd|\$)?/i,
      /(?:agrega|añade|agregar|añadir)\s+(.+?)\s+(\d+(?:[.,]\d{1,2})?)/i,
      /(.+?)\s+(?:precio|a|por|en|de)?\s*(\d+(?:[.,]\d{1,2})?)\s*(?:dólares?|dolares?|bolívares?|bolivares?|bs|usd|\$)?/i,
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        const productName = match[1].trim()
        const priceText = match[2].replace(",", ".")
        const price = Number.parseFloat(priceText)

        const commandWords = ["agrega", "añade", "agregar", "añadir", "precio"]
        const cleanProductName = productName
          .split(" ")
          .filter((word) => !commandWords.includes(word.toLowerCase()))
          .join(" ")
          .trim()

        if (cleanProductName && !isNaN(price) && price > 0) {
          console.log("[v0] ✓ Producto detectado:", cleanProductName, "Precio:", price)
          console.log("[v0] Llamando a onProductDetected...")

          onProductDetected(cleanProductName, price)

          setTranscript(`✓ Agregado: ${cleanProductName} - $${price}`)

          if (recognition && isListening) {
            setTimeout(() => {
              recognition.stop()
            }, 500)
          }
          return
        }
      }
    }

    console.log("[v0] No se pudo extraer producto y precio del texto")
  }

  const startListening = () => {
    if (recognition) {
      setError(null)
      setTranscript("")
      setIsListening(true)
      recognition.start()
      console.log("[v0] Iniciando reconocimiento de voz...")
    }
  }

  const stopListening = () => {
    if (recognition) {
      recognition.stop()
      setIsListening(false)
      console.log("[v0] Deteniendo reconocimiento de voz...")
    }
  }

  return (
    <div className="mb-4 p-3 md:p-4 border border-gray-200 rounded bg-gradient-to-r from-purple-50 to-blue-50">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <Mic className="w-5 h-5 mr-2" />
        Agregar producto por voz
      </h3>

      <div className="flex flex-col space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={!recognition}
            className={`flex items-center gap-2 px-4 py-2 rounded font-medium transition-colors ${
              isListening
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-5 h-5" />
                Detener
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                Iniciar grabación
              </>
            )}
          </button>

          {isListening && (
            <div className="flex items-center gap-2 text-red-500 animate-pulse">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium">Escuchando...</span>
            </div>
          )}
        </div>

        {transcript && (
          <div className="p-2 bg-white border border-gray-300 rounded text-sm">
            <span className="font-medium">Texto reconocido:</span> {transcript}
          </div>
        )}

        {error && <div className="p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">{error}</div>}

        <div className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200">
          <p className="font-medium mb-1">Ejemplos de comandos:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>"Agrega mayonesa precio 5 dólares"</li>
            <li>"Añade leche 3 bolívares"</li>
            <li>"Agregar pan 2.50"</li>
            <li>"Mayonesa 5 dólares"</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

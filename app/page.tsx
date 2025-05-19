"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../contexts/auth-context"
import Home from "../home"
import Loading from "./loading"

export default function Page() {
  const { isAuthenticated, isInitialized } = useAuth()
  const router = useRouter()
  const [showLoading, setShowLoading] = useState(true)

  useEffect(() => {
    // Si la autenticación está inicializada
    if (isInitialized) {
      // Si no está autenticado, redirigir a login
      if (!isAuthenticated) {
        router.push("/login")
      } else {
        // Si está autenticado, mostrar la página principal
        setShowLoading(false)
      }
    }

    // Timeout de seguridad para evitar pantalla de carga infinita
    const timeoutId = setTimeout(() => {
      setShowLoading(false)
    }, 5000) // 5 segundos máximo de carga

    return () => clearTimeout(timeoutId)
  }, [isAuthenticated, isInitialized, router])

  // Mostrar pantalla de carga mientras se inicializa
  if (showLoading && !isInitialized) {
    return <Loading />
  }

  // Si está autenticado, mostrar la página principal
  if (isAuthenticated) {
    return <Home />
  }

  // Si no está autenticado pero ya pasó el tiempo de carga, mostrar un mensaje
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Redirigiendo...</h1>
        <p className="text-gray-600 mb-4 text-center">
          Por favor espera mientras te redirigimos a la página de inicio de sesión.
        </p>
        <div className="flex justify-center">
          <button
            onClick={() => router.push("/login")}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Ir a inicio de sesión
          </button>
        </div>
      </div>
    </div>
  )
}

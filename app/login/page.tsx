"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "../../contexts/auth-context"
import Header from "../../components/header"
import Footer from "../../components/footer"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  const { login, error, isAuthenticated } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Verificar si el usuario viene de registrarse
  useEffect(() => {
    const registered = searchParams.get("registered")
    if (registered === "true") {
      setSuccessMessage("Registro exitoso. Ahora puedes iniciar sesión.")
    }
  }, [searchParams])

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSuccessMessage(null)
    setDebugInfo(null)

    // Validaciones básicas
    if (!email.trim()) {
      setFormError("Por favor ingrese su correo electrónico")
      return
    }

    if (!password) {
      setFormError("Por favor ingrese su contraseña")
      return
    }

    setIsLoading(true)
    setDebugInfo("Iniciando proceso de login...")

    try {
      console.log("Intentando iniciar sesión con:", email)
      setDebugInfo((prev) => `${prev}\nEnviando solicitud de inicio de sesión...`)

      // Crear un timeout manual para asegurar que no se quede colgado
      const loginPromise = login(email, password)

      // Crear una promesa que se resuelve después de 10 segundos
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => {
          reject(new Error("La solicitud ha tardado demasiado tiempo. Por favor, inténtelo de nuevo."))
        }, 10000) // 10 segundos
      })

      // Usar Promise.race para tomar el resultado de la primera promesa que se resuelva
      const success = await Promise.race([loginPromise, timeoutPromise])

      setDebugInfo((prev) => `${prev}\nRespuesta recibida: ${JSON.stringify(success)}`)

      if (success) {
        setDebugInfo((prev) => `${prev}\nInicio de sesión exitoso, redirigiendo...`)
        router.push("/")
      } else {
        setDebugInfo((prev) => `${prev}\nInicio de sesión fallido pero no se lanzó excepción`)
        setFormError("Error al iniciar sesión: credenciales inválidas")
        setIsLoading(false)
      }
    } catch (err) {
      console.error("Error al iniciar sesión:", err)
      setDebugInfo((prev) => `${prev}\nError capturado: ${err instanceof Error ? err.message : String(err)}`)
      setFormError(err instanceof Error ? err.message : "Error al iniciar sesión")
      setIsLoading(false)
    }
  }

  // Añadir un timeout para resetear el estado de carga si se queda atascado
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    if (isLoading) {
      timeoutId = setTimeout(() => {
        console.log("Timeout de carga activado - reseteando estado")
        setIsLoading(false)
        setFormError("La solicitud ha tardado demasiado tiempo. Por favor, inténtelo de nuevo.")
        setDebugInfo((prev) => `${prev || ""}\nTimeout de solicitud activado después de 15 segundos`)
      }, 15000) // 15 segundos de timeout
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isLoading])

  return (
    <>
      <Header />
      <div className="container mx-auto p-4 max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Iniciar sesión</h1>

        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">{successMessage}</div>
        )}

        {(formError || error) && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{formError || error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            ¿No tienes una cuenta?{" "}
            <Link href="/register" className="text-blue-600 hover:text-blue-800">
              Registrarse
            </Link>
          </p>
        </div>

        {/* Botón para cancelar la solicitud si se queda cargando */}
        {isLoading && (
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setIsLoading(false)
                setDebugInfo((prev) => `${prev || ""}\nSolicitud cancelada manualmente por el usuario`)
              }}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Cancelar solicitud
            </button>
          </div>
        )}

        {/* Información de depuración */}
        {debugInfo && (
          <div className="mt-4 p-3 bg-gray-100 border border-gray-300 text-gray-700 rounded text-xs whitespace-pre-wrap">
            <strong>Información de depuración:</strong>
            <br />
            {debugInfo}
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}

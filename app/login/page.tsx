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
  const [isOfflineMode, setIsOfflineMode] = useState(false)

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

  // Verificar si hay conexión a internet
  useEffect(() => {
    const checkOnlineStatus = () => {
      setIsOfflineMode(!navigator.onLine)
    }

    // Verificar estado inicial
    checkOnlineStatus()

    // Agregar event listeners para cambios en la conexión
    window.addEventListener("online", checkOnlineStatus)
    window.addEventListener("offline", checkOnlineStatus)

    return () => {
      window.removeEventListener("online", checkOnlineStatus)
      window.removeEventListener("offline", checkOnlineStatus)
    }
  }, [])

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, router])

  // Verificar si hay credenciales guardadas
  useEffect(() => {
    const savedEmail = window.localStorage.getItem("saved_email")
    if (savedEmail) {
      setEmail(savedEmail)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSuccessMessage(null)

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

    try {
      // Guardar email para futuras sesiones
      window.localStorage.setItem("saved_email", email)

      const success = await login(email, password)
      if (success) {
        router.push("/")
      }
    } catch (err) {
      console.error("Error al iniciar sesión:", err)

      // Verificar si es un error de red
      if (err instanceof Error && err.message.includes("NetworkError")) {
        setFormError("Error de conexión. Verifica tu conexión a internet e intenta nuevamente.")
        setIsOfflineMode(true)
      } else {
        setFormError(err instanceof Error ? err.message : "Error al iniciar sesión")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div className="container mx-auto p-4 max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Iniciar sesión</h1>

        {isOfflineMode && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
            Modo sin conexión: Algunas funciones pueden estar limitadas hasta que se restablezca la conexión.
          </div>
        )}

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
      </div>
      <Footer />
    </>
  )
}

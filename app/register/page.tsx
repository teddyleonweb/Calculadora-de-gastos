"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "../../contexts/auth-context"
import Header from "../../components/header"

export default function Register() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  const { register, error, isAuthenticating } = useAuth()
  const router = useRouter()

  // Sincronizar el estado de carga con el contexto de autenticación
  useEffect(() => {
    setIsLoading(isAuthenticating)
  }, [isAuthenticating])

  // Modificar la función handleSubmit para mejorar el manejo de errores
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSuccessMessage(null)
    setDebugInfo(null)

    // Validaciones básicas
    if (!name.trim()) {
      setFormError("Por favor ingrese su nombre")
      return
    }

    if (!email.trim()) {
      setFormError("Por favor ingrese su correo electrónico")
      return
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setFormError("Por favor ingrese un correo electrónico válido")
      return
    }

    if (!password) {
      setFormError("Por favor ingrese una contraseña")
      return
    }

    if (password.length < 6) {
      setFormError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    if (password !== confirmPassword) {
      setFormError("Las contraseñas no coinciden")
      return
    }

    setIsLoading(true)
    setDebugInfo("Enviando solicitud de registro...")

    try {
      console.log("Iniciando proceso de registro...")
      const success = await register(name, email, password)

      setDebugInfo((prev) => `${prev}\nRespuesta recibida: ${success ? "exitosa" : "fallida"}`)

      if (success) {
        setSuccessMessage("Registro exitoso. Redirigiendo al inicio de sesión...")
        setDebugInfo((prev) => `${prev}\nRedirigiendo al inicio de sesión...`)
        setTimeout(() => {
          router.push("/login?registered=true")
        }, 2000)
      } else {
        setDebugInfo((prev) => `${prev}\nRegistro fallido pero no se lanzó excepción`)
        setFormError("Error al registrarse. Por favor, inténtelo de nuevo.")
      }
    } catch (err) {
      console.error("Error completo al registrarse:", err)
      setDebugInfo((prev) => `${prev}\nError capturado: ${err instanceof Error ? err.message : String(err)}`)
      setFormError(err instanceof Error ? err.message : "Error al registrarse")
    } finally {
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
        setDebugInfo((prev) => `${prev}\nTimeout de solicitud activado después de 15 segundos`)
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
        <h1 className="text-2xl font-bold mb-6 text-center">Crear una cuenta</h1>

        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">{successMessage}</div>
        )}

        {(formError || error) && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{formError || error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>

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
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              {isLoading ? "Registrando..." : "Registrarse"}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-800">
              Iniciar sesión
            </Link>
          </p>
        </div>

        {/* Botón para cancelar la solicitud si se queda cargando */}
        {isLoading && (
          <div className="mt-4 text-center">
            <button onClick={() => setIsLoading(false)} className="text-sm text-red-600 hover:text-red-800">
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
    </>
  )
}

"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "../../contexts/auth-context"
import Header from "../../components/header"
import Footer from "../../components/footer"

export default function ResetPassword() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  const { resetPassword, error } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Obtener el token de la URL
  useEffect(() => {
    const tokenParam = searchParams.get("token")
    if (!tokenParam) {
      setFormError("Token de recuperación no válido o expirado")
    } else {
      setToken(tokenParam)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSuccessMessage(null)

    // Validaciones
    if (!token) {
      setFormError("Token de recuperación no válido")
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

    try {
      const success = await resetPassword(token, password)
      if (success) {
        setSuccessMessage("Contraseña restablecida exitosamente. Redirigiendo al inicio de sesión...")
        setTimeout(() => {
          router.push("/login?reset=true")
        }, 2000)
      }
    } catch (err) {
      console.error("Error al restablecer contraseña:", err)
      setFormError(err instanceof Error ? err.message : "Error al restablecer contraseña")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div className="container mx-auto p-4 max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Restablecer contraseña</h1>

        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">{successMessage}</div>
        )}

        {(formError || error) && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{formError || error}</div>
        )}

        {token ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Nueva contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
                placeholder="Mínimo 6 caracteres"
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
                placeholder="Repite la contraseña"
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? "Restableciendo..." : "Restablecer contraseña"}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              El enlace de recuperación no es válido o ha expirado. Por favor solicita uno nuevo.
            </p>
            <Link
              href="/forgot-password"
              className="inline-block py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Solicitar nuevo enlace
            </Link>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            <Link href="/login" className="text-blue-600 hover:text-blue-800">
              Volver al inicio de sesión
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </>
  )
}

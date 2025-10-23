"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useAuth } from "../../contexts/auth-context"
import Header from "../../components/header"
import Footer from "../../components/footer"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const { forgotPassword, error } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSuccessMessage(null)

    // Validación básica
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

    setIsLoading(true)

    try {
      const success = await forgotPassword(email)
      if (success) {
        setSuccessMessage(
          "Se ha enviado un correo electrónico con instrucciones para restablecer tu contraseña. Por favor revisa tu bandeja de entrada.",
        )
        setEmail("")
      }
    } catch (err) {
      console.error("Error al solicitar recuperación:", err)
      setFormError(err instanceof Error ? err.message : "Error al solicitar recuperación de contraseña")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div className="container mx-auto p-4 max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Recuperar contraseña</h1>

        <p className="text-sm text-gray-600 mb-6 text-center">
          Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
        </p>

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
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "Enviando..." : "Enviar instrucciones"}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            <Link href="/login" className="text-blue-600 hover:text-blue-800">
              Volver al inicio de sesión
            </Link>
          </p>
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

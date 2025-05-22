"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Header from "../../components/header"
import Footer from "../../components/footer"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Verificar si el usuario viene de registrarse
  useEffect(() => {
    const registered = searchParams.get("registered")
    if (registered === "true") {
      setSuccessMessage("Registro exitoso. Ahora puedes iniciar sesión.")
    }
  }, [searchParams])

  // Verificar si ya hay un token en localStorage (usuario ya autenticado)
  useEffect(() => {
    const token = localStorage.getItem("auth_token")
    if (token) {
      router.push("/")
    }
  }, [router])

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
    console.log("Iniciando proceso de login simplificado...")

    try {
      // Simular un pequeño retraso para que parezca real
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Guardar un token falso en localStorage
      const fakeToken = "fake_token_for_development_" + Math.random().toString(36).substring(2, 15)
      localStorage.setItem("auth_token", fakeToken)

      // Guardar datos del usuario en localStorage para simular una sesión
      const userData = {
        id: "1",
        name: "Usuario de Prueba",
        email: email,
      }
      localStorage.setItem("user_data", JSON.stringify(userData))

      console.log("Login exitoso, redirigiendo...")
      router.push("/")
    } catch (err) {
      console.error("Error en login simplificado:", err)
      setFormError("Error al iniciar sesión. Por favor, inténtelo de nuevo.")
      setIsLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div className="container mx-auto p-4 max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Iniciar sesión</h1>

        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">{successMessage}</div>
        )}

        {formError && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{formError}</div>}

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
                console.log("Solicitud cancelada manualmente por el usuario")
              }}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Cancelar solicitud
            </button>
          </div>
        )}

        {/* Mensaje de modo desarrollo */}
        <div className="mt-6 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded text-sm">
          <strong>Modo desarrollo:</strong> Cualquier combinación de correo y contraseña funcionará para iniciar sesión.
        </div>
      </div>
      <Footer />
    </>
  )
}

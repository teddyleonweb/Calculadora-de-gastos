"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Header from "../../components/header"
import Footer from "../../components/footer"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Simulación de login exitoso
      console.log("Iniciando sesión con:", { email, password })

      // Guardar token en localStorage
      localStorage.setItem("auth_token", "fake_token_" + Date.now())

      // Guardar datos del usuario
      localStorage.setItem(
        "user_data",
        JSON.stringify({
          id: "1",
          name: "Usuario de Prueba",
          email: email,
        }),
      )

      // Esperar un poco para simular la petición
      await new Promise((resolve) => setTimeout(resolve, 500))

      console.log("Login exitoso, redirigiendo...")
      router.push("/")
    } catch (err) {
      console.error("Error en login:", err)
      setError("Error al iniciar sesión. Por favor, inténtelo de nuevo.")
      setIsLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div className="container mx-auto p-4 max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Iniciar sesión</h1>

        {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

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

        <div className="mt-6 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded text-sm">
          <strong>Modo desarrollo:</strong> Cualquier combinación de correo y contraseña funcionará para iniciar sesión.
        </div>
      </div>
      <Footer />
    </>
  )
}

"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Header from "../../components/header"
import Footer from "../../components/footer"

export default function Register() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    // Validaciones básicas
    if (!name.trim()) {
      setFormError("Por favor ingrese su nombre")
      return
    }

    if (!email.trim()) {
      setFormError("Por favor ingrese su correo electrónico")
      return
    }

    if (!password) {
      setFormError("Por favor ingrese una contraseña")
      return
    }

    if (password !== confirmPassword) {
      setFormError("Las contraseñas no coinciden")
      return
    }

    setIsLoading(true)
    console.log("Iniciando proceso de registro simplificado...")

    try {
      // Simular un pequeño retraso para que parezca real
      await new Promise((resolve) => setTimeout(resolve, 800))

      console.log("Registro exitoso, redirigiendo a login...")
      router.push("/login?registered=true")
    } catch (err) {
      console.error("Error en registro simplificado:", err)
      setFormError("Error al registrarse. Por favor, inténtelo de nuevo.")
      setIsLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div className="container mx-auto p-4 max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Registrarse</h1>

        {formError && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{formError}</div>}

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

        {/* Mensaje de modo desarrollo */}
        <div className="mt-6 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded text-sm">
          <strong>Modo desarrollo:</strong> El registro siempre será exitoso y te redirigirá a la página de inicio de
          sesión.
        </div>
      </div>
      <Footer />
    </>
  )
}

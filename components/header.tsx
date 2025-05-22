"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userName, setUserName] = useState("")
  const router = useRouter()

  useEffect(() => {
    // Verificar si hay un token en localStorage
    const token = localStorage.getItem("auth_token")
    setIsAuthenticated(!!token)

    // Obtener el nombre del usuario si está autenticado
    if (token) {
      try {
        const userData = localStorage.getItem("user_data")
        if (userData) {
          const user = JSON.parse(userData)
          setUserName(user.name || "Usuario")
        }
      } catch (error) {
        console.error("Error al obtener datos del usuario:", error)
      }
    }
  }, [])

  const handleLogout = () => {
    // Eliminar token y datos del usuario
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_data")
    setIsAuthenticated(false)
    router.push("/login")
  }

  return (
    <header className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Calculadora de Costos
        </Link>

        <nav>
          <ul className="flex space-x-4">
            {isAuthenticated ? (
              <>
                <li>
                  <Link href="/" className="hover:text-blue-200">
                    Inicio
                  </Link>
                </li>
                <li>
                  <Link href="/finances" className="hover:text-blue-200">
                    Finanzas
                  </Link>
                </li>
                <li>
                  <span className="mr-4">Hola, {userName}</span>
                  <button onClick={handleLogout} className="hover:text-blue-200">
                    Cerrar sesión
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link href="/login" className="hover:text-blue-200">
                    Iniciar sesión
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-blue-200">
                    Registrarse
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  )
}

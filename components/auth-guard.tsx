"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"

interface AuthGuardProps {
  children: ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Verificar si hay un token en localStorage
    const token = localStorage.getItem("auth_token")

    if (!token) {
      console.log("No hay token, redirigiendo a login...")
      router.push("/login")
    } else {
      console.log("Token encontrado, permitiendo acceso...")
      setIsAuthenticated(true)
    }

    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return isAuthenticated ? <>{children}</> : null
}

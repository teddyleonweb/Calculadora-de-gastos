"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"

interface AuthGuardProps {
  children: ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Rutas públicas que no requieren autenticación
    const publicRoutes = ["/login", "/register"]
    const isPublicRoute = publicRoutes.includes(pathname)

    try {
      // Verificar si hay un token en localStorage
      const token = localStorage.getItem("auth_token")

      if (!token && !isPublicRoute) {
        console.log("No hay token y no es ruta pública, redirigiendo a login...")
        router.push("/login")
      } else if (token && isPublicRoute) {
        console.log("Token encontrado en ruta pública, redirigiendo a home...")
        router.push("/")
      }
    } catch (error) {
      console.error("Error al verificar autenticación:", error)
    } finally {
      setIsLoading(false)
    }
  }, [router, pathname])

  // Siempre renderizar el contenido, pero mostrar loading mientras se verifica
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

  // Siempre renderizar los hijos
  return <>{children}</>
}

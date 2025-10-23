"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "../contexts/auth-context"

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isInitialized } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Solo verificar después de que la autenticación se haya inicializado
    if (isInitialized) {
      const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password"]
      const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

      if (!isAuthenticated && !isPublicRoute) {
        router.push("/login")
      }
      setIsChecking(false)
    }
  }, [isAuthenticated, isInitialized, router, pathname])

  // No renderizar nada mientras se verifica la autenticación
  if (isChecking || !isInitialized) {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>
  }

  // Si no está autenticado y no está en una ruta pública, no renderizar nada
  const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password"]
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  if (!isAuthenticated && !isPublicRoute) {
    return null
  }

  return <>{children}</>
}

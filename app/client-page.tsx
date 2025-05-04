"use client"

import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { Suspense } from "react"
import AuthGuard from "../components/auth-guard"

// Mostrar un indicador de carga mientras se carga el componente Home
const LoadingFallback = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
)

// Importar el componente Home de forma dinámica con opciones optimizadas
const DynamicHome = dynamic(() => import("../home"), {
  ssr: false,
  loading: LoadingFallback,
})

export default function ClientPage() {
  const pathname = usePathname()
  const isAuthPage = pathname === "/login" || pathname === "/register"

  // No aplicar AuthGuard en páginas de autenticación
  if (isAuthPage) {
    return null
  }

  return (
    <AuthGuard>
      <Suspense fallback={<LoadingFallback />}>
        <DynamicHome />
      </Suspense>
    </AuthGuard>
  )
}

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import AuthGuard from "../components/auth-guard"
import Header from "../components/header"
import Footer from "../components/footer"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Verificar si hay un token en localStorage
    const token = localStorage.getItem("auth_token")
    if (!token) {
      router.push("/login")
    }
  }, [router])

  return (
    <AuthGuard>
      <Header />
      <main className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Bienvenido a Calculadora de Costos</h1>
        <p className="mb-4">
          Esta aplicación te ayuda a gestionar tus gastos, ingresos y productos de manera eficiente.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-3">Gestión de Productos</h2>
            <p className="text-gray-600">Registra y administra tus productos con precios y detalles.</p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Ver Productos
            </button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-3">Finanzas</h2>
            <p className="text-gray-600">Controla tus ingresos y gastos para una mejor gestión financiera.</p>
            <button
              onClick={() => router.push("/finances")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Ver Finanzas
            </button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-3">Escaneo de Códigos</h2>
            <p className="text-gray-600">Escanea códigos de barras para agregar productos rápidamente.</p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Escanear Código
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </AuthGuard>
  )
}

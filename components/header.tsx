"use client"

import Link from "next/link"
import { useAuth } from "../contexts/auth-context"
import { LogOut, User } from "lucide-react"

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth()

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="flex flex-col">
            <Link href="/" className="text-xl font-bold text-gray-800">
              Extractor de Precios
            </Link>
            {user && <span className="text-sm text-gray-600">Hola {user.name}</span>}
          </div>
        </div>

        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User size={18} className="text-gray-600" />
              <span className="text-gray-700">{user?.name}</span>
            </div>
            <button
              onClick={() => {
                logout()
                window.location.href = "/login" // Redirección manual para evitar problemas con el router
              }}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900">
              Iniciar sesión
            </Link>
            <Link href="/register" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
              Registrarse
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}

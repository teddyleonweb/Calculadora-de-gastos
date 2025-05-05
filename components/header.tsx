"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../contexts/auth-context"
import { Menu, X, LogOut, User } from "lucide-react"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">Calcuapp</h1>
          </div>

          {/* Menú para móviles */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white focus:outline-none"
              aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Menú para escritorio */}
          <div className="hidden md:flex items-center space-x-4">
            {user && (
              <>
                <div className="flex items-center">
                  <User size={16} className="mr-1" />
                  <span>{user.name || user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded"
                >
                  <LogOut size={16} className="mr-1" />
                  Cerrar sesión
                </button>
              </>
            )}
          </div>
        </div>

        {/* Menú móvil desplegable */}
        {isMenuOpen && (
          <div className="md:hidden mt-2 py-2 border-t border-blue-500">
            {user && (
              <div className="space-y-2">
                <div className="flex items-center py-2">
                  <User size={16} className="mr-2" />
                  <span>{user.name || user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded"
                >
                  <LogOut size={16} className="mr-2" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

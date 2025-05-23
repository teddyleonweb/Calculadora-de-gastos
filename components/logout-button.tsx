"use client"

import { useRouter } from "next/navigation"

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = () => {
    // Eliminar token y datos de usuario
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_data")

    // Redirigir a login
    router.push("/login")
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
    >
      Cerrar sesión
    </button>
  )
}

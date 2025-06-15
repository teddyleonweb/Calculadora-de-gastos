"use client"

import Link from "next/link"
import Image from "next/image"
import { useAuth } from "../contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut } from "lucide-react"
import { usePathname } from "next/navigation" // Importar usePathname

const Header = () => {
  const { user, logout } = useAuth()
  const pathname = usePathname() // Obtener la ruta actual

  // Example navigation links (can be fetched from a CMS or config file)
  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Services", href: "/services" },
    {
      name: "Finanzas",
      href: "/finances",
    },
  ]

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto py-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex-shrink-0 -ml-2">
            <Link href="/" className="flex items-center">
              <Image
                src="/images/logo.png"
                alt="MyMoney Logo"
                width={180}
                height={50}
                className="h-10 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Área de usuario y logout */}
          <div className="flex items-center space-x-4 -mr-2">
            {user && (
              <>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar || ""} alt={user.name || "Usuario"} />
                    <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : "U"}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden md:inline-block">{user.name || user.email}</span>
                </div>
                <Button variant="outline" size="sm" onClick={logout} className="flex items-center space-x-1">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden md:inline-block">Cerrar sesión</span>
                </Button>
              </>
            )}
            {!user &&
              pathname !== "/login" && ( // Añadir la condición para ocultar el botón en /login
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Iniciar sesión
                  </Button>
                </Link>
              )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

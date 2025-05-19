"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { AuthService } from "../services/auth-service"

// Definir el tipo de usuario
interface User {
  id: string
  name: string
  email: string
}

// Definir el contexto de autenticación
interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>
  logout: () => void
  loading: boolean
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Hook personalizado para usar el contexto
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}

// Proveedor del contexto
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // Verificar si el usuario está autenticado al cargar la página
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verificar si hay un token en localStorage
        const token = localStorage.getItem("auth_token")
        if (!token) {
          setIsAuthenticated(false)
          setUser(null)
          setLoading(false)
          return
        }

        // Verificar si el token es válido
        const userData = await AuthService.validateToken(token)
        if (userData.success) {
          setUser(userData.user)
          setIsAuthenticated(true)
        } else {
          // Si el token no es válido, limpiar localStorage
          localStorage.removeItem("auth_token")
          setIsAuthenticated(false)
          setUser(null)
        }
      } catch (error) {
        console.error("Error al verificar autenticación:", error)
        setIsAuthenticated(false)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Función para iniciar sesión
  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      const result = await AuthService.login(email, password)

      if (result.success) {
        setUser(result.user)
        setIsAuthenticated(true)
      }

      return result
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      return {
        success: false,
        message: "Error al iniciar sesión. Inténtalo de nuevo más tarde.",
      }
    } finally {
      setLoading(false)
    }
  }

  // Función para registrarse
  const register = async (name: string, email: string, password: string) => {
    try {
      setLoading(true)
      const result = await AuthService.register(name, email, password)

      if (result.success) {
        setUser(result.user)
        setIsAuthenticated(true)
      }

      return result
    } catch (error) {
      console.error("Error al registrarse:", error)
      return {
        success: false,
        message: "Error al registrarse. Inténtalo de nuevo más tarde.",
      }
    } finally {
      setLoading(false)
    }
  }

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem("auth_token")
    setIsAuthenticated(false)
    setUser(null)
  }

  // Valor del contexto
  const value = {
    isAuthenticated,
    user,
    login,
    register,
    logout,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

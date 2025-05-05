"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { AuthService } from "../services/auth-service"

interface User {
  id: string
  email: string
  name?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay un token en localStorage
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("auth_token")
        if (token) {
          // Verificar si el token es válido
          const userData = await AuthService.getCurrentUser()
          if (userData) {
            setUser(userData)
          } else {
            // Si el token no es válido, eliminarlo
            localStorage.removeItem("auth_token")
          }
        }
      } catch (error) {
        console.error("Error al verificar autenticación:", error)
        localStorage.removeItem("auth_token")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { token, user } = await AuthService.login(email, password)
      localStorage.setItem("auth_token", token)
      setUser(user)
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (email: string, password: string, name: string) => {
    setLoading(true)
    try {
      const { token, user } = await AuthService.register(email, password, name)
      localStorage.setItem("auth_token", token)
      setUser(user)
    } catch (error) {
      console.error("Error al registrarse:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem("auth_token")
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}

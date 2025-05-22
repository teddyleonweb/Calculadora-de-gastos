"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { AuthService } from "../services/auth-service"
import type { User } from "../types"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  register: (name: string, email: string, password: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Verificando autenticación...")
        const isAuth = await AuthService.isAuthenticated()
        console.log("¿Usuario autenticado?", isAuth)

        setIsAuthenticated(isAuth)

        if (isAuth) {
          console.log("Obteniendo datos del usuario actual...")
          const currentUser = await AuthService.getCurrentUser()
          console.log("Usuario actual:", currentUser)
          setUser(currentUser)
        }
      } catch (err) {
        console.error("Error al verificar autenticación:", err)
        setError(err instanceof Error ? err.message : "Error al verificar autenticación")
      } finally {
        console.log("Finalizando verificación de autenticación")
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Iniciar sesión
  const login = async (email: string, password: string): Promise<boolean> => {
    console.log("Iniciando proceso de login en AuthContext")
    setError(null)
    setIsLoading(true)

    try {
      console.log("Llamando a AuthService.login")
      const result = await AuthService.login(email, password)
      console.log("Resultado de login:", result)

      setUser(result.user)
      setIsAuthenticated(true)
      setIsLoading(false)
      return true
    } catch (err) {
      console.error("Error en login (AuthContext):", err)
      setError(err instanceof Error ? err.message : "Error al iniciar sesión")
      setIsAuthenticated(false)
      setUser(null)
      setIsLoading(false)
      return false
    }
  }

  // Cerrar sesión
  const logout = async (): Promise<void> => {
    setIsLoading(true)

    try {
      await AuthService.logout()
      setUser(null)
      setIsAuthenticated(false)
      router.push("/login")
    } catch (err) {
      console.error("Error al cerrar sesión:", err)
      setError(err instanceof Error ? err.message : "Error al cerrar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  // Registrar usuario
  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setError(null)
    setIsLoading(true)

    try {
      const success = await AuthService.register(name, email, password)
      setIsLoading(false)
      return success
    } catch (err) {
      console.error("Error al registrar:", err)
      setError(err instanceof Error ? err.message : "Error al registrar usuario")
      setIsLoading(false)
      return false
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        error,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}

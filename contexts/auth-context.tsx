"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { AuthService } from "../services/auth-service"
import type { User, AuthContextType } from "../types"

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Proveedor del contexto
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isInitialized, setIsInitialized] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Verificar si hay una sesión al cargar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Verificando autenticación del usuario...")
        const isAuth = await AuthService.isAuthenticated()

        if (isAuth) {
          console.log("Usuario autenticado, obteniendo datos del usuario...")
          const currentUser = await AuthService.getCurrentUser()
          if (currentUser) {
            console.log("Datos del usuario obtenidos correctamente:", currentUser.id)
            setUser(currentUser)
            setIsAuthenticated(true)
          } else {
            console.log("No se pudieron obtener los datos del usuario a pesar de estar autenticado")
            setIsAuthenticated(false)
          }
        } else {
          console.log("Usuario no autenticado")
          setIsAuthenticated(false)
        }
      } catch (err) {
        console.error("Error al verificar autenticación:", err)
        setIsAuthenticated(false)
      } finally {
        console.log("Inicialización de autenticación completada")
        setIsInitialized(true)
      }
    }

    checkAuth()
  }, [])

  // Función para iniciar sesión
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null)
      console.log("Iniciando sesión con email:", email)
      const loggedUser = await AuthService.login(email, password)

      if (loggedUser) {
        console.log("Sesión iniciada correctamente, usuario:", loggedUser.id)
        setUser(loggedUser)
        setIsAuthenticated(true)
        return true
      } else {
        console.error("No se recibieron datos de usuario después del login")
        setError("Error al iniciar sesión: no se recibieron datos de usuario")
        return false
      }
    } catch (err) {
      console.error("Error durante el inicio de sesión:", err)
      setError(err instanceof Error ? err.message : "Error al iniciar sesión")
      return false
    }
  }

  // Función para registrarse
  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setError(null)
      const success = await AuthService.register(name, email, password)
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrarse")
      return false
    }
  }

  // Función para cerrar sesión
  const logout = async () => {
    await AuthService.logout()
    setUser(null)
    setIsAuthenticated(false)
  }

  // Función para solicitar recuperación de contraseña
  const forgotPassword = async (email: string): Promise<boolean> => {
    try {
      setError(null)
      const success = await AuthService.forgotPassword(email)
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al solicitar recuperación de contraseña")
      return false
    }
  }

  // Función para restablecer contraseña
  const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
    try {
      setError(null)
      const success = await AuthService.resetPassword(token, newPassword)
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al restablecer contraseña")
      return false
    }
  }

  // Valor del contexto
  const value = {
    user,
    isAuthenticated,
    isInitialized,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    error,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook para usar el contexto
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}

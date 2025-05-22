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
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false)

  // Verificar si hay una sesión al cargar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Verificando autenticación del usuario...")
        setIsAuthenticating(true)
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
        setIsAuthenticating(false)
      }
    }

    checkAuth()
  }, [])

  // Función para iniciar sesión
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null)
      setIsAuthenticating(true)
      console.log("Iniciando sesión con email:", email)

      // Añadir un timeout para evitar que se quede colgado indefinidamente
      const loginPromise = AuthService.login(email, password)

      // Crear un timeout de 10 segundos
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Tiempo de espera agotado. La solicitud ha tardado demasiado."))
        }, 10000)
      })

      // Usar Promise.race para que se resuelva con la primera promesa que termine
      const loggedUser = (await Promise.race([loginPromise, timeoutPromise])) as { token: string; user: User }

      if (loggedUser) {
        console.log("Sesión iniciada correctamente, usuario:", loggedUser.user.id)
        setUser(loggedUser.user)
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
    } finally {
      setIsAuthenticating(false)
    }
  }

  // Función para registrarse
  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setError(null)
      setIsAuthenticating(true)

      // Añadir un timeout para evitar que se quede colgado indefinidamente
      const registerPromise = AuthService.register(name, email, password)

      // Crear un timeout de 10 segundos
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Tiempo de espera agotado. La solicitud ha tardado demasiado."))
        }, 10000)
      })

      // Usar Promise.race para que se resuelva con la primera promesa que termine
      const success = (await Promise.race([registerPromise, timeoutPromise])) as boolean

      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrarse")
      return false
    } finally {
      setIsAuthenticating(false)
    }
  }

  // Función para cerrar sesión
  const logout = async () => {
    await AuthService.logout()
    setUser(null)
    setIsAuthenticated(false)
  }

  // Valor del contexto
  const value = {
    user,
    isAuthenticated,
    isInitialized,
    isAuthenticating,
    login,
    register,
    logout,
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

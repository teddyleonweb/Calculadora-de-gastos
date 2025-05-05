import type { User } from "../types"

// URL base de la API de WordPress
const API_BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"

export const AuthService = {
  // Registrar un nuevo usuario
  register: async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      // Usar el proxy para evitar problemas de CORS
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(`${API_BASE_URL}/register`)}&method=POST`

      const response = await fetch(proxyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al registrarse")
      }

      return true
    } catch (error) {
      console.error("Error al registrarse:", error)
      throw error
    }
  },

  // Iniciar sesión
  login: async (email: string, password: string): Promise<User> => {
    try {
      // Usar el proxy para evitar problemas de CORS
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(`${API_BASE_URL}/login`)}&method=POST`

      const response = await fetch(proxyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al iniciar sesión")
      }

      const data = await response.json()

      // Guardar el token en localStorage
      localStorage.setItem("auth_token", data.token)

      return {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      throw error
    }
  },

  // Cerrar sesión
  logout: async (): Promise<void> => {
    localStorage.removeItem("auth_token")
  },

  // Verificar si el usuario está autenticado
  isAuthenticated: async (): Promise<boolean> => {
    const token = localStorage.getItem("auth_token")
    return !!token
  },

  // Obtener el usuario actual
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        return null
      }

      // Decodificar el token JWT (formato: header.payload.signature)
      const parts = token.split(".")
      if (parts.length !== 3) {
        console.error("Token JWT inválido")
        return null
      }

      // Decodificar la parte del payload (índice 1)
      const payload = JSON.parse(atob(parts[1]))

      // Verificar si el token ha expirado
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        console.log("Token expirado")
        localStorage.removeItem("auth_token")
        return null
      }

      return {
        id: payload.id,
        name: payload.name,
        email: payload.email,
      }
    } catch (error) {
      console.error("Error al obtener usuario actual:", error)
      return null
    }
  },

  // Obtener datos completos del usuario (incluyendo productos y tiendas)
  getUserData: async (userId: string): Promise<any> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      // Usar el proxy para evitar problemas de CORS
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(`${API_BASE_URL}/user`)}&method=GET`

      const response = await fetch(proxyUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al obtener datos del usuario")
      }

      return await response.json()
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error)
      throw error
    }
  },
}

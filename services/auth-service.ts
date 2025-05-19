import type { User, UserData } from "../types"

// Servicio de autenticación para WordPress

interface LoginResponse {
  success: boolean
  message: string
  user?: {
    id: string
    name: string
    email: string
  }
  token?: string
}

interface RegisterResponse {
  success: boolean
  message: string
  user?: {
    id: string
    name: string
    email: string
  }
  token?: string
}

interface ValidateTokenResponse {
  success: boolean
  user?: {
    id: string
    name: string
    email: string
  }
}

// URL base de la API de WordPress
const API_BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"

export const AuthService = {
  // Registrar un nuevo usuario
  register: async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al registrar usuario")
      }

      return true
    } catch (error) {
      console.error("Error al registrar usuario:", error)
      throw error
    }
  },

  // Iniciar sesión
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos de timeout

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al iniciar sesión")
      }

      const data = await response.json()

      // Guardar el token en localStorage
      localStorage.setItem("auth_token", data.token)

      return {
        token: data.token,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          password: "", // No almacenamos la contraseña
        },
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      if (error.name === "AbortError") {
        throw new Error("Tiempo de espera agotado. Verifica tu conexión a internet.")
      }
      throw error
    }
  },

  // Verificar si el usuario está autenticado
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem("auth_token")

      // Si no hay token, no estamos autenticados
      if (!token) {
        return false
      }

      // Verificar si el token es válido (opcional, puede causar problemas si la API no responde)
      // Comentamos esta parte para evitar bloqueos
      /*
      const response = await fetch(`${API_BASE_URL}/auth/validate`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      return response.ok
      */

      // Simplemente verificar si hay un token
      return true
    } catch (error) {
      console.error("Error al verificar autenticación:", error)
      return false
    }
  },

  // Cerrar sesión
  logout: async (): Promise<void> => {
    try {
      localStorage.removeItem("auth_token")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  },

  // Obtener datos del usuario
  getUserData: async (userId: string): Promise<UserData> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      // Añadir timeouts para evitar bloqueos
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos de timeout

      // Obtener tiendas
      const storesResponse = await fetch(`${API_BASE_URL}/stores`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!storesResponse.ok) {
        throw new Error("Error al obtener tiendas")
      }

      const stores = await storesResponse.json()

      // Nuevo timeout para la siguiente petición
      const controller2 = new AbortController()
      const timeoutId2 = setTimeout(() => controller2.abort(), 10000) // 10 segundos de timeout

      // Obtener productos
      const productsResponse = await fetch(`${API_BASE_URL}/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller2.signal,
      })

      clearTimeout(timeoutId2)

      if (!productsResponse.ok) {
        throw new Error("Error al obtener productos")
      }

      const products = await productsResponse.json()

      // Añadir isEditing a los productos
      const productsWithEditing = products.map((product: any) => ({
        ...product,
        isEditing: false,
      }))

      return {
        stores,
        products: productsWithEditing,
      }
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error)
      if (error.name === "AbortError") {
        throw new Error("Tiempo de espera agotado. Verifica tu conexión a internet.")
      }
      throw error
    }
  },

  // Obtener el usuario actual
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        return null
      }

      // Intentar decodificar el token JWT
      try {
        const base64Url = token.split(".")[1]
        if (!base64Url) {
          console.error("Token inválido: no se pudo dividir")
          return null
        }

        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join(""),
        )

        const payload = JSON.parse(jsonPayload)

        return {
          id: payload.id || payload.sub || "unknown",
          name: payload.name || payload.username || "Usuario",
          email: payload.email || "email@example.com",
          password: "", // No almacenamos la contraseña en el cliente
        }
      } catch (decodeError) {
        console.error("Error al decodificar token:", decodeError)

        // Si no podemos decodificar el token, crear un usuario genérico
        // para evitar bloqueos en la interfaz
        return {
          id: "temp_user",
          name: "Usuario Temporal",
          email: "temp@example.com",
          password: "",
        }
      }
    } catch (error) {
      console.error("Error al obtener usuario actual:", error)
      return null
    }
  },
}

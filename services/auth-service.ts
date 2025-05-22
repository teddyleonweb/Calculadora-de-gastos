import type { User, UserData } from "../types"
import { API_CONFIG } from "../config/api"

export const AuthService = {
  // Registrar un nuevo usuario
  register: async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      // Mostrar la URL completa para depuración
      const registerUrl = API_CONFIG.getEndpointUrl("/auth/register")
      console.log("URL de registro completa:", registerUrl)
      console.log("Datos de registro:", { name, email, password: "***" })

      const response = await fetch(registerUrl, {
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

      // Mostrar información sobre la respuesta para depuración
      console.log("Respuesta del servidor:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers.entries()]),
      })

      // Intentar obtener el cuerpo de la respuesta
      let responseData
      try {
        responseData = await response.json()
        console.log("Datos de respuesta:", responseData)
      } catch (jsonError) {
        console.error("Error al parsear la respuesta JSON:", jsonError)
        // Si no podemos parsear JSON, intentamos obtener el texto
        const textResponse = await response.text()
        console.log("Respuesta en texto plano:", textResponse)
        throw new Error("Error al procesar la respuesta del servidor")
      }

      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || "Error al registrar usuario")
      }

      return true
    } catch (error) {
      console.error("Error detallado al registrar usuario:", error)
      if (error instanceof Error) {
        throw new Error(`Error al registrar usuario: ${error.message}`)
      } else {
        throw new Error("Error desconocido al registrar usuario")
      }
    }
  },

  // Iniciar sesión
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    try {
      // Obtener y mostrar la URL completa para depuración
      const loginUrl = API_CONFIG.getEndpointUrl("/auth/login")
      console.log("URL de inicio de sesión completa:", loginUrl)
      console.log("Datos de inicio de sesión:", { email, password: "***" })

      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      // Mostrar información sobre la respuesta para depuración
      console.log("Respuesta del servidor (login):", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers.entries()]),
      })

      // Intentar obtener el cuerpo de la respuesta
      let data
      try {
        data = await response.json()
        console.log("Datos de respuesta (login):", data)
      } catch (jsonError) {
        console.error("Error al parsear la respuesta JSON (login):", jsonError)
        // Si no podemos parsear JSON, intentamos obtener el texto
        const textResponse = await response.text()
        console.log("Respuesta en texto plano (login):", textResponse)
        throw new Error("Error al procesar la respuesta del servidor")
      }

      if (!response.ok) {
        throw new Error(data.error || "Error al iniciar sesión")
      }

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
      throw error
    }
  },

  // Verificar si el usuario está autenticado
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem("auth_token")
      return !!token
    } catch (error) {
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

      // Obtener tiendas
      const storesUrl = API_CONFIG.getEndpointUrl("/stores")
      console.log("URL para obtener tiendas:", storesUrl)

      const storesResponse = await fetch(storesUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!storesResponse.ok) {
        throw new Error("Error al obtener tiendas")
      }

      const stores = await storesResponse.json()

      // Obtener productos
      const productsUrl = API_CONFIG.getEndpointUrl("/products")
      console.log("URL para obtener productos:", productsUrl)

      const productsResponse = await fetch(productsUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

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

      // Decodificar el token JWT (esto es una simplificación, en producción deberías verificar el token)
      const base64Url = token.split(".")[1]
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      )

      const payload = JSON.parse(jsonPayload)

      return {
        id: payload.id,
        name: payload.name,
        email: payload.email,
        password: "", // No almacenamos la contraseña en el cliente
      }
    } catch (error) {
      console.error("Error al obtener usuario actual:", error)
      return null
    }
  },
}

import type { User, UserData } from "../types"

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
        body: JSON.stringify({ name, email, password }),
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
  login: async (email: string, password: string): Promise<User> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error en respuesta de login:", errorText)
        throw new Error(`Error al iniciar sesión: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Guardar el token en localStorage con persistencia explícita
      localStorage.setItem("auth_token", data.token)
      console.log("Token guardado en localStorage:", data.token.substring(0, 10) + "...")

      // Verificar inmediatamente que el token se guardó correctamente
      const savedToken = localStorage.getItem("auth_token")
      if (!savedToken) {
        console.error("Error: El token no se guardó correctamente en localStorage")
      } else {
        console.log("Verificación: Token recuperado correctamente de localStorage")
      }

      // Guardar información del usuario
      const user: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
      }

      // También guardar los datos del usuario en localStorage para mayor persistencia
      localStorage.setItem("user_data", JSON.stringify(user))

      return user
    } catch (error) {
      console.error("Error en AuthService.login:", error)
      throw error
    }
  },

  isAuthenticated: async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem("auth_token")
      console.log("Verificando autenticación, token:", token ? "Presente" : "Ausente")

      if (!token) {
        console.log("No hay token en localStorage, usuario no autenticado")
        return false
      }

      // Intentar obtener datos del usuario para verificar que el token es válido
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        console.log("Token inválido o expirado, eliminando token del localStorage")
        localStorage.removeItem("auth_token")
        return false
      }

      // Si llegamos aquí, el token es válido
      console.log("Token válido, usuario autenticado")
      return true
    } catch (error) {
      console.error("Error al verificar autenticación:", error)
      return false
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        console.log("No hay token en localStorage, no se puede obtener usuario actual")
        return null
      }

      // Primero intentar recuperar del localStorage para respuesta inmediata
      const cachedUserData = localStorage.getItem("user_data")
      if (cachedUserData) {
        try {
          const userData = JSON.parse(cachedUserData)
          console.log("Usuario recuperado de localStorage:", userData)
          return userData
        } catch (e) {
          console.error("Error al parsear datos de usuario en localStorage:", e)
        }
      }

      // Si no hay datos en caché o son inválidos, obtener del servidor
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        console.error("Error al obtener usuario actual:", response.status, response.statusText)
        return null
      }

      const userData = await response.json()
      const user: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
      }

      // Actualizar la caché
      localStorage.setItem("user_data", JSON.stringify(user))

      return user
    } catch (error) {
      console.error("Error en AuthService.getCurrentUser:", error)
      return null
    }
  },

  // Cerrar sesión
  logout: async (): Promise<void> => {
    try {
      // Limpiar localStorage
      localStorage.removeItem("auth_token")
      localStorage.removeItem("user_data")

      // También limpiar sessionStorage por si acaso
      sessionStorage.removeItem("auth_token")
      sessionStorage.removeItem("user_data")

      console.log("Sesión cerrada, datos eliminados del almacenamiento local")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  },

  // Obtener datos del usuario (tiendas y productos)
  getUserData: async (userId: string): Promise<UserData> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      console.log("Obteniendo datos del usuario desde:", `${API_BASE_URL}/auth/user`)

      const response = await fetch(`${API_BASE_URL}/auth/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error en respuesta:", errorText)
        throw new Error(`Error al obtener datos del usuario: ${response.status} ${response.statusText}`)
      }

      const userData = await response.json()
      console.log("Datos del usuario obtenidos:", userData)

      // Asegurarse de que los productos tengan el campo isEditing
      const products = userData.products.map((product: any) => ({
        ...product,
        isEditing: false,
      }))

      // Asegurarse de que siempre exista la tienda "Total"
      let hasTotal = false
      const stores = userData.stores.map((store: any) => {
        if (store.name === "Total") {
          hasTotal = true
        }
        return store
      })

      if (!hasTotal && stores.length > 0) {
        stores.unshift({
          id: "total",
          name: "Total",
          isDefault: true,
        })
      }

      return {
        stores,
        products,
      }
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error)
      throw error
    }
  },
}

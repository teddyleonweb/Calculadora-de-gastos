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
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al iniciar sesión")
      }

      const data = await response.json()

      // Guardar el token en localStorage
      localStorage.setItem("auth_token", data.token)

      return data
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      throw error
    }
  },

  // Cerrar sesión
  logout: (): void => {
    localStorage.removeItem("auth_token")
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

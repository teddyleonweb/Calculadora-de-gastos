import type { User, Store, Product } from "../types"

// URL base de la API de WordPress
const API_BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"

export const AuthService = {
  // Registrar un nuevo usuario
  register: async (name: string, email: string, password: string): Promise<void> => {
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
    } catch (error) {
      console.error("Error en el registro:", error)
      throw error
    }
  },

  // Iniciar sesión
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al iniciar sesión")
      }

      const data = await response.json()

      // Guardar el token en localStorage
      localStorage.setItem("auth_token", data.token)

      return {
        user: data.user,
        token: data.token,
      }
    } catch (error) {
      console.error("Error en el inicio de sesión:", error)
      throw error
    }
  },

  // Cerrar sesión
  logout: (): void => {
    localStorage.removeItem("auth_token")
  },

  // Verificar si el usuario está autenticado
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem("auth_token")
  },

  // Obtener datos del usuario
  getUserData: async (userId: string): Promise<{ stores: Store[]; products: Product[] }> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      console.log("Obteniendo datos del usuario desde:", `${API_BASE_URL}/auth/user`)

      // Intentar obtener datos del usuario desde la API
      const response = await fetch(`${API_BASE_URL}/auth/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al obtener datos del usuario")
      }

      const userData = await response.json()
      console.log("Datos del usuario obtenidos:", userData)

      // Asegurarse de que las tiendas incluyan la tienda "Total"
      let userStores = userData.stores || []
      const totalStore = userStores.find((store: Store) => store.name === "Total")

      if (!totalStore && userStores.length > 0) {
        // Si no existe la tienda Total pero hay otras tiendas, añadirla
        userStores = [
          {
            id: "total",
            name: "Total",
            isDefault: true,
          },
          ...userStores,
        ]
      } else if (userStores.length === 0) {
        // Si no hay tiendas, crear al menos la tienda Total
        userStores = [
          {
            id: "total",
            name: "Total",
            isDefault: true,
          },
        ]
      }

      return {
        stores: userStores,
        products: userData.products || [],
      }
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error)

      // Intentar cargar tiendas y productos por separado como fallback
      try {
        console.log("Intentando cargar tiendas y productos por separado...")

        const token = localStorage.getItem("auth_token")
        if (!token) {
          throw new Error("No autorizado")
        }

        // Cargar tiendas
        const storesResponse = await fetch(`${API_BASE_URL}/stores`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        // Cargar productos
        const productsResponse = await fetch(`${API_BASE_URL}/products`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!storesResponse.ok || !productsResponse.ok) {
          throw new Error("Error al cargar datos")
        }

        const stores = await storesResponse.json()
        const products = await productsResponse.json()

        console.log("Tiendas cargadas por separado:", stores)
        console.log("Productos cargados por separado:", products)

        // Asegurarse de que las tiendas incluyan la tienda "Total"
        let userStores = stores || []
        const totalStore = userStores.find((store: Store) => store.name === "Total")

        if (!totalStore && userStores.length > 0) {
          // Si no existe la tienda Total pero hay otras tiendas, añadirla
          userStores = [
            {
              id: "total",
              name: "Total",
              isDefault: true,
            },
            ...userStores,
          ]
        } else if (userStores.length === 0) {
          // Si no hay tiendas, crear al menos la tienda Total
          userStores = [
            {
              id: "total",
              name: "Total",
              isDefault: true,
            },
          ]
        }

        return {
          stores: userStores,
          products: products || [],
        }
      } catch (fallbackError) {
        console.error("Error en el fallback:", fallbackError)
        // Si todo falla, devolver datos vacíos
        return {
          stores: [
            {
              id: "total",
              name: "Total",
              isDefault: true,
            },
          ],
          products: [],
        }
      }
    }
  },
}

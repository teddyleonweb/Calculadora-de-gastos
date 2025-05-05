import type { User, UserData } from "../types"

// URL base de la API de WordPress
const API_BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"

// Función para guardar el token de forma segura
const saveAuthToken = (token: string) => {
  try {
    // Guardar en localStorage
    window.localStorage.setItem("auth_token", token)
    console.log("Token guardado en localStorage:", token.substring(0, 10) + "...")

    // Verificar inmediatamente que se guardó correctamente
    const savedToken = window.localStorage.getItem("auth_token")
    if (!savedToken) {
      console.error("ERROR CRÍTICO: El token no se guardó correctamente en localStorage")
    } else {
      console.log("Verificación: Token recuperado correctamente de localStorage")
    }
  } catch (error) {
    console.error("Error al guardar token:", error)
  }
}

// Función para obtener el token
const getAuthToken = (): string | null => {
  try {
    const token = window.localStorage.getItem("auth_token")
    return token
  } catch (error) {
    console.error("Error al obtener token:", error)
    return null
  }
}

// Función para realizar solicitudes con reintentos
const fetchWithRetry = async (url: string, options: RequestInit, retries = 3, delay = 1000): Promise<Response> => {
  try {
    console.log(`Intentando solicitud a ${url}...`)
    const response = await fetch(url, options)
    return response
  } catch (error) {
    if (retries <= 1) {
      console.error(`Error en solicitud a ${url} después de múltiples intentos:`, error)
      throw error
    }

    console.warn(`Error en solicitud a ${url}, reintentando en ${delay}ms...`, error)
    await new Promise((resolve) => setTimeout(resolve, delay))
    return fetchWithRetry(url, options, retries - 1, delay * 1.5)
  }
}

export const AuthService = {
  // Registrar un nuevo usuario
  register: async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      console.log("Intentando registrar usuario...")
      const response = await fetchWithRetry(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
        mode: "cors",
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
      console.log("Intentando iniciar sesión con:", email)
      console.log("URL de la API:", API_BASE_URL)

      // Verificar si la URL es accesible
      try {
        const pingResponse = await fetch(`${API_BASE_URL}/ping`, {
          method: "GET",
          mode: "no-cors",
        })
        console.log("Ping a la API:", pingResponse.status)
      } catch (pingError) {
        console.warn("No se pudo hacer ping a la API:", pingError)
      }

      // Intentar login con reintentos
      const response = await fetchWithRetry(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        mode: "cors",
        credentials: "include", // Incluir cookies en la solicitud
      })

      if (!response.ok) {
        let errorMessage = `Error al iniciar sesión: ${response.status} ${response.statusText}`
        try {
          const errorText = await response.text()
          console.error("Error en respuesta de login:", errorText)
          errorMessage += ` - ${errorText}`
        } catch (e) {
          console.error("No se pudo leer el cuerpo de la respuesta de error")
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()

      // Guardar el token en localStorage con persistencia explícita
      saveAuthToken(data.token)

      // Guardar información del usuario
      const user: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
      }

      // También guardar los datos del usuario en localStorage para mayor persistencia
      window.localStorage.setItem("user_data", JSON.stringify(user))

      return user
    } catch (error) {
      console.error("Error en AuthService.login:", error)

      // Intentar recuperar usuario de localStorage para modo offline
      try {
        const cachedUserData = window.localStorage.getItem("user_data")
        const cachedToken = window.localStorage.getItem("auth_token")

        if (cachedUserData && cachedToken) {
          console.log("Usando datos en caché para modo offline")
          const userData = JSON.parse(cachedUserData)
          return userData
        }
      } catch (e) {
        console.error("No se pudieron recuperar datos en caché:", e)
      }

      throw error
    }
  },

  isAuthenticated: async (): Promise<boolean> => {
    try {
      const token = getAuthToken()
      console.log("Verificando autenticación, token:", token ? "Presente" : "Ausente")

      if (!token) {
        console.log("No hay token en localStorage, usuario no autenticado")
        return false
      }

      // Intentar verificar localmente primero
      const cachedUserData = window.localStorage.getItem("user_data")
      if (cachedUserData) {
        console.log("Datos de usuario en caché encontrados, considerando autenticado")
        return true
      }

      // Intentar obtener datos del usuario para verificar que el token es válido
      try {
        const response = await fetchWithRetry(
          `${API_BASE_URL}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            mode: "cors",
            credentials: "include",
          },
          2, // Menos reintentos para no bloquear la UI
        )

        if (!response.ok) {
          console.log("Token inválido o expirado, eliminando token del localStorage")
          window.localStorage.removeItem("auth_token")
          return false
        }

        // Si llegamos aquí, el token es válido
        console.log("Token válido, usuario autenticado")
        return true
      } catch (error) {
        console.warn("Error al verificar token con el servidor, usando verificación local:", error)
        // Si hay un error de red pero tenemos token, consideramos autenticado
        return true
      }
    } catch (error) {
      console.error("Error al verificar autenticación:", error)
      return false
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
      const token = getAuthToken()

      if (!token) {
        console.log("No hay token en localStorage, no se puede obtener usuario actual")
        return null
      }

      // Primero intentar recuperar del localStorage para respuesta inmediata
      const cachedUserData = window.localStorage.getItem("user_data")
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
      try {
        const response = await fetchWithRetry(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          mode: "cors",
          credentials: "include",
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
        window.localStorage.setItem("user_data", JSON.stringify(user))

        return user
      } catch (error) {
        console.warn("Error al obtener usuario del servidor, usando datos en caché si están disponibles:", error)
        // Si hay datos en caché, los usamos aunque haya error de red
        if (cachedUserData) {
          try {
            return JSON.parse(cachedUserData)
          } catch (e) {
            console.error("Error al parsear datos en caché:", e)
          }
        }
        return null
      }
    } catch (error) {
      console.error("Error en AuthService.getCurrentUser:", error)
      return null
    }
  },

  // Cerrar sesión
  logout: async (): Promise<void> => {
    try {
      // Limpiar localStorage
      window.localStorage.removeItem("auth_token")
      window.localStorage.removeItem("user_data")

      // También limpiar sessionStorage por si acaso
      window.sessionStorage.removeItem("auth_token")
      window.sessionStorage.removeItem("user_data")

      console.log("Sesión cerrada, datos eliminados del almacenamiento local")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  },

  // Obtener datos del usuario (tiendas y productos)
  getUserData: async (userId: string): Promise<UserData> => {
    try {
      const token = getAuthToken()

      if (!token) {
        throw new Error("No autorizado")
      }

      console.log("Obteniendo datos del usuario desde:", `${API_BASE_URL}/auth/user`)

      // Intentar obtener datos del servidor
      try {
        const response = await fetchWithRetry(`${API_BASE_URL}/auth/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          mode: "cors",
          credentials: "include",
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

        // Guardar en caché
        const cacheData = { stores, products }
        window.localStorage.setItem("user_data_cache", JSON.stringify(cacheData))

        return {
          stores,
          products,
        }
      } catch (error) {
        console.warn("Error al obtener datos del servidor, intentando usar caché:", error)

        // Intentar usar datos en caché
        const cachedData = window.localStorage.getItem("user_data_cache")
        if (cachedData) {
          try {
            console.log("Usando datos en caché")
            return JSON.parse(cachedData)
          } catch (e) {
            console.error("Error al parsear datos en caché:", e)
          }
        }

        // Si no hay caché, devolver datos vacíos
        return {
          stores: [],
          products: [],
        }
      }
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error)
      throw error
    }
  },
}

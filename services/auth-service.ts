// Modificar el servicio de autenticación para soportar modo híbrido
import type { User } from "../types"
import { createClientSupabaseClient } from "../lib/supabase/client"
import type { Store, Product } from "../types"
import { StoreService } from "./store-service"
import { ProductService } from "./product-service"

// Detectar si estamos en modo local (sin Supabase)
const isLocalMode = () => {
  return (
    typeof window !== "undefined" &&
    (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  )
}

// Servicio de autenticación con modo híbrido
export const AuthService = {
  // Registrar un nuevo usuario
  register: async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      // Modo local (sin Supabase)
      if (isLocalMode()) {
        console.log("Usando modo local para registro")
        // Verificar si el usuario ya existe en localStorage
        const users = JSON.parse(localStorage.getItem("users") || "[]")
        const existingUser = users.find((u: User) => u.email === email)

        if (existingUser) {
          throw new Error("El correo electrónico ya está registrado")
        }

        // Crear nuevo usuario
        const newUser = {
          id: Date.now().toString(),
          name,
          email,
          password, // En un entorno real, esto debería estar hasheado
        }

        // Guardar usuario
        users.push(newUser)
        localStorage.setItem("users", JSON.stringify(users))

        // Crear tienda por defecto
        const stores = JSON.parse(localStorage.getItem("stores") || "[]")
        stores.push({
          id: "default",
          name: "Total",
          userId: newUser.id,
          isDefault: true,
        })
        localStorage.setItem("stores", JSON.stringify(stores))

        return true
      }

      // Modo Supabase
      const supabase = createClientSupabaseClient()

      // Registrar el usuario con Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      // Si el registro fue exitoso pero necesita confirmación de email
      if (data?.user && !data?.session) {
        return true
      }

      // Si el registro fue exitoso y se creó una sesión
      if (data?.user && data?.session) {
        // Crear el registro en la tabla users
        const { error: insertError } = await supabase.from("users").insert({
          id: data.user.id,
          email: data.user.email,
          name: name,
        })

        if (insertError) {
          console.error("Error al crear usuario en la base de datos:", insertError)
          // No lanzamos error aquí para no interrumpir el flujo
        }

        // Crear una tienda por defecto para el usuario
        const { error: storeError } = await supabase.from("stores").insert({
          name: "Total",
          user_id: data.user.id,
          is_default: true,
        })

        if (storeError) {
          console.error("Error al crear tienda por defecto:", storeError)
          // No lanzamos error aquí para no interrumpir el flujo
        }

        return true
      }

      return false
    } catch (error) {
      console.error("Error al registrar:", error)
      throw error
    }
  },

  // Iniciar sesión
  login: async (email: string, password: string): Promise<User> => {
    try {
      // Modo local (sin Supabase)
      if (isLocalMode()) {
        console.log("Usando modo local para login")
        const users = JSON.parse(localStorage.getItem("users") || "[]")
        const user = users.find((u: User) => u.email === email && u.password === password)

        if (!user) {
          throw new Error("Credenciales incorrectas")
        }

        // Guardar sesión
        localStorage.setItem("currentUser", JSON.stringify(user))

        return user
      }

      // Modo Supabase
      const supabase = createClientSupabaseClient()

      // Iniciar sesión con Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw new Error(error.message)
      }

      if (!data.user) {
        throw new Error("No se pudo obtener la información del usuario")
      }

      // Verificar si el usuario existe en nuestra tabla users
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", data.user.id)
        .single()

      // Si el usuario no existe en nuestra tabla, lo creamos
      if (userError || !userData) {
        const name = data.user.user_metadata.name || email.split("@")[0]

        // Crear el usuario en nuestra tabla
        const { error: insertError } = await supabase.from("users").insert({
          id: data.user.id,
          email: data.user.email,
          name: name,
        })

        if (insertError) {
          console.error("Error al crear usuario en la base de datos:", insertError)
        }

        // Crear una tienda por defecto
        const { error: storeError } = await supabase.from("stores").insert({
          name: "Total",
          user_id: data.user.id,
          is_default: true,
        })

        if (storeError) {
          console.error("Error al crear tienda por defecto:", storeError)
        }

        return {
          id: data.user.id,
          name: name,
          email: data.user.email || "",
          password: "", // No almacenamos la contraseña en el cliente
        }
      }

      return {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        password: "", // No almacenamos la contraseña en el cliente
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      throw error
    }
  },

  // Verificar si el usuario está autenticado
  isAuthenticated: async (): Promise<boolean> => {
    try {
      // Modo local (sin Supabase)
      if (isLocalMode()) {
        const currentUser = localStorage.getItem("currentUser")
        return !!currentUser
      }

      // Modo Supabase
      const supabase = createClientSupabaseClient()
      const { data } = await supabase.auth.getSession()
      return !!data.session
    } catch (error) {
      return false
    }
  },

  // Cerrar sesión
  logout: async (): Promise<void> => {
    try {
      // Modo local (sin Supabase)
      if (isLocalMode()) {
        localStorage.removeItem("currentUser")
        return
      }

      // Modo Supabase
      const supabase = createClientSupabaseClient()
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  },

  // Obtener datos del usuario actual
  getUserData: async (userId: string): Promise<{ stores: Store[]; products: Product[] }> => {
    try {
      console.log("Obteniendo datos del usuario:", userId)

      // Implementar carga en paralelo con manejo de errores independiente
      const [storesResult, productsResult] = await Promise.allSettled([
        StoreService.getStores(userId),
        ProductService.getProducts(userId),
      ])

      // Manejar el resultado de las tiendas
      let stores: Store[] = []
      if (storesResult.status === "fulfilled") {
        stores = storesResult.value
        console.log(`Se cargaron ${stores.length} tiendas correctamente`)
      } else {
        console.error("Error al cargar tiendas:", storesResult.reason)
        // Usar tiendas por defecto si hay error
        stores = [{ id: "total", name: "Total" }]
      }

      // Manejar el resultado de los productos
      let products: Product[] = []
      if (productsResult.status === "fulfilled") {
        products = productsResult.value
        console.log(`Se cargaron ${products.length} productos correctamente`)
      } else {
        console.error("Error al cargar productos:", productsResult.reason)
        // Intentar cargar productos desde localStorage como respaldo
        try {
          const localProducts = localStorage.getItem(`products_${userId}`)
          if (localProducts) {
            products = JSON.parse(localProducts)
            console.log(`Se cargaron ${products.length} productos desde caché local`)
          }
        } catch (cacheError) {
          console.error("Error al cargar productos desde caché:", cacheError)
        }
      }

      // Guardar productos en localStorage para caché
      if (products.length > 0) {
        try {
          localStorage.setItem(`products_${userId}`, JSON.stringify(products))
        } catch (cacheError) {
          console.error("Error al guardar productos en caché:", cacheError)
        }
      }

      return { stores, products }
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error)
      throw error
    }
  },

  // Obtener el usuario actual
  getCurrentUser: async (): Promise<User | null> => {
    try {
      // Modo local (sin Supabase)
      if (isLocalMode()) {
        const currentUser = localStorage.getItem("currentUser")
        return currentUser ? JSON.parse(currentUser) : null
      }

      // Modo Supabase
      const supabase = createClientSupabaseClient()
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        return null
      }

      // Obtener datos adicionales del usuario de nuestra tabla
      const { data: userData, error } = await supabase.from("users").select("*").eq("id", data.user.id).single()

      if (error || !userData) {
        // Si no existe en nuestra tabla, devolver datos básicos
        return {
          id: data.user.id,
          name: data.user.user_metadata.name || data.user.email?.split("@")[0] || "",
          email: data.user.email || "",
          password: "",
        }
      }

      return {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        password: "", // No almacenamos la contraseña en el cliente
      }
    } catch (error) {
      console.error("Error al obtener usuario actual:", error)
      return null
    }
  },
}

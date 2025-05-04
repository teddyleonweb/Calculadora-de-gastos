// Modificar el servicio de autenticación para soportar modo híbrido
import type { User } from "../types"
import { createClientSupabaseClient } from "../lib/supabase/client"

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
  getUserData: async (userId: string) => {
    try {
      // Modo local (sin Supabase)
      if (isLocalMode()) {
        console.log("Usando modo local para getUserData")
        // Obtener tiendas
        const stores = JSON.parse(localStorage.getItem("stores") || "[]")
        const userStores = stores.filter((store: any) => store.userId === userId)

        // Si no hay tiendas, crear la tienda por defecto
        if (userStores.length === 0) {
          const defaultStore = {
            id: "default",
            name: "Total",
            userId: userId,
            isDefault: true,
          }
          stores.push(defaultStore)
          localStorage.setItem("stores", JSON.stringify(stores))
          userStores.push(defaultStore)
        }

        // Obtener productos
        const products = JSON.parse(localStorage.getItem("products") || "[]")
        const userProducts = products.filter((product: any) => product.userId === userId)

        // Formatear datos
        const formattedStores = userStores.map((store: any) => ({
          id: store.id,
          name: store.name,
          isDefault: store.isDefault,
        }))

        const formattedProducts = userProducts.map((product: any) => ({
          id: product.id,
          title: product.title,
          price: Number.parseFloat(product.price),
          quantity: product.quantity,
          image: product.image,
          storeId: product.storeId,
          isEditing: false,
        }))

        return {
          stores: formattedStores,
          products: formattedProducts,
        }
      }

      // Modo Supabase
      const supabase = createClientSupabaseClient()

      // Configurar un timeout más largo para las consultas
      const abortController = new AbortController()
      const timeoutId = setTimeout(() => abortController.abort(), 15000) // 15 segundos de timeout

      try {
        // Obtener tiendas con un límite de registros para evitar timeouts
        console.log("Obteniendo tiendas para el usuario:", userId)
        const { data: stores, error: storesError } = await supabase
          .from("stores")
          .select("*")
          .eq("user_id", userId)
          .order("is_default", { ascending: false })
          .order("name", { ascending: true })
          .abortSignal(abortController.signal)

        if (storesError) {
          console.error("Error al obtener tiendas:", storesError)
          throw new Error("Error al obtener tiendas: " + storesError.message)
        }

        console.log("Tiendas obtenidas correctamente:", stores.length)

        // Obtener productos con paginación para evitar timeouts
        console.log("Obteniendo productos para el usuario:", userId)

        // Primero obtener solo los IDs para saber cuántos productos hay
        const { count: productCount, error: countError } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .abortSignal(abortController.signal)

        if (countError) {
          console.error("Error al contar productos:", countError)
          throw new Error("Error al contar productos: " + countError.message)
        }

        console.log(`Total de productos a cargar: ${productCount}`)

        // Si hay muchos productos, usar paginación
        const pageSize = 50
        const allProducts = []

        if (productCount && productCount > 0) {
          const pages = Math.ceil(productCount / pageSize)

          for (let page = 0; page < pages; page++) {
            console.log(`Cargando página ${page + 1} de ${pages}...`)

            const { data: pageProducts, error: pageError } = await supabase
              .from("products")
              .select("*")
              .eq("user_id", userId)
              .range(page * pageSize, (page + 1) * pageSize - 1)
              .abortSignal(abortController.signal)

            if (pageError) {
              console.error(`Error al cargar página ${page + 1}:`, pageError)
              throw new Error(`Error al cargar productos (página ${page + 1}): ${pageError.message}`)
            }

            if (pageProducts) {
              allProducts.push(...pageProducts)
              console.log(`Cargados ${allProducts.length} de ${productCount} productos`)
            }
          }
        }

        // Transformar los datos para que coincidan con la estructura esperada
        const formattedStores = stores.map((store) => ({
          id: store.id,
          name: store.name,
          isDefault: store.is_default,
          image: store.image || undefined,
        }))

        const formattedProducts = allProducts.map((product) => ({
          id: product.id,
          title: product.title,
          price: Number.parseFloat(product.price),
          quantity: product.quantity,
          image: product.image,
          storeId: product.store_id,
          isEditing: false,
          createdAt: product.created_at || null,
        }))

        console.log(
          `Datos formateados correctamente: ${formattedStores.length} tiendas y ${formattedProducts.length} productos`,
        )

        return {
          stores: formattedStores,
          products: formattedProducts,
        }
      } finally {
        clearTimeout(timeoutId)
      }
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error)
      // Propagar el error para que pueda ser manejado por el llamador
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

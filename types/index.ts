// Tipos compartidos para toda la aplicación

export interface Product {
  id: string
  title: string
  price: number
  quantity: number
  isEditing: boolean
  image?: string
  storeId: string // ID del supermercado al que pertenece el producto
}

export interface Store {
  id: string
  name: string
}

export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

export interface Position {
  x: number
  y: number
}

export interface ImageSize {
  width: number
  height: number
}

// Nuevos tipos para autenticación
export interface User {
  id: string
  email: string
  password: string // En una aplicación real, nunca almacenaríamos contraseñas en texto plano
  name: string
}

export interface UserData {
  stores: Store[]
  products: Product[]
}

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isInitialized: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  error: string | null
}

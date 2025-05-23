// Actualizar el tipo AuthContextType para incluir isAuthenticating
export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isInitialized: boolean
  isAuthenticating: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  error: string | null
}

export interface User {
  id: string
  name: string
  email: string
  password: string
}

export interface UserData {
  stores: Store[]
  products: Product[]
}

export interface Store {
  id: string
  name: string
  image?: string
  isDefault?: boolean
}

export interface Product {
  id: string
  title: string
  price: number
  quantity: number
  image?: string
  storeId: string
  isEditing?: boolean
  createdAt?: string
}

export interface ShoppingList {
  id: string
  name: string
  total: number
  createdAt: string
}

export interface ShoppingListStore {
  id: string
  shoppingListId: string
  storeId: string
  name: string
}

export interface ShoppingListProduct {
  id: string
  shoppingListId: string
  storeId: string | null
  title: string
  price: number
  quantity: number
  image?: string
}

export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

export interface ExchangeRate {
  bcv: string
  parallel: string
}

export interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: string
  createdAt: string
}

export interface Income {
  id: string
  description: string
  amount: number
  category: string
  date: string
  isFixed: boolean
  frequency?: string
  notes?: string
  createdAt: string
}

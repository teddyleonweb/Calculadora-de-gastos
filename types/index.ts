// Definición de tipos para la aplicación

export interface User {
  id: string
  email: string
  name?: string
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
  storeId: string
  image?: string
  isEditing?: boolean
  createdAt?: string
}

export interface ShoppingList {
  id: string
  name: string
  items: ShoppingListItem[]
  createdAt: string
  userId: string
}

export interface ShoppingListItem {
  id: string
  productId: string
  quantity: number
  checked: boolean
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

export interface Product {
  id: string
  title?: string
  price: number
  quantity: number
  storeId: string
  storeName?: string
  image?: string
  createdAt?: string
  isEditing?: boolean
}

export interface Store {
  id: string
  name: string
  image?: string
  isDefault?: boolean
}

export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

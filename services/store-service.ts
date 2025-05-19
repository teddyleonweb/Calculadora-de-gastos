// services/store-service.ts

// This file provides services related to data storage and retrieval.
// It should not have any direct dependencies on Supabase or any other specific database.
// Instead, it should rely on abstract interfaces or repositories for data access.

// Example:

interface StoreRepository {
  getItem(key: string): Promise<any | null>
  setItem(key: string, value: any): Promise<void>
  removeItem(key: string): Promise<void>
}

class StoreService {
  private repository: StoreRepository

  constructor(repository: StoreRepository) {
    this.repository = repository
  }

  async getItem(key: string): Promise<any | null> {
    return this.repository.getItem(key)
  }

  async setItem(key: string, value: any): Promise<void> {
    return this.repository.setItem(key, value)
  }

  async removeItem(key: string): Promise<void> {
    return this.repository.removeItem(key)
  }
}

export { StoreService, type StoreRepository }

// Verificar que no haya dependencias de Supabase

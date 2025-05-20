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

export type FinanceTab = "expenses" | "incomes"

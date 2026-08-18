// Re-exports y tipos derivados de la app
export * from './database'

// Tipo para formularios (sin campos generados por DB)
export type CreateAccountInput = {
  name: string
  type: import('./database').AccountType
  currency: string
  initial_balance: number
  color?: string
  icon?: string
}

export type UpdateAccountInput = Partial<CreateAccountInput> & { id: string }

export type CreateCategoryInput = {
  name: string
  kind: import('./database').CategoryKind
  icon?: string
  color?: string
  parent_id?: string
}

export type UpdateCategoryInput = Partial<CreateCategoryInput> & { id: string }

export type CreateTransactionInput = {
  account_id: string
  category_id?: string
  type: import('./database').TransactionType
  amount: number
  currency: string
  description?: string
  occurred_at: string
  transfer_account_id?: string
  payment_method?: string
}

export type UpdateTransactionInput = Partial<CreateTransactionInput> & { id: string }

// Tipo de respuesta unificado para Server Actions
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// Resumen mensual del dashboard
export interface MonthSummary {
  totalIncome: number
  totalExpense: number
  balance: number
  currency: string
}

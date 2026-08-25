// =========================================================
// TIPOS DE BASE DE DATOS
// Reflect del schema SQL — actualizar si el schema cambia.
// =========================================================

export type AccountType = 'bank' | 'mercado_pago' | 'cash' | 'credit_card' | 'investment' | 'other'
export type CategoryKind = 'income' | 'expense'
export type TransactionType = 'income' | 'expense' | 'transfer'
export type TransactionSource = 'manual' | 'chat' | 'import' | 'recurring'
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'
export type BudgetPeriod = 'weekly' | 'monthly'
export type InsightType = 'alert' | 'tip' | 'summary' | 'anomaly'

export interface Profile {
  id: string
  display_name: string | null
  default_currency: string
  timezone: string | null
  created_at: string
}

export interface Account {
  id: string
  user_id: string
  name: string
  type: AccountType
  currency: string
  initial_balance: number
  current_balance: number
  color: string | null
  icon: string | null
  archived: boolean
  created_at: string
}

export interface Category {
  id: string
  user_id: string | null
  parent_id: string | null
  name: string
  kind: CategoryKind
  icon: string | null
  color: string | null
  is_system: boolean
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  account_id: string
  category_id: string | null
  type: TransactionType
  amount: number
  currency: string
  description: string | null
  occurred_at: string
  transfer_account_id: string | null
  payment_method: string | null
  source: TransactionSource
  recurring_transaction_id: string | null
  created_at: string
  // Joined fields (cuando se hace select con relaciones)
  account?: Pick<Account, 'id' | 'name' | 'color' | 'icon'>
  category?: Pick<Category, 'id' | 'name' | 'color' | 'icon'>
  transfer_account?: Pick<Account, 'id' | 'name'> | null
}

export interface RecurringTransaction {
  id: string
  user_id: string
  account_id: string
  category_id: string | null
  type: TransactionType
  amount: number
  currency: string
  description: string
  frequency: RecurrenceFrequency
  day_of_month: number | null
  next_run_date: string
  active: boolean
  is_subscription: boolean
  created_at: string
  // joined
  account?: Pick<Account, 'id' | 'name' | 'color' | 'icon'>
  category?: Pick<Category, 'id' | 'name' | 'color' | 'icon'>
}

export interface RecurringTransactionPayment {
  id: string
  recurring_transaction_id: string
  period: string          // 'YYYY-MM'
  paid: boolean
  paid_at: string | null
  transaction_id: string | null
  created_at: string
}

export interface Budget {
  id: string
  user_id: string
  category_id: string
  amount: number
  currency: string
  period: BudgetPeriod
  alert_threshold_pct: number
  active: boolean
  created_at: string
}

export interface Insight {
  id: string
  user_id: string
  type: InsightType
  title: string
  message: string
  related_category_id: string | null
  dismissed: boolean
  created_at: string
}

export interface ExchangeRate {
  id: string
  date: string
  from_currency: string
  to_currency: string
  rate: number
  source: string | null
}

export type LoanType = 'lent' | 'borrowed' // 'lent': Yo presté (por cobrar) | 'borrowed': Me prestaron (por pagar)
export type LoanStatus = 'pending' | 'partial' | 'paid'

export interface Loan {
  id: string
  user_id: string
  person_name: string
  type: LoanType
  amount: number
  paid_amount: number
  currency: string
  description: string | null
  due_date: string | null
  account_id: string | null
  status: LoanStatus
  created_at: string
  settled_at: string | null
  // Joined
  account?: Pick<Account, 'id' | 'name' | 'color' | 'icon'>
  payments?: LoanPayment[]
}

export interface LoanPayment {
  id: string
  loan_id: string
  user_id: string
  amount: number
  paid_at: string
  notes: string | null
  account_id: string | null
  created_at: string
  // Joined
  account?: Pick<Account, 'id' | 'name' | 'color' | 'icon'>
}

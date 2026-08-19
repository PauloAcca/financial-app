import type { AccountType, CategoryKind, TransactionType } from '@/types'

// =========================================================
// ACCOUNT TYPES — labels y metadatos de cada tipo de cuenta
// =========================================================
export const ACCOUNT_TYPE_CONFIG: Record<
  AccountType,
  { label: string; icon: string; defaultColor: string }
> = {
  bank:         { label: 'Banco',          icon: 'building-2',   defaultColor: '#3B82F6' },
  mercado_pago: { label: 'Mercado Pago',   icon: 'wallet',       defaultColor: '#00B1EA' },
  cash:         { label: 'Efectivo',       icon: 'banknote',     defaultColor: '#10B981' },
  credit_card:  { label: 'Tarjeta',        icon: 'credit-card',  defaultColor: '#8B5CF6' },
  investment:   { label: 'Inversión',      icon: 'trending-up',  defaultColor: '#F59E0B' },
  other:        { label: 'Otro',           icon: 'circle',       defaultColor: '#6B7280' },
}

export const ACCOUNT_TYPES = Object.entries(ACCOUNT_TYPE_CONFIG).map(([value, config]) => ({
  value: value as AccountType,
  ...config,
}))

// =========================================================
// CURRENCIES — monedas soportadas
// =========================================================
export const CURRENCIES = [
  { code: 'ARS', label: 'Peso argentino', symbol: '$' },
  { code: 'USD', label: 'Dólar estadounidense', symbol: 'US$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
]

export const DEFAULT_CURRENCY = 'ARS'

// =========================================================
// TRANSACTION TYPES — labels y colores
// =========================================================
export const TRANSACTION_TYPE_CONFIG: Record<
  TransactionType,
  { label: string; color: string; sign: '+' | '-' | '→' }
> = {
  income:   { label: 'Ingreso',       color: '#10B981', sign: '+' },
  expense:  { label: 'Gasto',         color: '#EF4444', sign: '-' },
  transfer: { label: 'Transferencia', color: '#6366F1', sign: '→' },
}

// =========================================================
// CATEGORY KINDS — labels
// =========================================================
export const CATEGORY_KIND_CONFIG: Record<CategoryKind, { label: string }> = {
  income:  { label: 'Ingresos' },
  expense: { label: 'Gastos' },
}

// =========================================================
// ACCOUNT COLORS — paleta para elegir en el formulario
// =========================================================
export const ACCOUNT_COLORS = [
  '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#00B1EA',
  '#6B7280', '#A855F7',
]

// =========================================================
// PAYMENT METHODS — opciones predefinidas (campo libre también)
// =========================================================
export const PAYMENT_METHODS = ['Débito', 'Crédito', 'Transferencia', 'QR', 'Efectivo', 'Débito automático']

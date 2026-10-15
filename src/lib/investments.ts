import type { Account, InvestmentValuation, Transaction } from '@/types/database'

// =========================================================
// Detección de inversiones por TIPO DE CUENTA (no por texto)
// =========================================================

/** IDs de todas las cuentas marcadas como plataforma de inversión. */
export function buildInvestmentAccountIds(
  accounts: Pick<Account, 'id' | 'type'>[]
): Set<string> {
  return new Set(accounts.filter((a) => a.type === 'investment').map((a) => a.id))
}

/**
 * Una transacción es "de inversión" si toca una cuenta de tipo inversión,
 * ya sea como origen o como destino.
 */
export function isInvestmentTransaction(
  tx: Pick<Transaction, 'account_id' | 'transfer_account_id'>,
  investmentAccountIds: Set<string>
): boolean {
  if (investmentAccountIds.has(tx.account_id)) return true
  return tx.transfer_account_id != null && investmentAccountIds.has(tx.transfer_account_id)
}

// =========================================================
// Tipos derivados para la vista de inversiones
// =========================================================
export interface InvestmentMovement {
  id: string
  date: string
  description: string | null
  direction: 'in' | 'out'
  amount: number
}

export interface InvestmentPlatform {
  account: Account
  /** Capital neto aportado = saldo inicial + aportes − retiros/valuaciones previas */
  capital: number
  /** Última valuación cargada (o el saldo de la cuenta como fallback) */
  currentValue: number
  hasValuation: boolean
  /** Ganancia/pérdida absoluta */
  gain: number
  /** Ganancia/pérdida en % sobre el capital (null si no hay capital) */
  gainPct: number | null
  /** Fecha del primer aporte conocido */
  since: string
  lastValuedAt: string | null
  latestValuation: InvestmentValuation | null
  movements: InvestmentMovement[]
  valuations: InvestmentValuation[]
}

/**
 * Arma el resumen de una "plataforma" de inversión (una cuenta type='investment').
 * El capital se deduce del saldo inicial + movimientos; el valor actual, de la
 * última valuación cargada manualmente.
 */
export function buildPlatform(
  account: Account,
  transactions: Transaction[],
  valuations: InvestmentValuation[]
): InvestmentPlatform {
  const related = transactions.filter(
    (tx) => tx.account_id === account.id || tx.transfer_account_id === account.id
  )

  const movements: InvestmentMovement[] = []

  for (const tx of related) {
    const amount = Number(tx.amount) || 0
    const isIncomingTransfer = tx.transfer_account_id === account.id && tx.type === 'transfer'

    if (tx.account_id === account.id) {
      if (tx.type === 'income') {
        movements.push({ id: tx.id, date: tx.occurred_at, description: tx.description, direction: 'in', amount })
      } else {
        // expense o transfer saliente: sale dinero de la inversión
        movements.push({ id: tx.id, date: tx.occurred_at, description: tx.description, direction: 'out', amount })
      }
    } else if (isIncomingTransfer) {
      movements.push({ id: tx.id, date: tx.occurred_at, description: tx.description, direction: 'in', amount })
    }
  }

  movements.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

  const inflow = movements.filter((m) => m.direction === 'in').reduce((s, m) => s + m.amount, 0)
  const outflow = movements.filter((m) => m.direction === 'out').reduce((s, m) => s + m.amount, 0)
  const capital = Number(account.initial_balance || 0) + inflow - outflow

  const sortedValuations = [...valuations].sort((a, b) => {
    if (a.valued_at !== b.valued_at) return a.valued_at < b.valued_at ? 1 : -1
    return a.created_at < b.created_at ? 1 : -1
  })
  const latestValuation = sortedValuations[0] ?? null
  const hasValuation = !!latestValuation
  const currentValue = latestValuation ? Number(latestValuation.value) : Number(account.current_balance || 0)

  const gain = currentValue - capital
  const gainPct = capital > 0 ? (gain / capital) * 100 : null

  const earliestMovement = movements.length > 0 ? movements[movements.length - 1].date : null
  const since = earliestMovement ?? account.created_at.slice(0, 10)

  return {
    account,
    capital,
    currentValue,
    hasValuation,
    gain,
    gainPct,
    since,
    lastValuedAt: latestValuation?.valued_at ?? null,
    latestValuation,
    movements,
    valuations: sortedValuations,
  }
}

export interface CurrencyTotals {
  currency: string
  capital: number
  value: number
  gain: number
  gainPct: number | null
  platforms: number
}

/** Consolida varias plataformas agrupando por moneda (nunca mezcla ARS/USD). */
export function consolidateByCurrency(platforms: InvestmentPlatform[]): CurrencyTotals[] {
  const map = new Map<string, CurrencyTotals>()

  for (const p of platforms) {
    const currency = p.account.currency || 'ARS'
    const current = map.get(currency) ?? {
      currency,
      capital: 0,
      value: 0,
      gain: 0,
      gainPct: null,
      platforms: 0,
    }
    current.capital += p.capital
    current.value += p.currentValue
    current.platforms += 1
    map.set(currency, current)
  }

  return Array.from(map.values())
    .map((t) => {
      const gain = t.value - t.capital
      return { ...t, gain, gainPct: t.capital > 0 ? (gain / t.capital) * 100 : null }
    })
    .sort((a, b) => b.value - a.value)
}

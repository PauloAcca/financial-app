import { toISODate } from '@/lib/utils'

export const DEFAULT_CLOSING_DAY = 1
export const DEFAULT_DUE_DAY = 10

/**
 * Devuelve el mes de cierre (resumen) al que aplica una compra con tarjeta,
 * como el primer día de ese mes en formato YYYY-MM-01.
 *
 * Si la compra es posterior al día de cierre, cae en el resumen del mes
 * siguiente. Ej: cierre día 1 → compra del 20/08 aplica a septiembre.
 */
export function getBillingMonth(occurredAt: string, closingDay: number): string {
  const [year, month, day] = occurredAt.split('-').map(Number)
  const purchaseDay = day || 1
  const closing = closingDay > 0 ? closingDay : DEFAULT_CLOSING_DAY
  const target = new Date(year, month - 1 + (purchaseDay > closing ? 1 : 0), 1)
  return toISODate(target)
}

/** ¿La fecha de cierre cae en un mes distinto al de la compra? */
export function billingDiffersFromPurchase(occurredAt: string, closingDay: number): boolean {
  return getBillingMonth(occurredAt, closingDay) !== `${occurredAt.slice(0, 7)}-01`
}

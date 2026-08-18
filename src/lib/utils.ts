import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// =========================================================
// cn — merge de clases Tailwind sin conflictos
// =========================================================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// =========================================================
// formatCurrency — formatea un monto con su moneda
// =========================================================
export function formatCurrency(
  amount: number,
  currency: string = 'ARS',
  locale: string = 'es-AR'
): string {
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
  // Reemplazar espacios no divisibles (\u00A0 o \u202F) por espacio común para evitar diferencias entre el SSR (Node) y el browser
  return formatted.replace(/[\u00A0\u202F]/g, ' ')
}

// =========================================================
// formatDate — formatea una fecha ISO a legible en español
// =========================================================
export function formatDate(
  dateStr: string,
  format: 'short' | 'medium' | 'long' = 'medium'
): string {
  const date = new Date(dateStr + 'T00:00:00') // evitar timezone shift
  const options: Intl.DateTimeFormatOptions =
    format === 'short'
      ? { day: '2-digit', month: '2-digit' }
      : format === 'medium'
      ? { day: '2-digit', month: 'short', year: 'numeric' }
      : { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }
  return new Intl.DateTimeFormat('es-AR', options).format(date)
}

// =========================================================
// getMonthRange — devuelve start/end de un mes dado
// =========================================================
export function getMonthRange(year: number, month: number): { start: string; end: string } {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0) // último día del mes
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

// =========================================================
// getCurrentMonth — año y mes actual
// =========================================================
export function getCurrentMonth(): { year: number; month: number } {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

// =========================================================
// toISODate — convierte Date a string YYYY-MM-DD
// =========================================================
export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0]
}

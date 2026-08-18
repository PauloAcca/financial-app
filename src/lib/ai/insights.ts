// =========================================================
// INSIGHTS PROACTIVOS — Generación on-demand
// Se llama al abrir /chat. No duplica insights del mismo mes/categoría.
// =========================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { getMonthRange } from '@/lib/utils'

const VARIATION_THRESHOLD = 0.3 // 30% de variación para generar alerta

interface CategorySpend {
  categoryId: string
  categoryName: string
  amount: number
  currency: string
}

export async function generateInsights(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const now = new Date()
  const thisYear = now.getFullYear()
  const thisMonth = now.getMonth() + 1
  const prevMonth = thisMonth === 1 ? 12 : thisMonth - 1
  const prevYear = thisMonth === 1 ? thisYear - 1 : thisYear

  const { start: thisStart, end: thisEnd } = getMonthRange(thisYear, thisMonth)
  const { start: prevStart, end: prevEnd } = getMonthRange(prevYear, prevMonth)

  // Cargar gastos por categoría de ambos meses
  const [{ data: thisTxs }, { data: prevTxs }] = await Promise.all([
    supabase
      .from('transactions')
      .select('amount, currency, category_id, category:categories!category_id(id, name)')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('occurred_at', thisStart)
      .lte('occurred_at', thisEnd),
    supabase
      .from('transactions')
      .select('amount, currency, category_id, category:categories!category_id(id, name)')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('occurred_at', prevStart)
      .lte('occurred_at', prevEnd),
  ])

  if (!thisTxs || !prevTxs) return

  // Agrupar por categoría + moneda
  const aggregateByCategory = (txs: typeof thisTxs): Record<string, CategorySpend> => {
    const result: Record<string, CategorySpend> = {}
    for (const tx of txs) {
      if (!tx.category_id) continue
      const key = `${tx.category_id}_${tx.currency}`
      if (!result[key]) {
        result[key] = {
          categoryId: tx.category_id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          categoryName: (tx.category as unknown as { name: string } | null)?.name ?? 'Categoría',
          amount: 0,
          currency: tx.currency,
        }
      }
      result[key].amount += tx.amount
    }
    return result
  }

  const thisSpend = aggregateByCategory(thisTxs)
  const prevSpend = aggregateByCategory(prevTxs)

  const insightsToInsert: {
    user_id: string
    type: string
    title: string
    message: string
    related_category_id: string | null
  }[] = []

  for (const key of Object.keys(thisSpend)) {
    const current = thisSpend[key]
    const previous = prevSpend[key]

    if (!previous || previous.amount === 0) continue

    const variation = (current.amount - previous.amount) / previous.amount

    if (Math.abs(variation) < VARIATION_THRESHOLD) continue

    // Verificar que no existe ya un insight para este mes + categoría
    const { data: existing } = await supabase
      .from('insights')
      .select('id')
      .eq('user_id', userId)
      .eq('related_category_id', current.categoryId)
      .gte('created_at', thisStart)
      .maybeSingle()

    if (existing) continue

    const isIncrease = variation > 0
    const pctChange = Math.round(Math.abs(variation) * 100)
    const monthName = new Date(thisYear, thisMonth - 1).toLocaleString('es-AR', { month: 'long' })

    insightsToInsert.push({
      user_id: userId,
      type: isIncrease ? 'alert' : 'tip',
      title: isIncrease
        ? `Gasto en ${current.categoryName} subió un ${pctChange}%`
        : `Gastás menos en ${current.categoryName} este mes`,
      message: isIncrease
        ? `En ${monthName} gastaste ${current.currency} ${current.amount.toLocaleString('es-AR')} en ${current.categoryName}, un ${pctChange}% más que el mes anterior (${current.currency} ${previous.amount.toLocaleString('es-AR')}).`
        : `En ${monthName} gastaste ${current.currency} ${current.amount.toLocaleString('es-AR')} en ${current.categoryName}, un ${pctChange}% menos que el mes anterior. ¡Buen trabajo!`,
      related_category_id: current.categoryId,
    })
  }

  if (insightsToInsert.length > 0) {
    await supabase.from('insights').insert(insightsToInsert)
  }
}

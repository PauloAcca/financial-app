'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CreateRecurringInput, ActionResult } from '@/types'
import type { RecurringTransaction, RecurringTransactionPayment } from '@/types/database'

// =========================================================
// CREATE RECURRING TRANSACTION
// =========================================================
export async function createRecurring(
  input: CreateRecurringInput
): Promise<ActionResult<RecurringTransaction>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { data, error } = await supabase
    .from('recurring_transactions')
    .insert({
      user_id:      user.id,
      account_id:   input.account_id,
      category_id:  input.category_id ?? null,
      type:         input.type,
      amount:       input.amount,
      currency:     input.currency,
      description:  input.description.trim(),
      frequency:    input.frequency,
      day_of_month: input.day_of_month ?? null,
      next_run_date: input.next_run_date,
      is_subscription: input.is_subscription ?? false,
    })
    .select()
    .single()

  if (error) {
    console.error('createRecurring:', error)
    return { success: false, error: 'No se pudo crear el gasto fijo.' }
  }

  revalidatePath('/recurring')
  return { success: true, data }
}

// =========================================================
// UPDATE RECURRING TRANSACTION
// =========================================================
export async function updateRecurring(
  input: import('@/types').UpdateRecurringInput
): Promise<ActionResult<RecurringTransaction>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { id, ...fields } = input
  const updates: Record<string, unknown> = {}

  if (fields.account_id      !== undefined) updates.account_id      = fields.account_id
  if (fields.category_id     !== undefined) updates.category_id     = fields.category_id || null
  if (fields.type            !== undefined) updates.type            = fields.type
  if (fields.amount          !== undefined) updates.amount          = fields.amount
  if (fields.currency        !== undefined) updates.currency        = fields.currency
  if (fields.description     !== undefined) updates.description     = fields.description.trim()
  if (fields.frequency       !== undefined) updates.frequency       = fields.frequency
  if (fields.day_of_month    !== undefined) updates.day_of_month    = fields.day_of_month || null
  if (fields.next_run_date   !== undefined) updates.next_run_date   = fields.next_run_date
  if (fields.is_subscription !== undefined) updates.is_subscription = fields.is_subscription

  const { data, error } = await supabase
    .from('recurring_transactions')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('updateRecurring:', error)
    return { success: false, error: 'No se pudo actualizar el gasto fijo.' }
  }

  revalidatePath('/recurring')
  return { success: true, data }
}

// =========================================================
// TOGGLE ACTIVE
// =========================================================
export async function toggleRecurringActive(id: string, active: boolean): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { error } = await supabase
    .from('recurring_transactions')
    .update({ active })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: 'No se pudo actualizar.' }

  revalidatePath('/recurring')
  return { success: true, data: undefined }
}

// =========================================================
// DELETE RECURRING TRANSACTION
// =========================================================
export async function deleteRecurring(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { error } = await supabase
    .from('recurring_transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: 'No se pudo eliminar.' }

  revalidatePath('/recurring')
  return { success: true, data: undefined }
}

// =========================================================
// MARK AS PAID (crea la transacción real y el payment record)
// =========================================================
export async function markRecurringPaid(
  recurringId: string,
  period: string   // 'YYYY-MM'
): Promise<ActionResult<RecurringTransactionPayment>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado.' }

  // Verificar que no esté ya pagado este período
  const { data: existing } = await supabase
    .from('recurring_transaction_payments')
    .select('id, paid')
    .eq('recurring_transaction_id', recurringId)
    .eq('period', period)
    .single()

  if (existing?.paid) {
    return { success: false, error: 'Este período ya fue marcado como pagado.' }
  }

  // Cargar el recurrente para tener los datos de la transacción
  const { data: rec } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('id', recurringId)
    .eq('user_id', user.id)
    .single()

  if (!rec) return { success: false, error: 'No se encontró el gasto fijo.' }

  // Construir la fecha de ocurrencia: día configurado dentro del período, o el primero del mes
  const [year, month] = period.split('-').map(Number)
  const day = rec.day_of_month ?? 1
  const occurredAt = `${period}-${String(day).padStart(2, '0')}`

  // Crear la transacción real
  const { data: tx, error: txErr } = await supabase
    .from('transactions')
    .insert({
      user_id:                 user.id,
      account_id:              rec.account_id,
      category_id:             rec.category_id,
      type:                    rec.type,
      amount:                  rec.amount,
      currency:                rec.currency,
      description:             rec.description,
      occurred_at:             occurredAt,
      source:                  'recurring',
      recurring_transaction_id: recurringId,
    })
    .select()
    .single()

  if (txErr || !tx) {
    console.error('markRecurringPaid tx:', txErr)
    return { success: false, error: 'No se pudo crear la transacción.' }
  }

  // Crear o actualizar el payment record
  const { data: payment, error: pmtErr } = await supabase
    .from('recurring_transaction_payments')
    .upsert({
      recurring_transaction_id: recurringId,
      period,
      paid: true,
      paid_at: new Date().toISOString(),
      transaction_id: tx.id,
    }, { onConflict: 'recurring_transaction_id,period' })
    .select()
    .single()

  if (pmtErr || !payment) {
    console.error('markRecurringPaid pmt:', pmtErr)
    return { success: false, error: 'Transacción creada pero no se pudo marcar como pagado.' }
  }

  revalidatePath('/recurring')
  revalidatePath('/transactions')
  revalidatePath('/dashboard')
  revalidatePath('/accounts')
  return { success: true, data: payment }
}

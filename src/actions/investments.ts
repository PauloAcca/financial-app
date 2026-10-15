'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  CreateInvestmentValuationInput,
  UpdateInvestmentValuationInput,
  ActionResult,
} from '@/types'
import type { InvestmentValuation } from '@/types/database'

function investmentErrorMessage(action: string, error: { message?: string } | null): string {
  const base = `No se pudo ${action}.`
  if (process.env.NODE_ENV !== 'production' && error?.message) {
    return `${base} (${error.message})`
  }
  return base
}

function revalidateInvestments() {
  revalidatePath('/inversiones')
  revalidatePath('/accounts')
  revalidatePath('/dashboard')
}

// =========================================================
// CREATE VALUATION — registrar el valor actual de la inversión
// =========================================================
export async function createInvestmentValuation(
  input: CreateInvestmentValuationInput
): Promise<ActionResult<InvestmentValuation>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado.' }

  if (!input.account_id) {
    return { success: false, error: 'Seleccioná la inversión a valorizar.' }
  }

  const value = Number(input.value)
  if (isNaN(value) || value < 0) {
    return { success: false, error: 'Ingresá un valor válido (mayor o igual a cero).' }
  }

  const { data, error } = await supabase
    .from('investment_valuations')
    .insert({
      user_id: user.id,
      account_id: input.account_id,
      value,
      currency: input.currency || 'ARS',
      valued_at: input.valued_at || new Date().toISOString().split('T')[0],
      notes: input.notes?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    console.error('createInvestmentValuation:', error)
    return { success: false, error: investmentErrorMessage('guardar la valuación', error) }
  }

  revalidateInvestments()
  return { success: true, data }
}

// =========================================================
// UPDATE VALUATION
// =========================================================
export async function updateInvestmentValuation(
  input: UpdateInvestmentValuationInput
): Promise<ActionResult<InvestmentValuation>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { id, ...fields } = input
  const updates: Record<string, unknown> = {}

  if (fields.value !== undefined) {
    const value = Number(fields.value)
    if (isNaN(value) || value < 0) {
      return { success: false, error: 'Ingresá un valor válido (mayor o igual a cero).' }
    }
    updates.value = value
  }
  if (fields.currency !== undefined) updates.currency = fields.currency
  if (fields.valued_at !== undefined) updates.valued_at = fields.valued_at
  if (fields.notes !== undefined) updates.notes = fields.notes?.trim() || null

  const { data, error } = await supabase
    .from('investment_valuations')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('updateInvestmentValuation:', error)
    return { success: false, error: investmentErrorMessage('actualizar la valuación', error) }
  }

  revalidateInvestments()
  return { success: true, data }
}

// =========================================================
// DELETE VALUATION
// =========================================================
export async function deleteInvestmentValuation(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { error } = await supabase
    .from('investment_valuations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('deleteInvestmentValuation:', error)
    return { success: false, error: 'No se pudo eliminar la valuación.' }
  }

  revalidateInvestments()
  return { success: true, data: undefined }
}

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CreateTransactionInput, UpdateTransactionInput, ActionResult } from '@/types'
import type { Transaction } from '@/types/database'

// =========================================================
// CREATE TRANSACTION
// =========================================================
export async function createTransaction(
  input: CreateTransactionInput
): Promise<ActionResult<Transaction>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado.' }

  if (input.amount <= 0) {
    return { success: false, error: 'El monto debe ser mayor a cero.' }
  }

  if ((input.type === 'expense' || input.type === 'income') && !input.category_id) {
    return { success: false, error: 'La categoría es obligatoria para gastos e ingresos.' }
  }

  if (input.type === 'transfer' && !input.transfer_account_id) {
    return { success: false, error: 'Las transferencias requieren una cuenta destino.' }
  }

  if (input.type === 'transfer' && input.transfer_account_id === input.account_id) {
    return { success: false, error: 'Las cuentas de origen y destino deben ser diferentes.' }
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      account_id: input.account_id,
      category_id: input.category_id ?? null,
      type: input.type,
      amount: input.amount,
      currency: input.currency,
      description: input.description?.trim() ?? null,
      occurred_at: input.occurred_at,
      transfer_account_id: input.transfer_account_id ?? null,
      payment_method: input.payment_method ?? null,
      source: 'manual',
    })
    .select()
    .single()

  if (error) {
    console.error('createTransaction:', error)
    return { success: false, error: 'No se pudo registrar la transacción.' }
  }

  revalidatePath('/transactions')
  revalidatePath('/dashboard')
  revalidatePath('/accounts')
  return { success: true, data }
}

// =========================================================
// UPDATE TRANSACTION
// =========================================================
export async function updateTransaction(
  input: UpdateTransactionInput
): Promise<ActionResult<Transaction>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { id, ...fields } = input
  const updates: Record<string, unknown> = {}

  if (fields.account_id          !== undefined) updates.account_id          = fields.account_id
  if (fields.category_id         !== undefined) updates.category_id         = fields.category_id
  if (fields.type                !== undefined) updates.type                = fields.type
  if (fields.amount              !== undefined) updates.amount              = fields.amount
  if (fields.currency            !== undefined) updates.currency            = fields.currency
  if (fields.description         !== undefined) updates.description         = fields.description?.trim()
  if (fields.occurred_at         !== undefined) updates.occurred_at         = fields.occurred_at
  if (fields.transfer_account_id !== undefined) updates.transfer_account_id = fields.transfer_account_id
  if (fields.payment_method      !== undefined) updates.payment_method      = fields.payment_method

  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('updateTransaction:', error)
    return { success: false, error: 'No se pudo actualizar la transacción.' }
  }

  revalidatePath('/transactions')
  revalidatePath('/dashboard')
  revalidatePath('/accounts')
  return { success: true, data }
}

// =========================================================
// DELETE TRANSACTION
// =========================================================
export async function deleteTransaction(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('deleteTransaction:', error)
    return { success: false, error: 'No se pudo eliminar la transacción.' }
  }

  revalidatePath('/transactions')
  revalidatePath('/dashboard')
  revalidatePath('/accounts')
  return { success: true, data: undefined }
}

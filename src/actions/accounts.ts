'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CreateAccountInput, UpdateAccountInput, ActionResult } from '@/types'
import type { Account } from '@/types/database'

// =========================================================
// CREATE ACCOUNT
// =========================================================
export async function createAccount(
  input: CreateAccountInput
): Promise<ActionResult<Account>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { data, error } = await supabase
    .from('accounts')
    .insert({
      user_id: user.id,
      name: input.name.trim(),
      type: input.type,
      currency: input.currency,
      initial_balance: input.initial_balance,
      current_balance: input.initial_balance, // al crear, current = initial
      color: input.color ?? null,
      icon: input.icon ?? null,
    })
    .select()
    .single()

  if (error) {
    console.error('createAccount:', error)
    return { success: false, error: 'No se pudo crear la cuenta.' }
  }

  revalidatePath('/accounts')
  revalidatePath('/dashboard')
  return { success: true, data }
}

// =========================================================
// UPDATE ACCOUNT
// =========================================================
export async function updateAccount(
  input: UpdateAccountInput
): Promise<ActionResult<Account>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { id, ...fields } = input
  const updates: Record<string, unknown> = {}

  if (fields.name            !== undefined) updates.name            = fields.name.trim()
  if (fields.type            !== undefined) updates.type            = fields.type
  if (fields.currency        !== undefined) updates.currency        = fields.currency
  if (fields.color           !== undefined) updates.color           = fields.color
  if (fields.icon            !== undefined) updates.icon            = fields.icon
  if (fields.initial_balance !== undefined) updates.initial_balance = fields.initial_balance
  if (fields.current_balance !== undefined) updates.current_balance = fields.current_balance

  const { data, error } = await supabase
    .from('accounts')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id) // RLS + validación extra
    .select()
    .single()

  if (error) {
    console.error('updateAccount:', error)
    return { success: false, error: 'No se pudo actualizar la cuenta.' }
  }

  revalidatePath('/accounts')
  revalidatePath('/dashboard')
  return { success: true, data }
}

// =========================================================
// RECALCULATE ACCOUNT BALANCES
// =========================================================
export async function recalculateAccountBalances(): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, initial_balance')
    .eq('user_id', user.id)

  if (!accounts || accounts.length === 0) return { success: true, data: undefined }

  const { data: transactions } = await supabase
    .from('transactions')
    .select('account_id, transfer_account_id, type, amount')
    .eq('user_id', user.id)

  const allTx = transactions ?? []

  for (const acc of accounts) {
    let balance = Number(acc.initial_balance) || 0
    for (const tx of allTx) {
      if (tx.account_id === acc.id) {
        if (tx.type === 'income') balance += Number(tx.amount)
        else if (tx.type === 'expense') balance -= Number(tx.amount)
        else if (tx.type === 'transfer') balance -= Number(tx.amount)
      }
      if (tx.transfer_account_id === acc.id && tx.type === 'transfer') {
        balance += Number(tx.amount)
      }
    }

    await supabase
      .from('accounts')
      .update({ current_balance: balance })
      .eq('id', acc.id)
      .eq('user_id', user.id)
  }

  revalidatePath('/accounts')
  revalidatePath('/dashboard')
  return { success: true, data: undefined }
}

// =========================================================
// TOGGLE ARCHIVE (archivar / desarchivar)
// =========================================================
export async function toggleArchiveAccount(
  id: string,
  archived: boolean
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { error } = await supabase
    .from('accounts')
    .update({ archived })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('toggleArchiveAccount:', error)
    return { success: false, error: 'No se pudo actualizar la cuenta.' }
  }

  revalidatePath('/accounts')
  revalidatePath('/dashboard')
  return { success: true, data: undefined }
}

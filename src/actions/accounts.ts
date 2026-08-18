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

  if (fields.name     !== undefined) updates.name     = fields.name.trim()
  if (fields.type     !== undefined) updates.type     = fields.type
  if (fields.currency !== undefined) updates.currency = fields.currency
  if (fields.color    !== undefined) updates.color    = fields.color
  if (fields.icon     !== undefined) updates.icon     = fields.icon

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

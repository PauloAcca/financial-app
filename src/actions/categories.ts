'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CreateCategoryInput, UpdateCategoryInput, ActionResult } from '@/types'
import type { Category, CategoryKind, TransactionType } from '@/types/database'

const TRANSACTION_PATHS = ['/categories', '/transactions', '/dashboard', '/accounts', '/metrics']

function revalidateTransactionPaths() {
  TRANSACTION_PATHS.forEach((path) => revalidatePath(path))
}

// Item liviano de transacción para los modales de categoría
export interface CategoryTransactionItem {
  id: string
  amount: number
  currency: string
  description: string | null
  occurred_at: string
  type: TransactionType
  account: { name: string } | null
}

// =========================================================
// CREATE CATEGORY (solo propias del usuario)
// =========================================================
export async function createCategory(
  input: CreateCategoryInput
): Promise<ActionResult<Category>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: user.id,
      name: input.name.trim(),
      kind: input.kind,
      icon: input.icon ?? null,
      color: input.color ?? null,
      parent_id: input.parent_id ?? null,
      is_system: false,
    })
    .select()
    .single()

  if (error) {
    console.error('createCategory:', error)
    return { success: false, error: 'No se pudo crear la categoría.' }
  }

  revalidatePath('/categories')
  revalidatePath('/transactions')
  return { success: true, data }
}

// =========================================================
// UPDATE CATEGORY
// Solo se renombran/modifican metadatos. Las transacciones
// referencian por category_id, por lo que conservan el vínculo
// y toman el nuevo nombre automáticamente.
// =========================================================
export async function updateCategory(
  input: UpdateCategoryInput
): Promise<ActionResult<Category>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { id, ...fields } = input
  const updates: Record<string, unknown> = {}

  if (fields.name      !== undefined) updates.name      = fields.name.trim()
  if (fields.kind      !== undefined) updates.kind      = fields.kind
  if (fields.icon      !== undefined) updates.icon      = fields.icon
  if (fields.color     !== undefined) updates.color     = fields.color
  if (fields.parent_id !== undefined) updates.parent_id = fields.parent_id

  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id) // RLS: no puede editar las del sistema (user_id = null)
    .eq('is_system', false)
    .select()
    .single()

  if (error) {
    console.error('updateCategory:', error)
    return { success: false, error: 'No se pudo actualizar la categoría.' }
  }

  revalidateTransactionPaths()
  return { success: true, data }
}

// =========================================================
// DELETE CATEGORY (solo propias)
// Si se pasa reassignToId, las transacciones de esta categoría
// se mueven a la categoría destino antes de eliminarla.
// Si no, quedan sin categoría (FK on delete set null).
// =========================================================
export async function deleteCategory(
  id: string,
  reassignToId?: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado.' }

  if (reassignToId && reassignToId === id) {
    return { success: false, error: 'No podés reasignar a la misma categoría.' }
  }

  // 1. Reasignar transacciones a la categoría destino (si se indicó)
  if (reassignToId) {
    const { error: reassignError } = await supabase
      .from('transactions')
      .update({ category_id: reassignToId })
      .eq('category_id', id)
      .eq('user_id', user.id)

    if (reassignError) {
      console.error('deleteCategory reassign:', reassignError)
      return { success: false, error: 'No se pudieron reasignar las transacciones.' }
    }
  }

  // 2. Soltar a los hijos (convertirlos en categorías principales)
  await supabase
    .from('categories')
    .update({ parent_id: null })
    .eq('parent_id', id)
    .eq('user_id', user.id)

  // 3. Eliminar la categoría
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('is_system', false)

  if (error) {
    console.error('deleteCategory:', error)
    return { success: false, error: 'No se pudo eliminar la categoría.' }
  }

  revalidateTransactionPaths()
  return { success: true, data: undefined }
}

// =========================================================
// GET CATEGORY TRANSACTIONS — movimientos de una categoría
// =========================================================
export async function getCategoryTransactions(
  categoryId: string
): Promise<ActionResult<CategoryTransactionItem[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { data, error } = await supabase
    .from('transactions')
    .select('id, amount, currency, description, occurred_at, type, account:accounts!account_id(name)')
    .eq('user_id', user.id)
    .eq('category_id', categoryId)
    .order('occurred_at', { ascending: false })

  if (error) {
    console.error('getCategoryTransactions:', error)
    return { success: false, error: 'No se pudieron cargar los movimientos.' }
  }

  return { success: true, data: (data ?? []) as unknown as CategoryTransactionItem[] }
}

// =========================================================
// GET UNCATEGORIZED TRANSACTIONS — movimientos sin categoría
// Filtra por tipo (income/expense) según la categoría.
// =========================================================
export async function getUncategorizedTransactions(
  kind: CategoryKind
): Promise<ActionResult<CategoryTransactionItem[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { data, error } = await supabase
    .from('transactions')
    .select('id, amount, currency, description, occurred_at, type, account:accounts!account_id(name)')
    .eq('user_id', user.id)
    .eq('type', kind)
    .is('category_id', null)
    .order('occurred_at', { ascending: false })

  if (error) {
    console.error('getUncategorizedTransactions:', error)
    return { success: false, error: 'No se pudieron cargar los movimientos.' }
  }

  return { success: true, data: (data ?? []) as unknown as CategoryTransactionItem[] }
}

// =========================================================
// ASSIGN TRANSACTIONS TO CATEGORY — asignación masiva
// =========================================================
export async function assignTransactionsToCategory(
  transactionIds: string[],
  categoryId: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado.' }

  if (transactionIds.length === 0) {
    return { success: false, error: 'No seleccionaste movimientos.' }
  }

  const { error } = await supabase
    .from('transactions')
    .update({ category_id: categoryId })
    .in('id', transactionIds)
    .eq('user_id', user.id)

  if (error) {
    console.error('assignTransactionsToCategory:', error)
    return { success: false, error: 'No se pudieron asignar los movimientos.' }
  }

  revalidateTransactionPaths()
  return { success: true, data: undefined }
}

// =========================================================
// GET CATEGORY HISTORY — movimientos de una categoría y sus
// subcategorías, para el historial con filtro por mes.
// =========================================================
export interface CategoryHistoryItem {
  id: string
  amount: number
  currency: string
  description: string | null
  occurred_at: string
  applied_month: string | null
  type: TransactionType
  account: { name: string } | null
  category: { name: string } | null
}

export async function getCategoryHistory(
  categoryId: string
): Promise<ActionResult<CategoryHistoryItem[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado.' }

  // Incluir subcategorías de la categoría seleccionada
  const { data: children } = await supabase
    .from('categories')
    .select('id')
    .eq('parent_id', categoryId)

  const ids = [categoryId, ...(children ?? []).map((c) => c.id)]

  const { data, error } = await supabase
    .from('transactions')
    .select('id, amount, currency, description, occurred_at, applied_month, type, account:accounts!account_id(name), category:categories!category_id(name)')
    .eq('user_id', user.id)
    .in('category_id', ids)
    .order('occurred_at', { ascending: false })
    .limit(1000)

  if (error) {
    console.error('getCategoryHistory:', error)
    return { success: false, error: 'No se pudo cargar el historial.' }
  }

  return { success: true, data: (data ?? []) as unknown as CategoryHistoryItem[] }
}

// =========================================================
// UNASSIGN TRANSACTIONS — quitar categoría (masivo)
// =========================================================
export async function unassignTransactions(
  transactionIds: string[]
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado.' }

  if (transactionIds.length === 0) {
    return { success: false, error: 'No seleccionaste movimientos.' }
  }

  const { error } = await supabase
    .from('transactions')
    .update({ category_id: null })
    .in('id', transactionIds)
    .eq('user_id', user.id)

  if (error) {
    console.error('unassignTransactions:', error)
    return { success: false, error: 'No se pudieron quitar los movimientos.' }
  }

  revalidateTransactionPaths()
  return { success: true, data: undefined }
}

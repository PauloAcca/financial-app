'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CreateCategoryInput, UpdateCategoryInput, ActionResult } from '@/types'
import type { Category } from '@/types/database'

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
// UPDATE CATEGORY (solo propias, no se pueden editar las del sistema)
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

  revalidatePath('/categories')
  revalidatePath('/transactions')
  return { success: true, data }
}

// =========================================================
// DELETE CATEGORY (solo propias)
// =========================================================
export async function deleteCategory(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado.' }

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

  revalidatePath('/categories')
  revalidatePath('/transactions')
  return { success: true, data: undefined }
}

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CreateLoanInput, UpdateLoanInput, RecordLoanPaymentInput, ActionResult } from '@/types'
import type { Loan, LoanPayment, LoanStatus } from '@/types/database'

// =========================================================
// CREATE LOAN
// =========================================================
export async function createLoan(
  input: CreateLoanInput
): Promise<ActionResult<Loan>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado.' }

  if (!input.person_name?.trim()) {
    return { success: false, error: 'El nombre de la persona es obligatorio.' }
  }

  if (input.amount <= 0) {
    return { success: false, error: 'El monto debe ser mayor a cero.' }
  }

  const { data, error } = await supabase
    .from('loans')
    .insert({
      user_id: user.id,
      person_name: input.person_name.trim(),
      type: input.type,
      amount: input.amount,
      paid_amount: 0,
      currency: input.currency || 'ARS',
      description: input.description?.trim() || null,
      due_date: input.due_date || null,
      account_id: input.account_id || null,
      status: 'pending',
    })
    .select(`
      *,
      account:accounts!account_id(id, name, color, icon)
    `)
    .single()

  if (error) {
    console.error('createLoan:', error)
    return { success: false, error: 'No se pudo registrar el préstamo.' }
  }

  revalidatePath('/prestamos')
  revalidatePath('/profile')
  revalidatePath('/dashboard')
  return { success: true, data }
}

// =========================================================
// UPDATE LOAN
// =========================================================
export async function updateLoan(
  input: UpdateLoanInput
): Promise<ActionResult<Loan>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { id, ...fields } = input
  const updates: Record<string, unknown> = {}

  if (fields.person_name !== undefined) updates.person_name = fields.person_name.trim()
  if (fields.type        !== undefined) updates.type        = fields.type
  if (fields.amount      !== undefined) updates.amount      = fields.amount
  if (fields.currency    !== undefined) updates.currency    = fields.currency
  if (fields.description !== undefined) updates.description = fields.description?.trim() || null
  if (fields.due_date    !== undefined) updates.due_date    = fields.due_date || null
  if (fields.account_id  !== undefined) updates.account_id  = fields.account_id || null
  if (fields.status      !== undefined) updates.status      = fields.status
  if (fields.paid_amount !== undefined) updates.paid_amount = fields.paid_amount

  if (fields.status === 'paid') {
    updates.settled_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('loans')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select(`
      *,
      account:accounts!account_id(id, name, color, icon)
    `)
    .single()

  if (error) {
    console.error('updateLoan:', error)
    return { success: false, error: 'No se pudo actualizar el préstamo.' }
  }

  revalidatePath('/prestamos')
  revalidatePath('/profile')
  return { success: true, data }
}

// =========================================================
// DELETE LOAN
// =========================================================
export async function deleteLoan(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { error } = await supabase
    .from('loans')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('deleteLoan:', error)
    return { success: false, error: 'No se pudo eliminar el préstamo.' }
  }

  revalidatePath('/prestamos')
  revalidatePath('/profile')
  return { success: true, data: undefined }
}

// =========================================================
// RECORD LOAN PAYMENT (Devolución / Pago parcial o total)
// =========================================================
export async function recordLoanPayment(
  input: RecordLoanPaymentInput
): Promise<ActionResult<LoanPayment>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado.' }

  if (input.amount <= 0) {
    return { success: false, error: 'El monto de pago debe ser mayor a cero.' }
  }

  // 1. Obtener préstamo actual
  const { data: loan, error: loanErr } = await supabase
    .from('loans')
    .select('id, amount, paid_amount')
    .eq('id', input.loan_id)
    .eq('user_id', user.id)
    .single()

  if (loanErr || !loan) {
    return { success: false, error: 'Préstamo no encontrado.' }
  }

  // 2. Insertar registro de pago
  const { data: payment, error: payErr } = await supabase
    .from('loan_payments')
    .insert({
      loan_id: input.loan_id,
      user_id: user.id,
      amount: input.amount,
      paid_at: input.paid_at || new Date().toISOString().split('T')[0],
      notes: input.notes?.trim() || null,
      account_id: input.account_id || null,
    })
    .select(`
      *,
      account:accounts!account_id(id, name, color, icon)
    `)
    .single()

  if (payErr) {
    console.error('recordLoanPayment:', payErr)
    return { success: false, error: 'No se pudo registrar el pago.' }
  }

  // 3. Recalcular total pagado del préstamo
  const { data: allPayments } = await supabase
    .from('loan_payments')
    .select('amount')
    .eq('loan_id', input.loan_id)

  const newPaidAmount = (allPayments || []).reduce((acc, p) => acc + Number(p.amount), 0)
  const totalAmount = Number(loan.amount)
  const isFullyPaid = newPaidAmount >= totalAmount
  const newStatus: LoanStatus = isFullyPaid ? 'paid' : newPaidAmount > 0 ? 'partial' : 'pending'

  await supabase
    .from('loans')
    .update({
      paid_amount: newPaidAmount,
      status: newStatus,
      settled_at: isFullyPaid ? new Date().toISOString() : null,
    })
    .eq('id', input.loan_id)
    .eq('user_id', user.id)

  revalidatePath('/prestamos')
  revalidatePath('/profile')
  return { success: true, data: payment }
}

// =========================================================
// TOGGLE / SET STATUS (Marcar como liquidado / pendiente)
// =========================================================
export async function toggleLoanStatus(
  id: string,
  newStatus: LoanStatus
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { data: loan } = await supabase
    .from('loans')
    .select('amount, paid_amount')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!loan) return { success: false, error: 'Préstamo no encontrado.' }

  const updates: Record<string, unknown> = { status: newStatus }

  if (newStatus === 'paid') {
    updates.paid_amount = loan.amount
    updates.settled_at = new Date().toISOString()
  } else if (newStatus === 'pending') {
    updates.paid_amount = 0
    updates.settled_at = null
  }

  const { error } = await supabase
    .from('loans')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('toggleLoanStatus:', error)
    return { success: false, error: 'No se pudo actualizar el estado del préstamo.' }
  }

  revalidatePath('/prestamos')
  revalidatePath('/profile')
  return { success: true, data: undefined }
}

// =========================================================
// TOOL EXECUTOR — Ejecuta cada tool contra Supabase
// Siempre usa el cliente autenticado del usuario (RLS activo)
// =========================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { getMonthRange } from '@/lib/utils'

interface ToolArgs {
  [key: string]: unknown
}

export interface ToolResult {
  success: boolean
  data?: unknown
  error?: string
  transactionCreated?: boolean
}

export async function executeToolCall(
  toolName: string,
  args: ToolArgs,
  supabase: SupabaseClient,
  userId: string
): Promise<ToolResult> {
  try {
    switch (toolName) {
      case 'get_accounts':
        return await toolGetAccounts(supabase, userId)

      case 'get_categories':
        return await toolGetCategories(supabase, userId, args.kind as string | undefined)

      case 'get_transactions':
        return await toolGetTransactions(supabase, userId, args)

      case 'get_monthly_summary':
        return await toolGetMonthlySummary(supabase, userId, Number(args.year), Number(args.month))

      case 'get_budget_status':
        return await toolGetBudgetStatus(supabase, userId, args)

      case 'create_transaction':
        return await toolCreateTransaction(supabase, userId, args)

      default:
        return { success: false, error: `Tool desconocida: ${toolName}` }
    }
  } catch (err) {
    console.error(`[tool-executor] ${toolName} error:`, err)
    return { success: false, error: 'Error interno al ejecutar la acción.' }
  }
}

// ---------------------------------------------------------
// GET ACCOUNTS
// ---------------------------------------------------------
async function toolGetAccounts(supabase: SupabaseClient, userId: string): Promise<ToolResult> {
  const { data, error } = await supabase
    .from('accounts')
    .select('id, name, type, currency, current_balance, color, icon')
    .eq('user_id', userId)
    .eq('archived', false)
    .order('created_at')

  if (error) return { success: false, error: error.message }
  return {
    success: true,
    data: {
      accounts: data,
      note: 'Los saldos están en cada moneda respectiva. No sumes monedas distintas.',
    },
  }
}

// ---------------------------------------------------------
// GET CATEGORIES
// ---------------------------------------------------------
async function toolGetCategories(
  supabase: SupabaseClient,
  userId: string,
  kind?: string
): Promise<ToolResult> {
  let query = supabase
    .from('categories')
    .select('id, name, kind, icon, color, is_system')
    .or(`user_id.eq.${userId},user_id.is.null`)
    .order('is_system', { ascending: false })
    .order('name')

  if (kind) {
    query = query.eq('kind', kind)
  }

  const { data, error } = await query
  if (error) return { success: false, error: error.message }
  return { success: true, data: { categories: data } }
}

// ---------------------------------------------------------
// GET TRANSACTIONS
// ---------------------------------------------------------
async function toolGetTransactions(
  supabase: SupabaseClient,
  userId: string,
  args: ToolArgs
): Promise<ToolResult> {
  const { from, to, category_id, type, limit = 50 } = args
  const maxLimit = Math.min(Number(limit), 200)

  let query = supabase
    .from('transactions')
    .select(`
      id, type, amount, currency, description, occurred_at,
      account:accounts!account_id(id, name, currency),
      category:categories!category_id(id, name)
    `)
    .eq('user_id', userId)
    .gte('occurred_at', String(from))
    .lte('occurred_at', String(to))
    .order('occurred_at', { ascending: false })
    .limit(maxLimit)

  if (category_id) query = query.eq('category_id', String(category_id))
  if (type) query = query.eq('type', String(type))

  const { data, error } = await query
  if (error) return { success: false, error: error.message }

  return { success: true, data: { transactions: data, count: data?.length ?? 0 } }
}

// ---------------------------------------------------------
// GET MONTHLY SUMMARY (desglosado por moneda)
// ---------------------------------------------------------
async function toolGetMonthlySummary(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  month: number
): Promise<ToolResult> {
  const { start, end } = getMonthRange(year, month)

  const { data, error } = await supabase
    .from('transactions')
    .select('type, amount, currency')
    .eq('user_id', userId)
    .gte('occurred_at', start)
    .lte('occurred_at', end)
    .in('type', ['income', 'expense'])

  if (error) return { success: false, error: error.message }

  // Agrupar por moneda
  const byCurrency: Record<string, { income: number; expense: number; balance: number }> = {}

  for (const tx of data ?? []) {
    if (!byCurrency[tx.currency]) {
      byCurrency[tx.currency] = { income: 0, expense: 0, balance: 0 }
    }
    if (tx.type === 'income') byCurrency[tx.currency].income += tx.amount
    if (tx.type === 'expense') byCurrency[tx.currency].expense += tx.amount
  }

  for (const currency in byCurrency) {
    byCurrency[currency].balance =
      byCurrency[currency].income - byCurrency[currency].expense
  }

  return {
    success: true,
    data: {
      period: { year, month, start, end },
      summary_by_currency: byCurrency,
      note: 'Cada moneda es independiente. No sumar entre sí.',
    },
  }
}

// ---------------------------------------------------------
// GET BUDGET STATUS
// ---------------------------------------------------------
async function toolGetBudgetStatus(
  supabase: SupabaseClient,
  userId: string,
  args: ToolArgs
): Promise<ToolResult> {
  const { category_id, year, month } = args
  const { start, end } = getMonthRange(Number(year), Number(month))

  // Buscar presupuesto activo
  const { data: budget, error: budgetError } = await supabase
    .from('budgets')
    .select('id, amount, currency, period, alert_threshold_pct')
    .eq('user_id', userId)
    .eq('category_id', String(category_id))
    .eq('active', true)
    .eq('period', 'monthly')
    .maybeSingle()

  if (budgetError) return { success: false, error: budgetError.message }
  if (!budget) {
    return {
      success: true,
      data: { has_budget: false, message: 'No hay presupuesto activo para esta categoría.' },
    }
  }

  // Calcular gasto real en el período
  const { data: txs, error: txError } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', userId)
    .eq('category_id', String(category_id))
    .eq('type', 'expense')
    .eq('currency', budget.currency)
    .gte('occurred_at', start)
    .lte('occurred_at', end)

  if (txError) return { success: false, error: txError.message }

  const spent = (txs ?? []).reduce((sum, t) => sum + t.amount, 0)
  const pct = Math.round((spent / budget.amount) * 100)
  const isOverBudget = spent > budget.amount
  const isNearThreshold = pct >= budget.alert_threshold_pct

  return {
    success: true,
    data: {
      has_budget: true,
      budget_amount: budget.amount,
      currency: budget.currency,
      spent,
      remaining: budget.amount - spent,
      percentage_used: pct,
      alert_threshold_pct: budget.alert_threshold_pct,
      is_over_budget: isOverBudget,
      is_near_threshold: isNearThreshold,
    },
  }
}

// ---------------------------------------------------------
// CREATE TRANSACTION
// ---------------------------------------------------------
async function toolCreateTransaction(
  supabase: SupabaseClient,
  userId: string,
  args: ToolArgs
): Promise<ToolResult> {
  const { type, amount, currency, account_id, category_id, description, occurred_at, transfer_account_id } = args

  if (!amount || Number(amount) <= 0) {
    return { success: false, error: 'El monto debe ser mayor a cero.' }
  }
  if (type === 'transfer' && !transfer_account_id) {
    return { success: false, error: 'Las transferencias requieren una cuenta destino.' }
  }
  if (type === 'transfer' && transfer_account_id === account_id) {
    return { success: false, error: 'Las cuentas de origen y destino deben ser diferentes.' }
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      account_id: String(account_id),
      category_id: category_id ? String(category_id) : null,
      type: String(type),
      amount: Number(amount),
      currency: String(currency),
      description: description ? String(description).trim() : null,
      occurred_at: String(occurred_at),
      transfer_account_id: transfer_account_id ? String(transfer_account_id) : null,
      source: 'chat',
    })
    .select(`
      id, type, amount, currency, description, occurred_at,
      account:accounts!account_id(id, name),
      category:categories!category_id(id, name)
    `)
    .single()

  if (error) {
    console.error('[tool-executor] create_transaction:', error)
    return { success: false, error: 'No se pudo registrar la transacción.' }
  }

  return { success: true, data: { transaction: data }, transactionCreated: true }
}

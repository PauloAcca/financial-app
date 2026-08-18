'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface ImportRow {
  Fecha: string
  Descripción: string
  Monto: string
  Categoría: string
}

export async function importCsvTransactions(rows: ImportRow[], accountId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No estás autenticado.' }
  }

  // 1. Obtener la cuenta para conocer su moneda
  const { data: account, error: accError } = await supabase
    .from('accounts')
    .select('currency')
    .eq('id', accountId)
    .single()

  if (accError || !account) {
    return { error: 'Cuenta no encontrada.' }
  }

  const currency = account.currency

  // 2. Obtener categorías existentes del usuario (y del sistema)
  const { data: existingCategories } = await supabase
    .from('categories')
    .select('id, name')
    .or(`user_id.eq.${user.id},is_system.eq.true`)

  const categoryMap = new Map<string, string>()
  if (existingCategories) {
    existingCategories.forEach(c => {
      categoryMap.set(c.name.toLowerCase().trim(), c.id)
    })
  }

  const transactionsToInsert = []
  let newCategoriesCount = 0

  // 3. Procesar filas
  for (const row of rows) {
    if (!row.Fecha || !row.Monto) continue

    // Parsear Fecha (de DD/MM/YYYY a YYYY-MM-DD)
    const [day, month, year] = row.Fecha.trim().split('/')
    if (!day || !month || !year) continue
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`

    // Parsear Monto
    // Soporta formato con coma (4900,00) o punto (4900.00)
    const amountStr = row.Monto.toString().replace(/\./g, '').replace(',', '.')
    let amount = parseFloat(amountStr)
    if (isNaN(amount)) continue
    
    // Asumiremos que todo lo que entra por este CSV (con montos positivos) son gastos
    // a menos que en el futuro agreguemos otra lógica.
    const type = 'expense'
    amount = Math.abs(amount) // Nos aseguramos de guardarlo como valor absoluto

    // Parsear Categoría
    const catName = (row.Categoría || 'Otros').trim()
    const catKey = catName.toLowerCase()
    
    let categoryId = categoryMap.get(catKey)

    // Si la categoría no existe, la creamos
    if (!categoryId) {
      const { data: newCat, error: catError } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          name: catName,
          kind: type,
          color: '#' + Math.floor(Math.random()*16777215).toString(16), // Color aleatorio
          is_system: false,
        })
        .select('id')
        .single()

      if (!catError && newCat) {
        categoryId = newCat.id
        categoryMap.set(catKey, newCat.id)
        newCategoriesCount++
      }
    }

    transactionsToInsert.push({
      user_id: user.id,
      account_id: accountId,
      category_id: categoryId || null,
      type,
      amount,
      currency,
      description: row.Descripción?.trim() || 'Transacción importada',
      occurred_at: isoDate,
      source: 'import',
    })
  }

  if (transactionsToInsert.length === 0) {
    return { error: 'No se encontraron transacciones válidas para importar.' }
  }

  // 4. Inserción masiva
  const { error: insertError } = await supabase
    .from('transactions')
    .insert(transactionsToInsert)

  if (insertError) {
    console.error(insertError)
    return { error: 'Ocurrió un error al guardar las transacciones.' }
  }

  // 5. Actualizar el balance de la cuenta
  // Calcular el total de los gastos importados
  const totalExpense = transactionsToInsert.reduce((acc, curr) => acc + curr.amount, 0)
  
  // (Llamamos a una función RPC de Supabase si existe, o actualizamos manualmente)
  // Aquí usamos el método simple de leer y actualizar, aunque en prod un trigger o RPC es mejor.
  const { data: currentAcc } = await supabase
    .from('accounts')
    .select('current_balance')
    .eq('id', accountId)
    .single()

  if (currentAcc) {
    await supabase
      .from('accounts')
      .update({ current_balance: currentAcc.current_balance - totalExpense })
      .eq('id', accountId)
  }

  revalidatePath('/transactions')
  revalidatePath('/dashboard')
  revalidatePath('/accounts')

  return { 
    success: true, 
    count: transactionsToInsert.length,
    newCategories: newCategoriesCount 
  }
}

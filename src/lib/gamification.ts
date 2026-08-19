import type { Account, Transaction } from '@/types/database'

export interface UserGameStats {
  level: number
  rank: string
  currentXP: number
  nextLevelXP: number
  progressPercent: number
  totalBalance: number
  totalIncome: number
  totalExpense: number
  todayExpense: number
  todayTxCount: number
  unlockedAchievementsCount: number
  totalAchievementsCount: number
  achievements: Achievement[]
}

export interface Achievement {
  id: string
  title: string
  description: string
  iconType: 'piggy' | 'plane' | 'swords' | 'shield' | 'trophy' | 'coins'
  color: string
  unlocked: boolean
  progressText?: string
}

export function calculateUserGameStats(
  accounts: Account[] = [],
  transactions: Transaction[] = []
): UserGameStats {
  // 1. Saldo total REAL (suma de current_balance de todas las cuentas activas)
  const activeAccounts = accounts.filter(a => !a.archived)
  const totalBalance = activeAccounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0)

  // 2. Ingresos y Gastos totales
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  // 3. Gastos y movimientos de HOY (en base a fecha local)
  const todayStr = new Date().toISOString().split('T')[0]
  const todayTransactions = transactions.filter(t => t.occurred_at.startsWith(todayStr))
  const todayExpense = todayTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  const todayTxCount = todayTransactions.length

  // 4. Cálculo de XP y Nivel REAL adaptado a escala ARS (Pesos Argentinos)
  // Cada transacción registrada = 50 XP
  // Cada cuenta/bóveda creada = 150 XP
  // Patrimonio: 1 XP por cada $10.000 ARS de saldo neto positivo
  // (Ej: 3.000.000 ARS = 300 XP; 10.000.000 ARS = 1.000 XP)
  const txXP = transactions.length * 50
  const accXP = activeAccounts.length * 150
  const balanceXP = totalBalance > 0 ? Math.floor(totalBalance / 10000) : 0
  const totalXP = txXP + accXP + balanceXP

  const xpPerLevel = 1000
  const level = 1 + Math.floor(totalXP / xpPerLevel)
  const currentXPInLevel = totalXP % xpPerLevel
  const progressPercent = Math.min(100, Math.round((currentXPInLevel / xpPerLevel) * 100))

  // 5. Rango según Nivel
  let rank = 'NOVATO'
  if (level >= 20) rank = 'GRAN MAESTRO'
  else if (level >= 10) rank = 'CABALLERO'
  else if (level >= 5) rank = 'GUERRERO'
  else if (level >= 2) rank = 'AVENTURERO'

  // 6. Logros REALES adaptados a magnitudes de Argentina (ARS)
  const hasFirstTx = transactions.length >= 1
  const hasFirstAccount = activeAccounts.length >= 1
  const hasSaved500k = totalBalance >= 500000
  const hasTravelTx = transactions.some(t => {
    const desc = (t.description || '').toLowerCase()
    const cat = (t.category?.name || '').toLowerCase()
    return desc.includes('viaje') || desc.includes('vuelo') || desc.includes('transporte') || cat.includes('transporte') || cat.includes('viaje')
  })
  const hasSalaryIncome = transactions.some(t => {
    const desc = (t.description || '').toLowerCase()
    const cat = (t.category?.name || '').toLowerCase()
    return t.type === 'income' && (desc.includes('sueldo') || desc.includes('salario') || cat.includes('sueldo') || cat.includes('salario'))
  })
  const hasSaved10M = totalBalance >= 10000000

  const achievements: Achievement[] = [
    {
      id: 'first_account',
      title: 'Bóveda Abierta',
      description: 'Creaste tu primera cuenta de ahorro o banco',
      iconType: 'shield',
      color: '#00FF66',
      unlocked: hasFirstAccount,
      progressText: hasFirstAccount ? 'Completado' : 'Creá 1 cuenta',
    },
    {
      id: 'first_step',
      title: 'Primer Paso',
      description: 'Registraste tu primer movimiento en el reino',
      iconType: 'swords',
      color: '#38d9f5',
      unlocked: hasFirstTx,
      progressText: hasFirstTx ? 'Completado' : 'Registrá 1 transacción',
    },
    {
      id: 'caza_botin',
      title: 'Cazador de Botín',
      description: 'Registraste tu primer ingreso de salario o botín',
      iconType: 'coins',
      color: '#fbbf24',
      unlocked: hasSalaryIncome,
      progressText: hasSalaryIncome ? 'Completado' : 'Añadí botín o salario',
    },
    {
      id: 'expert_saver',
      title: 'Ahorrador Experto',
      description: 'Acumulaste $500.000 en balance total',
      iconType: 'piggy',
      color: '#00FF66',
      unlocked: hasSaved500k,
      progressText: `${totalBalance.toLocaleString('es-AR')} / 500.000`,
    },
    {
      id: 'trotamundos',
      title: 'Trotamundos',
      description: 'Registraste un gasto en viajes o transporte',
      iconType: 'plane',
      color: '#38d9f5',
      unlocked: hasTravelTx,
      progressText: hasTravelTx ? 'Completado' : 'Gasto en viajes/transporte',
    },
    {
      id: 'whale_watcher',
      title: 'Observador de Ballenas',
      description: 'Llegá a $10.000.000 de balance total',
      iconType: 'trophy',
      color: '#a855f7',
      unlocked: hasSaved10M,
      progressText: `${totalBalance.toLocaleString('es-AR')} / 10.000.000`,
    },
  ]

  const unlockedAchievementsCount = achievements.filter(a => a.unlocked).length

  return {
    level,
    rank,
    currentXP: currentXPInLevel,
    nextLevelXP: xpPerLevel,
    progressPercent,
    totalBalance,
    totalIncome,
    totalExpense,
    todayExpense,
    todayTxCount,
    unlockedAchievementsCount,
    totalAchievementsCount: achievements.length,
    achievements,
  }
}

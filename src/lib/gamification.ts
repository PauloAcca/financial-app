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
  dailyGoal: number
  todayProgressPercent: number
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
  transactions: Transaction[] = [],
  dailyGoal: number = 100
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

  // 3. Gastos de HOY (en base a fecha local)
  const todayStr = new Date().toISOString().split('T')[0]
  const todayExpense = transactions
    .filter(t => t.type === 'expense' && t.occurred_at.startsWith(todayStr))
    .reduce((sum, t) => sum + t.amount, 0)

  const todayProgressPercent = Math.min(100, Math.round((todayExpense / dailyGoal) * 100))

  // 4. Cálculo de XP y Nivel REAL (Comienza en Nivel 1)
  // Cada transacción = 100 XP
  // Cada cuenta creada = 200 XP
  // Cada $100 de balance ahorrado positivo = 10 XP
  const txXP = transactions.length * 100
  const accXP = activeAccounts.length * 200
  const balanceXP = totalBalance > 0 ? Math.floor(totalBalance / 100) * 10 : 0
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

  // 6. Logros REALES (Se desbloquean ÚNICAMENTE si se cumple la condición en la BD)
  const hasFirstTx = transactions.length >= 1
  const hasFirstAccount = activeAccounts.length >= 1
  const hasSaved10k = totalBalance >= 10000
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
  const hasSaved5M = totalBalance >= 5000000

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
      description: 'Acumulaste $10,000 en balance total',
      iconType: 'piggy',
      color: '#00FF66',
      unlocked: hasSaved10k,
      progressText: `${totalBalance.toLocaleString('es-AR')} / 10,000`,
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
      description: 'Llegá a 5M de balance total',
      iconType: 'trophy',
      color: '#a855f7',
      unlocked: hasSaved5M,
      progressText: `${totalBalance.toLocaleString('es-AR')} / 5,000,000`,
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
    dailyGoal,
    todayProgressPercent,
    unlockedAchievementsCount,
    totalAchievementsCount: achievements.length,
    achievements,
  }
}

import type { Account, Transaction } from '@/types/database'
import { buildInvestmentAccountIds, isInvestmentTransaction } from '@/lib/investments'

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

  // 2. Ingresos y Gastos totales.
  //    Los movimientos ligados a cuentas de inversión son cambios de forma del
  //    activo (aportes/retiros), no ingreso ni gasto real, así que se excluyen.
  const investmentAccountIds = buildInvestmentAccountIds(accounts)
  const isInvestment = (t: Transaction) => isInvestmentTransaction(t, investmentAccountIds)

  const totalIncome = transactions
    .filter(t => t.type === 'income' && !isInvestment(t))
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = transactions
    .filter(t => t.type === 'expense' && !isInvestment(t))
    .reduce((sum, t) => sum + t.amount, 0)

  // 3. Gastos y movimientos de HOY (en base a fecha local)
  const todayStr = new Date().toISOString().split('T')[0]
  const todayTransactions = transactions.filter(t => t.occurred_at.startsWith(todayStr))
  const todayExpense = todayTransactions
    .filter(t => t.type === 'expense' && !isInvestment(t))
    .reduce((sum, t) => sum + t.amount, 0)
  const todayTxCount = todayTransactions.length

  // 4. Cálculo de XP y Nivel (escala ARS)
  // Cada transacción registrada = 50 XP
  // Cada cuenta creada = 150 XP
  // Patrimonio: 1 XP por cada $10.000 ARS de saldo neto positivo
  const txXP = transactions.length * 50
  const accXP = activeAccounts.length * 150
  const balanceXP = totalBalance > 0 ? Math.floor(totalBalance / 10000) : 0
  const totalXP = txXP + accXP + balanceXP

  const xpPerLevel = 1000
  const level = 1 + Math.floor(totalXP / xpPerLevel)
  const currentXPInLevel = totalXP % xpPerLevel
  const progressPercent = Math.min(100, Math.round((currentXPInLevel / xpPerLevel) * 100))

  // 5. Rango según nivel — vocabulario sobrio
  let rank = 'Explorador'
  if (level >= 20) rank = 'Maestría'
  else if (level >= 10) rank = 'Dominio'
  else if (level >= 5) rank = 'Equilibrio'
  else if (level >= 2) rank = 'Constancia'

  // 6. Logros (magnitudes de Argentina, ARS) — tonos de la paleta Aura
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
      title: 'Primer paso firme',
      description: 'Creaste tu primera cuenta',
      iconType: 'shield',
      color: '#7FD9A4',
      unlocked: hasFirstAccount,
      progressText: hasFirstAccount ? 'Completado' : 'Creá 1 cuenta',
    },
    {
      id: 'first_step',
      title: 'En marcha',
      description: 'Registraste tu primer movimiento',
      iconType: 'swords',
      color: '#A6B9E8',
      unlocked: hasFirstTx,
      progressText: hasFirstTx ? 'Completado' : 'Registrá 1 transacción',
    },
    {
      id: 'caza_botin',
      title: 'Ingreso sostenido',
      description: 'Registraste un ingreso por sueldo o salario',
      iconType: 'coins',
      color: '#E4C28F',
      unlocked: hasSalaryIncome,
      progressText: hasSalaryIncome ? 'Completado' : 'Registrá un sueldo o salario',
    },
    {
      id: 'expert_saver',
      title: 'Colchón inicial',
      description: 'Acumulaste $500.000 de balance total',
      iconType: 'piggy',
      color: '#7FD9A4',
      unlocked: hasSaved500k,
      progressText: `${totalBalance.toLocaleString('es-AR')} / 500.000`,
    },
    {
      id: 'trotamundos',
      title: 'En movimiento',
      description: 'Registraste un gasto en viajes o transporte',
      iconType: 'plane',
      color: '#A6B9E8',
      unlocked: hasTravelTx,
      progressText: hasTravelTx ? 'Completado' : 'Gasto en viajes o transporte',
    },
    {
      id: 'whale_watcher',
      title: 'Patrimonio sólido',
      description: 'Llegaste a $10.000.000 de balance total',
      iconType: 'trophy',
      color: '#BFAEE8',
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

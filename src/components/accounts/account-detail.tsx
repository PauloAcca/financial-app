'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  ArrowLeft,
  Building2,
  Wallet,
  Banknote,
  CreditCard,
  TrendingUp,
  Circle,
  Plus,
  Pencil,
  RotateCw,
  Archive,
  ArchiveRestore,
  Eye,
  EyeOff,
  Search,
  Briefcase,
  Pizza,
  Train,
  ShoppingCart,
  ReceiptText,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { ACCOUNT_TYPE_CONFIG } from '@/lib/constants'
import { toggleArchiveAccount, recalculateAccountBalances } from '@/actions/accounts'
import { deleteTransaction } from '@/actions/transactions'
import { toast } from '@/components/ui/toast'
import { Modal } from '@/components/ui/modal'
import { TransactionForm } from '@/components/transactions/transaction-form'
import { TransactionEditModal } from '@/components/transactions/transaction-edit-modal'
import type { Account, Category, Transaction } from '@/types/database'

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  'building-2': Building2,
  'wallet': Wallet,
  'banknote': Banknote,
  'credit-card': CreditCard,
  'trending-up': TrendingUp,
  'circle': Circle,
}

interface AccountDetailProps {
  account: Account
  accounts: Account[]
  categories: Category[]
  transactions: Transaction[]
  onBack: () => void
  onSelectAccount: (account: Account) => void
  onEditAccount: (account: Account) => void
}

type FilterTab = 'all' | 'income' | 'expense' | 'transfer'

export function AccountDetail({
  account,
  accounts,
  categories,
  transactions,
  onBack,
  onSelectAccount,
  onEditAccount,
}: AccountDetailProps) {
  const [filter, setFilter] = useState<FilterTab>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isHidden, setIsHidden] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isRecalculating, startRecalculate] = useTransition()

  // Modales
  const [createTxOpen, setCreateTxOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)

  // Cargar preferencia de ocultar saldo
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hide_balance')
      if (saved !== null) {
        setIsHidden(saved === 'true')
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  function toggleHide() {
    const next = !isHidden
    setIsHidden(next)
    try {
      localStorage.setItem('hide_balance', String(next))
    } catch (e) {
      console.error(e)
    }
  }

  // Filtrar transacciones pertenecientes a esta cuenta
  const accountTransactions = transactions.filter(
    (tx) => tx.account_id === account.id || tx.transfer_account_id === account.id
  )

  // Calcular métricas específicas de esta cuenta
  let totalIncome = 0
  let totalExpense = 0

  accountTransactions.forEach((tx) => {
    const desc = (tx.description || '').toLowerCase()
    const cat = (tx.category?.name || '').toLowerCase()
    const isInv = desc.includes('invers') || cat.includes('invers')
    const amount = Number(tx.amount) || 0

    if (tx.account_id === account.id) {
      if (tx.type === 'income' || isInv) {
        totalIncome += amount
      } else if (tx.type === 'expense') {
        totalExpense += amount
      } else if (tx.type === 'transfer') {
        // Transferencia saliente de esta cuenta
        totalExpense += amount
      }
    } else if (tx.transfer_account_id === account.id && tx.type === 'transfer') {
      // Transferencia entrante hacia esta cuenta
      totalIncome += amount
    }
  })

  // Filtrar según pestaña y buscador
  const filteredTransactions = accountTransactions.filter((tx) => {
    const desc = (tx.description || '').toLowerCase()
    const cat = (tx.category?.name || '').toLowerCase()
    const isInv = desc.includes('invers') || cat.includes('invers')

    // Filtro por pestaña
    if (filter === 'income') {
      const isIncomingTransfer = tx.transfer_account_id === account.id && tx.type === 'transfer'
      const isDirectIncome = tx.account_id === account.id && (tx.type === 'income' || isInv)
      if (!isIncomingTransfer && !isDirectIncome) return false
    } else if (filter === 'expense') {
      const isDirectExpense = tx.account_id === account.id && tx.type === 'expense' && !isInv
      if (!isDirectExpense) return false
    } else if (filter === 'transfer') {
      if (tx.type !== 'transfer') return false
    }

    // Filtro por término de búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      const matchDesc = desc.includes(term)
      const matchCat = cat.includes(term)
      const matchAccount = (tx.account?.name || '').toLowerCase().includes(term)
      const matchTransfer = (tx.transfer_account?.name || '').toLowerCase().includes(term)
      return matchDesc || matchCat || matchAccount || matchTransfer
    }

    return true
  })

  function handleArchiveToggle() {
    startTransition(async () => {
      const result = await toggleArchiveAccount(account.id, !account.archived)
      if (result.success) {
        toast.success(account.archived ? 'Cuenta restaurada.' : 'Cuenta archivada.')
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleRecalculate() {
    startRecalculate(async () => {
      const res = await recalculateAccountBalances()
      if (res.success) {
        toast.success('Saldo recalculado según tus transacciones actuales.')
      } else {
        toast.error('Error al recalcular saldo.')
      }
    })
  }

  function handleDeleteTx(e: React.MouseEvent, txId: string) {
    e.stopPropagation()
    if (!confirm('¿Estás seguro de que querés eliminar esta transacción?')) return

    startTransition(async () => {
      const res = await deleteTransaction(txId)
      if (res.success) toast.success('Transacción eliminada.')
      else toast.error(res.error)
    })
  }

  const config = ACCOUNT_TYPE_CONFIG[account.type]
  const IconComponent = ICON_MAP[account.icon ?? config.icon] ?? Circle
  const color = account.color ?? config.defaultColor

  // Visuales para cada transacción según si es ingreso, gasto o transferencia en esta cuenta
  function getAccountTxVisuals(tx: Transaction) {
    const desc = (tx.description || '').toLowerCase()
    const cat = (tx.category?.name || '').toLowerCase()
    const isInv = desc.includes('invers') || cat.includes('invers')

    if (tx.type === 'transfer') {
      const isOutgoing = tx.account_id === account.id
      const targetName = isOutgoing
        ? tx.transfer_account?.name || 'otra cuenta'
        : tx.account?.name || 'otra cuenta'

      return {
        isPositive: !isOutgoing,
        sign: isOutgoing ? '- ' : '+ ',
        title: isOutgoing ? `Transferencia enviada` : `Transferencia recibida`,
        subtitle: isOutgoing ? `Hacia ${targetName}` : `Desde ${targetName}`,
        badgeText: 'TRANSFERENCIA',
        badgeClass: 'border-[#38d9f5]/40 text-[#38d9f5] bg-[#38d9f5]/10',
        bgColor: 'bg-[#38d9f5]',
        textColor: 'text-black',
        icon: isOutgoing ? (
          <ArrowUpRight size={20} className="stroke-[2.5]" />
        ) : (
          <ArrowDownLeft size={20} className="stroke-[2.5]" />
        ),
      }
    }

    if (isInv) {
      return {
        isPositive: true,
        sign: '+ ',
        title: tx.description || 'Inversión Registrada',
        subtitle: tx.category?.name || 'Inversiones y Activos',
        badgeText: 'INVERSIÓN',
        badgeClass: 'border-[#a855f7]/40 text-[#a855f7] bg-[#a855f7]/10',
        bgColor: 'bg-[#a855f7]',
        textColor: 'text-white',
        icon: <TrendingUp size={20} className="stroke-[2.2]" />,
      }
    }

    if (tx.type === 'income') {
      return {
        isPositive: true,
        sign: '+ ',
        title: tx.description || 'Botín / Ingreso Recibido',
        subtitle: tx.category?.name || 'Ingreso / Salario',
        badgeText: 'BOTÍN / INGRESO',
        badgeClass: 'border-[#00FF66]/40 text-[#00FF66] bg-[#00FF66]/10',
        bgColor: 'bg-[#00FF66]',
        textColor: 'text-black',
        icon: <Briefcase size={20} className="stroke-[2.2]" />,
      }
    }

    // Expense
    const isFood =
      desc.includes('comida') ||
      desc.includes('cafe') ||
      desc.includes('pizza') ||
      cat.includes('comida') ||
      cat.includes('alimento') ||
      cat.includes('restaurante')
    const isTransport =
      desc.includes('uber') ||
      desc.includes('viaje') ||
      desc.includes('metro') ||
      cat.includes('transporte') ||
      cat.includes('viaje')

    return {
      isPositive: false,
      sign: '- ',
      title: tx.description || 'Gasto Registrado',
      subtitle: tx.category?.name || 'Gastos y Consumos',
      badgeText: 'GASTO',
      badgeClass: 'border-[#293056] text-[#8B92A9] bg-[#14182b]',
      bgColor: isFood ? 'bg-[#ff4d6d]' : isTransport ? 'bg-[#38d9f5]' : 'bg-[#232847] border border-[#313a68]',
      textColor: isFood || isTransport ? 'text-black' : 'text-[#8B92A9]',
      icon: isFood ? (
        <Pizza size={20} className="stroke-[2.2]" />
      ) : isTransport ? (
        <Train size={20} className="stroke-[2.2]" />
      ) : (
        <ShoppingCart size={20} className="stroke-[2]" />
      ),
    }
  }

  const otherAccounts = accounts.filter((a) => a.id !== account.id && !a.archived)

  return (
    <div className="flex flex-col gap-5 font-mono">
      {/* 1. BARRA SUPERIOR: BOTÓN VOLVER Y SELECTOR RÁPIDO */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 rounded-[4px] bg-[#181c31] border border-[#293056] text-white text-xs font-bold tracking-wider uppercase hover:border-[#00FF66] hover:text-[#00FF66] transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <ArrowLeft size={16} />
            <span>TODAS LAS CUENTAS</span>
          </button>

          {/* Selector rápido de otras cuentas */}
          {otherAccounts.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-[200px] sm:max-w-xs scrollbar-none">
              <span className="text-[10px] text-[#5d6786] uppercase shrink-0 font-bold">CAMBIAR:</span>
              {otherAccounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => onSelectAccount(acc)}
                  className="px-2.5 py-1 rounded-[4px] bg-[#14182b] border border-[#293056] text-[11px] font-bold text-[#8B92A9] hover:text-white hover:border-[#00FF66]/60 shrink-0 transition-colors cursor-pointer truncate max-w-[120px]"
                  title={acc.name}
                >
                  {acc.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. HUD SUPERIOR: INFORMACIÓN PRINCIPAL DE LA CUENTA (SCANLINES CRT) */}
      <div
        className="crt-scanlines rounded-[4px] p-5 shadow-[0_0_15px_rgba(0,255,102,0.15)] relative overflow-hidden"
        style={{
          border: `2px solid ${color || '#00FF66'}`,
          boxShadow: `0 0 16px ${color ? `${color}33` : 'rgba(0,255,102,0.2)'}`,
        }}
      >
        {/* Cabecera: Icono, Nombre de cuenta, Badges, Botón Ojo */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Icono de la cuenta */}
            <div
              className="w-12 h-12 rounded-[4px] flex items-center justify-center shrink-0 border border-white/10 shadow-sm"
              style={{ backgroundColor: `${color}25`, color }}
            >
              <IconComponent size={24} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                  {account.name}
                </h2>
                {account.archived && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-[2px] bg-[#293056] text-[#ff4d6d] uppercase border border-[#ff4d6d]/40">
                    ARCHIVADA
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-[2px] bg-[#14182b] border border-[#293056] text-[#8B92A9] uppercase">
                  {config.label}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-[2px] bg-[#14182b] border border-[#293056] text-[#00FF66] uppercase">
                  {account.currency}
                </span>
              </div>
            </div>
          </div>

          {/* Botón Ojo */}
          <button
            onClick={toggleHide}
            aria-label={isHidden ? 'Mostrar saldo' : 'Ocultar saldo'}
            className="text-[#00FF66]/70 hover:text-[#00FF66] p-2 rounded hover:bg-[#00FF66]/10 transition-colors cursor-pointer shrink-0 border border-[#293056]"
            title={isHidden ? 'Mostrar saldo' : 'Ocultar saldo'}
          >
            {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Saldo Actual Prominente */}
        <div className="mb-5 bg-[#0f111e]/80 border border-[#293056] rounded-[4px] p-4">
          <p className="text-[11px] text-[#8B92A9] uppercase tracking-wider mb-1 flex items-center gap-1.5 font-bold">
            <span className="text-base text-[#00FF66]">♡</span>
            <span>SALDO DISPONIBLE EN CUENTA</span>
          </p>
          <p
            className={cn(
              'text-3xl sm:text-4xl font-bold tabular-nums tracking-tight select-none',
              account.current_balance >= 0 ? 'text-[#00FF66] glow-text-green' : 'text-[#ff4d6d] glow-text-pink'
            )}
          >
            {isHidden ? '••••••••••' : formatCurrency(account.current_balance, account.currency)}
          </p>
        </div>

        {/* Grilla de 4 Estadísticas de la cuenta */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
          {/* 1. Ingresos */}
          <div className="bg-[#14182b] border border-[#293056] rounded-[4px] p-2.5 flex flex-col">
            <span className="text-[10px] font-bold text-[#8B92A9] uppercase tracking-wider">
              INGRESOS (+)
            </span>
            <span className="text-sm font-bold text-[#00FF66] tabular-nums mt-1 truncate">
              {isHidden ? '••••' : formatCurrency(totalIncome, account.currency)}
            </span>
          </div>

          {/* 2. Gastos */}
          <div className="bg-[#14182b] border border-[#293056] rounded-[4px] p-2.5 flex flex-col">
            <span className="text-[10px] font-bold text-[#8B92A9] uppercase tracking-wider">
              GASTOS (-)
            </span>
            <span className="text-sm font-bold text-[#ff4d6d] tabular-nums mt-1 truncate">
              {isHidden ? '••••' : formatCurrency(totalExpense, account.currency)}
            </span>
          </div>

          {/* 3. Saldo Inicial */}
          <div className="bg-[#14182b] border border-[#293056] rounded-[4px] p-2.5 flex flex-col">
            <span className="text-[10px] font-bold text-[#8B92A9] uppercase tracking-wider">
              SALDO INICIAL
            </span>
            <span className="text-sm font-bold text-[#38d9f5] tabular-nums mt-1 truncate">
              {isHidden ? '••••' : formatCurrency(account.initial_balance, account.currency)}
            </span>
          </div>

          {/* 4. Movimientos */}
          <div className="bg-[#14182b] border border-[#293056] rounded-[4px] p-2.5 flex flex-col">
            <span className="text-[10px] font-bold text-[#8B92A9] uppercase tracking-wider">
              MOVIMIENTOS
            </span>
            <span className="text-sm font-bold text-white tabular-nums mt-1">
              {accountTransactions.length} REGISTROS
            </span>
          </div>
        </div>

        {/* Barra de Acciones de la Cuenta */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#293056]">
          <button
            onClick={() => setCreateTxOpen(true)}
            className="btn-arcade-green flex-1 min-w-[140px] py-2.5 px-3 rounded-[4px] text-xs font-bold tracking-wider text-black flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus size={16} className="stroke-[3]" />
            <span>NUEVO MOVIMIENTO</span>
          </button>

          <button
            onClick={() => onEditAccount(account)}
            className="py-2.5 px-3 rounded-[4px] bg-[#181c31] border border-[#293056] text-white text-xs font-bold tracking-wider uppercase hover:border-[#00FF66] hover:text-[#00FF66] transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95"
            title="Editar nombre, tipo o saldo"
          >
            <Pencil size={15} />
            <span>EDITAR</span>
          </button>

          <button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className="py-2.5 px-3 rounded-[4px] bg-[#181c31] border border-[#293056] text-white text-xs font-bold tracking-wider uppercase hover:border-[#00FF66] hover:text-[#00FF66] transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-40"
            title="Recalcular saldo a partir de transacciones"
          >
            <RotateCw size={15} className={isRecalculating ? 'animate-spin' : ''} />
            <span>RECALCULAR</span>
          </button>

          <button
            onClick={handleArchiveToggle}
            disabled={isPending}
            className={cn(
              'py-2.5 px-3 rounded-[4px] border text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-40',
              account.archived
                ? 'bg-[#181c31] border-[#00FF66]/40 text-[#00FF66] hover:bg-[#00FF66]/10'
                : 'bg-[#181c31] border-[#ff4d6d]/40 text-[#ff4d6d] hover:bg-[#ff4d6d]/10'
            )}
            title={account.archived ? 'Restaurar cuenta' : 'Archivar cuenta'}
          >
            {account.archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
            <span>{account.archived ? 'RESTAURAR' : 'ARCHIVAR'}</span>
          </button>
        </div>
      </div>

      {/* 3. SECCIÓN INFERIOR: HISTORIAL DE TRANSACCIONES DE ESTA CUENTA */}
      <div className="flex flex-col gap-3">
        {/* Cabecera con título y contador */}
        <div className="flex items-center justify-between text-[#8B92A9] text-xs font-bold tracking-widest uppercase">
          <div className="flex items-center gap-2">
            <ReceiptText size={16} className="text-[#00FF66]" />
            <span>MOVIMIENTOS DE {account.name.toUpperCase()}</span>
          </div>
          <span className="text-[10px] text-[#5d6786] tabular-nums">
            {filteredTransactions.length} DE {accountTransactions.length}
          </span>
        </div>

        {/* Filtros Segmentados */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'py-2 px-2.5 rounded-[4px] text-xs font-bold tracking-wider uppercase transition-all cursor-pointer text-center active:scale-95',
              filter === 'all'
                ? 'bg-[#00FF66] text-black shadow-[0_0_10px_rgba(0,255,102,0.4)]'
                : 'bg-[#181c31] text-[#8B92A9] border border-[#293056] hover:text-white'
            )}
          >
            TODAS
          </button>

          <button
            onClick={() => setFilter('income')}
            className={cn(
              'py-2 px-2.5 rounded-[4px] text-xs font-bold tracking-wider uppercase transition-all cursor-pointer text-center active:scale-95',
              filter === 'income'
                ? 'bg-[#00FF66] text-black shadow-[0_0_10px_rgba(0,255,102,0.4)]'
                : 'bg-[#181c31] text-[#8B92A9] border border-[#293056] hover:text-white'
            )}
          >
            BOTÍN (+)
          </button>

          <button
            onClick={() => setFilter('expense')}
            className={cn(
              'py-2 px-2.5 rounded-[4px] text-xs font-bold tracking-wider uppercase transition-all cursor-pointer text-center active:scale-95',
              filter === 'expense'
                ? 'bg-[#00FF66] text-black shadow-[0_0_10px_rgba(0,255,102,0.4)]'
                : 'bg-[#181c31] text-[#8B92A9] border border-[#293056] hover:text-white'
            )}
          >
            GASTOS (-)
          </button>

          <button
            onClick={() => setFilter('transfer')}
            className={cn(
              'py-2 px-2.5 rounded-[4px] text-xs font-bold tracking-wider uppercase transition-all cursor-pointer text-center active:scale-95',
              filter === 'transfer'
                ? 'bg-[#00FF66] text-black shadow-[0_0_10px_rgba(0,255,102,0.4)]'
                : 'bg-[#181c31] text-[#8B92A9] border border-[#293056] hover:text-white'
            )}
          >
            TRANSFERENCIAS
          </button>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5d6786]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por descripción, categoría..."
            className="w-full pl-9 pr-4 py-2 bg-[#181c31] border border-[#293056] rounded-[4px] text-xs text-white placeholder-[#5d6786] focus:border-[#00FF66] focus:outline-none transition-colors"
          />
        </div>

        {/* Lista de Transacciones */}
        {filteredTransactions.length === 0 ? (
          <div className="bg-[#181c31] border border-[#293056] rounded-[4px] p-8 text-center flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-[4px] bg-[#14182b] border border-[#293056] flex items-center justify-center text-[#5d6786] mb-1">
              <ReceiptText size={22} />
            </div>
            <p className="text-xs font-bold text-white uppercase tracking-wide">
              SIN MOVIMIENTOS EN ESTA CUENTA
            </p>
            <p className="text-[11px] text-[#8B92A9] max-w-xs">
              {searchTerm
                ? 'No se encontraron movimientos que coincidan con la búsqueda.'
                : filter !== 'all'
                ? 'No hay movimientos con el filtro seleccionado.'
                : 'Añadí tu primer movimiento en esta cuenta para empezar.'}
            </p>
            <button
              onClick={() => setCreateTxOpen(true)}
              className="mt-2 btn-arcade-green py-2 px-3.5 rounded-[4px] text-xs font-bold text-black flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus size={15} />
              <span>AÑADIR PRIMER MOVIMIENTO</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filteredTransactions.map((tx) => {
              const visuals = getAccountTxVisuals(tx)
              const dateStr = formatDate(tx.occurred_at, 'short')

              return (
                <div
                  key={tx.id}
                  onClick={() => setEditingTx(tx)}
                  className="group bg-[#181c31] border border-[#293056] rounded-[4px] p-4 flex items-center justify-between gap-3 hover:border-[#00FF66]/60 active:bg-[#1e233d] transition-all relative cursor-pointer"
                >
                  {/* Bloque Izquierdo: Icono + Detalles */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Cuadrado de Icono */}
                    <div
                      className={cn(
                        'w-11 h-11 rounded-[4px] flex items-center justify-center shrink-0 shadow-sm',
                        visuals.bgColor,
                        visuals.textColor
                      )}
                    >
                      {visuals.icon}
                    </div>

                    {/* Textos */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate group-hover:text-[#00FF66] transition-colors">
                          {visuals.title}
                        </h3>
                        <Pencil
                          size={11}
                          className="text-[#5d6786] group-hover:text-[#00FF66] shrink-0 opacity-60"
                        />
                      </div>
                      <p className="text-[11px] text-[#8B92A9] mt-0.5 truncate">{visuals.subtitle}</p>
                      <p className="text-[10px] text-[#00FF66] font-mono mt-0.5 glow-text-green">
                        {dateStr}
                      </p>
                    </div>
                  </div>

                  {/* Bloque Derecho: Monto + Badge + Botón Borrar */}
                  <div className="flex flex-col items-end shrink-0 gap-1.5">
                    <span
                      className={cn(
                        'text-xs sm:text-sm font-bold tabular-nums tracking-wide',
                        visuals.isPositive ? 'text-[#00FF66] glow-text-green' : 'text-white'
                      )}
                    >
                      {visuals.sign}
                      {formatCurrency(tx.amount, tx.currency || account.currency)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'text-[9px] font-bold px-1.5 py-0.5 rounded-[2px] tracking-widest uppercase border',
                          visuals.badgeClass
                        )}
                      >
                        {visuals.badgeText}
                      </span>

                      <button
                        onClick={(e) => handleDeleteTx(e, tx.id)}
                        disabled={isPending}
                        className="p-1 rounded bg-[#20253f] text-[#5d6786] hover:text-[#ff4d6d] hover:bg-[#ff4d6d]/20 transition-colors"
                        title="Eliminar transacción"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* MODAL: Nueva Transacción para esta Cuenta */}
      <Modal
        open={createTxOpen}
        onClose={() => setCreateTxOpen(false)}
        title={`💰 NUEVO MOVIMIENTO EN ${account.name.toUpperCase()}`}
        size="md"
      >
        <div className="pt-2">
          <TransactionForm
            accounts={accounts}
            categories={categories}
            initialAccountId={account.id}
            defaultCurrency={account.currency}
            onSuccess={() => {
              setCreateTxOpen(false)
            }}
          />
        </div>
      </Modal>

      {/* MODAL: Editar Transacción */}
      <TransactionEditModal
        open={!!editingTx}
        onClose={() => setEditingTx(null)}
        transaction={editingTx}
        accounts={accounts}
        categories={categories}
      />
    </div>
  )
}

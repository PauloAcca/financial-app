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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

  const isInvestmentAccount = account.type === 'investment'

  // Calcular métricas específicas de esta cuenta
  let totalIncome = 0
  let totalExpense = 0

  accountTransactions.forEach((tx) => {
    const amount = Number(tx.amount) || 0

    if (tx.account_id === account.id) {
      if (tx.type === 'income') {
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

    // Filtro por pestaña
    if (filter === 'income') {
      const isIncomingTransfer = tx.transfer_account_id === account.id && tx.type === 'transfer'
      const isDirectIncome = tx.account_id === account.id && tx.type === 'income'
      if (!isIncomingTransfer && !isDirectIncome) return false
    } else if (filter === 'expense') {
      const isDirectExpense = tx.account_id === account.id && tx.type === 'expense'
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
        badgeText: 'Transferencia',
        badgeClass: 'bg-[var(--color-transfer-subtle)] text-[var(--color-transfer)]',
        bgColor: 'bg-[var(--color-transfer-subtle)]',
        textColor: 'text-[var(--color-transfer)]',
        icon: isOutgoing ? (
          <ArrowUpRight size={20} className="stroke-[2.5]" />
        ) : (
          <ArrowDownLeft size={20} className="stroke-[2.5]" />
        ),
      }
    }

    // Plataforma de inversión: el dinero que entra es un aporte/rendimiento
    if (isInvestmentAccount && tx.type === 'income') {
      return {
        isPositive: true,
        sign: '+ ',
        title: tx.description || 'Inversión registrada',
        subtitle: tx.category?.name || 'Inversiones',
        badgeText: 'Inversión',
        badgeClass: 'bg-[var(--color-investment-subtle)] text-[var(--color-investment)]',
        bgColor: 'bg-[var(--color-investment-subtle)]',
        textColor: 'text-[var(--color-investment)]',
        icon: <TrendingUp size={20} className="stroke-[2.2]" />,
      }
    }

    if (tx.type === 'income') {
      return {
        isPositive: true,
        sign: '+ ',
        title: tx.description || 'Ingreso registrado',
        subtitle: tx.category?.name || 'Ingreso',
        badgeText: 'Ingreso',
        badgeClass: 'bg-[var(--color-income-subtle)] text-[var(--color-income)]',
        bgColor: 'bg-[var(--color-income-subtle)]',
        textColor: 'text-[var(--color-income)]',
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
      title: tx.description || 'Gasto registrado',
      subtitle: tx.category?.name || 'Gastos',
      badgeText: 'Gasto',
      badgeClass: 'bg-[rgba(255,255,255,0.06)] text-[var(--color-text-muted)]',
      bgColor: isFood
        ? 'bg-[var(--color-expense-subtle)]'
        : isTransport
        ? 'bg-[var(--color-info-subtle)]'
        : 'bg-[rgba(255,255,255,0.06)]',
      textColor: isFood
        ? 'text-[var(--color-expense)]'
        : isTransport
        ? 'text-[var(--color-info)]'
        : 'text-[var(--color-text-secondary)]',
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
    <div className="flex flex-col gap-5">
      {/* 1. BARRA SUPERIOR: BOTÓN VOLVER Y SELECTOR RÁPIDO */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <Button variant="secondary" size="sm" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Todas las cuentas</span>
          </Button>

          {/* Selector rápido de otras cuentas */}
          {otherAccounts.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-[200px] sm:max-w-xs scrollbar-none">
              <span className="text-[10px] text-[var(--color-text-muted)] shrink-0 font-medium">Cambiar:</span>
              {otherAccounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => onSelectAccount(acc)}
                  className="px-2.5 py-1 rounded-[var(--radius-full)] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.09)] text-[11px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(255,255,255,0.07)] shrink-0 transition-colors cursor-pointer truncate max-w-[120px]"
                  title={acc.name}
                >
                  {acc.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. TARJETA PRINCIPAL: INFORMACIÓN DE LA CUENTA */}
      <div className="glass rounded-[var(--radius-lg)] p-5">
        {/* Cabecera: Icono, Nombre de cuenta, Badges, Botón Ojo */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Icono de la cuenta */}
            <div
              className="w-12 h-12 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0 border border-[rgba(255,255,255,0.08)]"
              style={{ backgroundColor: `${color}25`, color }}
            >
              <IconComponent size={24} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-[var(--color-text-primary)] truncate">
                  {account.name}
                </h2>
                {account.archived && <Badge variant="system">Archivada</Badge>}
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="muted">{config.label}</Badge>
                <Badge variant="muted">{account.currency}</Badge>
              </div>
            </div>
          </div>

          {/* Botón Ojo */}
          <button
            onClick={toggleHide}
            aria-label={isHidden ? 'Mostrar saldo' : 'Ocultar saldo'}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-2 rounded-[var(--radius-sm)] hover:bg-[rgba(255,255,255,0.07)] transition-colors cursor-pointer shrink-0 border border-[rgba(255,255,255,0.09)]"
            title={isHidden ? 'Mostrar saldo' : 'Ocultar saldo'}
          >
            {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Saldo Actual Prominente */}
        <div className="mb-5 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[var(--radius-md)] p-4">
          <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-1">
            Saldo disponible en cuenta
          </p>
          <p
            className={cn(
              'font-display text-3xl sm:text-4xl font-semibold tabular-nums tracking-tight select-none',
              account.current_balance >= 0
                ? 'text-[var(--color-income)]'
                : 'text-[var(--color-expense)]'
            )}
          >
            {isHidden ? '••••••••••' : formatCurrency(account.current_balance, account.currency)}
          </p>
        </div>

        {/* Grilla de 4 Estadísticas de la cuenta */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
          {/* 1. Ingresos */}
          <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[var(--radius-md)] p-3 flex flex-col">
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
              Ingresos
            </span>
            <span className="text-sm font-semibold text-[var(--color-income)] tabular-nums mt-1 truncate">
              {isHidden ? '••••' : formatCurrency(totalIncome, account.currency)}
            </span>
          </div>

          {/* 2. Gastos */}
          <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[var(--radius-md)] p-3 flex flex-col">
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
              Gastos
            </span>
            <span className="text-sm font-semibold text-[var(--color-expense)] tabular-nums mt-1 truncate">
              {isHidden ? '••••' : formatCurrency(totalExpense, account.currency)}
            </span>
          </div>

          {/* 3. Saldo Inicial */}
          <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[var(--radius-md)] p-3 flex flex-col">
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
              Saldo inicial
            </span>
            <span className="text-sm font-semibold text-[var(--color-transfer)] tabular-nums mt-1 truncate">
              {isHidden ? '••••' : formatCurrency(account.initial_balance, account.currency)}
            </span>
          </div>

          {/* 4. Movimientos */}
          <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[var(--radius-md)] p-3 flex flex-col">
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
              Movimientos
            </span>
            <span className="text-sm font-semibold text-[var(--color-text-primary)] tabular-nums mt-1">
              {accountTransactions.length}{' '}
              {accountTransactions.length === 1 ? 'movimiento' : 'movimientos'}
            </span>
          </div>
        </div>

        {/* Barra de Acciones de la Cuenta */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[rgba(255,255,255,0.08)]">
          <Button
            onClick={() => setCreateTxOpen(true)}
            className="flex-1 min-w-[140px]"
          >
            <Plus size={16} className="stroke-[2.5]" />
            <span>Nuevo movimiento</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEditAccount(account)}
            title="Editar nombre, tipo o saldo"
          >
            <Pencil size={15} />
            <span>Editar</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleRecalculate}
            disabled={isRecalculating}
            title="Recalcular saldo a partir de transacciones"
          >
            <RotateCw size={15} className={isRecalculating ? 'animate-spin' : ''} />
            <span>Recalcular</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleArchiveToggle}
            disabled={isPending}
            className={cn(
              account.archived
                ? 'text-[var(--color-accent)] hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)]'
                : 'text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)] hover:text-[var(--color-danger)]'
            )}
            title={account.archived ? 'Restaurar cuenta' : 'Archivar cuenta'}
          >
            {account.archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
            <span>{account.archived ? 'Restaurar' : 'Archivar'}</span>
          </Button>
        </div>
      </div>

      {/* 3. SECCIÓN INFERIOR: HISTORIAL DE TRANSACCIONES DE ESTA CUENTA */}
      <div className="flex flex-col gap-3">
        {/* Cabecera con título y contador */}
        <div className="flex items-center justify-between text-xs font-medium text-[var(--color-text-secondary)]">
          <div className="flex items-center gap-2">
            <ReceiptText size={15} className="stroke-[2]" />
            <span>Movimientos de {account.name}</span>
          </div>
          <span className="text-[0.6875rem] text-[var(--color-text-muted)] tabular-nums">
            {filteredTransactions.length} de {accountTransactions.length}
          </span>
        </div>

        {/* Filtros Segmentados */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'py-2 px-2.5 rounded-[var(--radius-full)] text-xs font-medium transition-all cursor-pointer text-center active:scale-[0.98]',
              filter === 'all'
                ? 'bg-[rgba(255,255,255,0.08)] text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-secondary)] hover:bg-[rgba(255,255,255,0.05)]'
            )}
          >
            Todas
          </button>

          <button
            onClick={() => setFilter('income')}
            className={cn(
              'py-2 px-2.5 rounded-[var(--radius-full)] text-xs font-medium transition-all cursor-pointer text-center active:scale-[0.98]',
              filter === 'income'
                ? 'bg-[rgba(255,255,255,0.08)] text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-secondary)] hover:bg-[rgba(255,255,255,0.05)]'
            )}
          >
            Ingresos
          </button>

          <button
            onClick={() => setFilter('expense')}
            className={cn(
              'py-2 px-2.5 rounded-[var(--radius-full)] text-xs font-medium transition-all cursor-pointer text-center active:scale-[0.98]',
              filter === 'expense'
                ? 'bg-[rgba(255,255,255,0.08)] text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-secondary)] hover:bg-[rgba(255,255,255,0.05)]'
            )}
          >
            Gastos
          </button>

          <button
            onClick={() => setFilter('transfer')}
            className={cn(
              'py-2 px-2.5 rounded-[var(--radius-full)] text-xs font-medium transition-all cursor-pointer text-center active:scale-[0.98]',
              filter === 'transfer'
                ? 'bg-[rgba(255,255,255,0.08)] text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-secondary)] hover:bg-[rgba(255,255,255,0.05)]'
            )}
          >
            Transferencias
          </button>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por descripción, categoría..."
            className="input-base pl-9 text-sm"
          />
        </div>

        {/* Lista de Transacciones */}
        {filteredTransactions.length === 0 ? (
          <div className="glass rounded-[var(--radius-lg)] p-8 text-center flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-[var(--radius-full)] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[var(--color-text-muted)] mb-1">
              <ReceiptText size={22} />
            </div>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              Sin movimientos en esta cuenta
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] max-w-xs">
              {searchTerm
                ? 'No se encontraron movimientos que coincidan con la búsqueda.'
                : filter !== 'all'
                ? 'No hay movimientos con el filtro seleccionado.'
                : 'Añadí tu primer movimiento en esta cuenta para empezar.'}
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={() => setCreateTxOpen(true)}
            >
              <Plus size={15} />
              <span>Agregar primer movimiento</span>
            </Button>
          </div>
        ) : (
          <div className="glass rounded-[var(--radius-lg)] overflow-hidden">
            <div className="divide-y divide-[rgba(255,255,255,0.05)]">
              {filteredTransactions.map((tx) => {
                const visuals = getAccountTxVisuals(tx)
                const dateStr = formatDate(tx.occurred_at, 'short')

                return (
                  <div
                    key={tx.id}
                    onClick={() => setEditingTx(tx)}
                    className="group p-4 flex items-center justify-between gap-3 hover:bg-[rgba(255,255,255,0.03)] active:bg-[rgba(255,255,255,0.05)] transition-colors relative cursor-pointer"
                  >
                    {/* Bloque Izquierdo: Icono + Detalles */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Cuadrado de Icono */}
                      <div
                        className={cn(
                          'w-10 h-10 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0 border border-[rgba(255,255,255,0.07)]',
                          visuals.bgColor,
                          visuals.textColor
                        )}
                      >
                        {visuals.icon}
                      </div>

                      {/* Textos */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-xs sm:text-sm font-medium text-[var(--color-text-primary)] truncate">
                            {visuals.title}
                          </h3>
                          <Pencil
                            size={11}
                            className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] shrink-0 opacity-60 group-hover:opacity-100 transition-all"
                          />
                        </div>
                        <p className="text-[0.6875rem] text-[var(--color-text-secondary)] mt-0.5 truncate">
                          {visuals.subtitle}
                        </p>
                        <p className="text-[0.6875rem] text-[var(--color-text-muted)] mt-0.5">
                          {dateStr}
                        </p>
                      </div>
                    </div>

                    {/* Bloque Derecho: Monto + Badge + Botón Borrar */}
                    <div className="flex flex-col items-end shrink-0 gap-1.5">
                      <span
                        className={cn(
                          'text-xs sm:text-sm font-semibold tabular-nums',
                          visuals.isPositive
                            ? 'text-[var(--color-income)]'
                            : 'text-[var(--color-text-primary)]'
                        )}
                      >
                        {visuals.sign}
                        {formatCurrency(tx.amount, tx.currency || account.currency)}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <Badge className={visuals.badgeClass}>
                          {visuals.badgeText}
                        </Badge>

                        <button
                          onClick={(e) => handleDeleteTx(e, tx.id)}
                          disabled={isPending}
                          className="p-1 rounded-[var(--radius-sm)] bg-[rgba(255,255,255,0.06)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)] transition-colors cursor-pointer disabled:opacity-40"
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
          </div>
        )}
      </div>

      {/* MODAL: Nueva Transacción para esta Cuenta */}
      <Modal
        open={createTxOpen}
        onClose={() => setCreateTxOpen(false)}
        title={`Nuevo movimiento en ${account.name}`}
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

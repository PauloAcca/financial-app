'use client'

import { useState, useEffect } from 'react'
import {
  HandCoins,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoanCard } from '@/components/loans/loan-card'
import { LoanForm } from '@/components/loans/loan-form'
import { LoanDetailModal } from '@/components/loans/loan-detail-modal'
import { LoanPaymentModal } from '@/components/loans/loan-payment-modal'
import type { Loan, Account, LoanType } from '@/types/database'

interface LoansClientProps {
  loans: Loan[]
  accounts: Account[]
  defaultCurrency: string
}

type FilterTab = 'all' | 'lent' | 'borrowed' | 'pending' | 'paid'

export function LoansClient({ loans, accounts, defaultCurrency }: LoansClientProps) {
  const [filter, setFilter] = useState<FilterTab>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isHidden, setIsHidden] = useState(false)

  // Modales
  const [formOpen, setFormOpen] = useState(false)
  const [formInitialType, setFormInitialType] = useState<LoanType>('lent')
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null)
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [paymentLoan, setPaymentLoan] = useState<Loan | null>(null)

  // Sincronizar selectedLoan si loans cambia (tras un pago o edición)
  useEffect(() => {
    if (selectedLoan) {
      const updated = loans.find((l) => l.id === selectedLoan.id)
      if (updated) setSelectedLoan(updated)
    }
  }, [loans, selectedLoan])

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

  // Métricas
  let totalPorCobrar = 0
  let totalPorPagar = 0
  let countActivos = 0
  let countSaldados = 0

  loans.forEach((l) => {
    const total = Number(l.amount) || 0
    const paid = Number(l.paid_amount) || 0
    const remaining = Math.max(0, total - paid)

    if (l.status === 'paid' || remaining === 0) {
      countSaldados += 1
    } else {
      countActivos += 1
      if (l.type === 'lent') {
        totalPorCobrar += remaining
      } else {
        totalPorPagar += remaining
      }
    }
  })

  const balanceNeto = totalPorCobrar - totalPorPagar

  // Filtrar
  const filteredLoans = loans.filter((l) => {
    const total = Number(l.amount) || 0
    const paid = Number(l.paid_amount) || 0
    const isPaid = l.status === 'paid' || paid >= total

    if (filter === 'lent' && l.type !== 'lent') return false
    if (filter === 'borrowed' && l.type !== 'borrowed') return false
    if (filter === 'pending' && isPaid) return false
    if (filter === 'paid' && !isPaid) return false

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      const matchPerson = l.person_name.toLowerCase().includes(term)
      const matchDesc = (l.description || '').toLowerCase().includes(term)
      return matchPerson || matchDesc
    }

    return true
  })

  function handleOpenCreate(type: LoanType = 'lent') {
    setEditingLoan(null)
    setFormInitialType(type)
    setFormOpen(true)
  }

  function handleEdit(loan: Loan) {
    setEditingLoan(loan)
    setFormOpen(true)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Header Principal */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            Préstamos y deudas
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Registro de dinero prestado y deudas • No afecta tu saldo total
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => handleOpenCreate('lent')} size="sm">
            <Plus size={15} className="stroke-[2.5]" />
            <span>Nuevo préstamo</span>
          </Button>
        </div>
      </div>

      {/* 2. Resumen de préstamos */}
      <div className="glass rounded-[var(--radius-lg)] p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-1.5">
              <HandCoins size={16} className="text-[var(--color-accent)]" />
              <span>Balance neto de préstamos</span>
            </span>

            <button
              onClick={toggleHide}
              aria-label={isHidden ? 'Mostrar saldo' : 'Ocultar saldo'}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] p-1 rounded-[var(--radius-sm)] hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer"
            >
              {isHidden ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <Badge variant="default">{countActivos} activos</Badge>
        </div>

        {/* Monto Balance Neto */}
        <div
          className={cn(
            'text-2xl sm:text-3xl font-semibold tracking-tight mb-4 tabular-nums select-none',
            balanceNeto >= 0 ? 'text-[var(--color-income)]' : 'text-[var(--color-expense)]'
          )}
        >
          {isHidden ? '••••••••' : `${balanceNeto >= 0 ? '+ ' : ''}${formatCurrency(balanceNeto, defaultCurrency)}`}
        </div>

        {/* Grilla de 3 Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-[rgba(255,255,255,0.07)]">
          {/* 1. Por Cobrar */}
          <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-[var(--radius-md)] p-3 flex flex-col">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
              <ArrowUpRight size={14} className="text-[var(--color-income)]" />
              <span>Me deben (por cobrar)</span>
            </div>
            <span className="text-base sm:text-lg font-semibold text-[var(--color-income)] tabular-nums mt-1">
              {isHidden ? '••••' : formatCurrency(totalPorCobrar, defaultCurrency)}
            </span>
          </div>

          {/* 2. Por Pagar */}
          <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-[var(--radius-md)] p-3 flex flex-col">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
              <ArrowDownLeft size={14} className="text-[var(--color-expense)]" />
              <span>Debo (por pagar)</span>
            </div>
            <span className="text-base sm:text-lg font-semibold text-[var(--color-expense)] tabular-nums mt-1">
              {isHidden ? '••••' : formatCurrency(totalPorPagar, defaultCurrency)}
            </span>
          </div>

          {/* 3. Saldados */}
          <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-[var(--radius-md)] p-3 flex flex-col">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
              <CheckCircle2 size={14} />
              <span>Saldados / históricos</span>
            </div>
            <span className="text-base sm:text-lg font-semibold text-[var(--color-text-primary)] tabular-nums mt-1">
              {countSaldados} registros
            </span>
          </div>
        </div>
      </div>

      {/* 3. Filtros y Buscador */}
      <div className="flex flex-col gap-3">
        {/* Filtros Segmentados */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <Button
            variant={filter === 'all' ? 'primary' : 'secondary'}
            size="sm"
            className="w-full"
            onClick={() => setFilter('all')}
          >
            Todos ({loans.length})
          </Button>

          <Button
            variant={filter === 'lent' ? 'primary' : 'secondary'}
            size="sm"
            className="w-full"
            onClick={() => setFilter('lent')}
          >
            Me deben
          </Button>

          <Button
            variant={filter === 'borrowed' ? 'primary' : 'secondary'}
            size="sm"
            className="w-full"
            onClick={() => setFilter('borrowed')}
          >
            Debo
          </Button>

          <Button
            variant={filter === 'pending' ? 'primary' : 'secondary'}
            size="sm"
            className="w-full"
            onClick={() => setFilter('pending')}
          >
            Pendientes
          </Button>

          <Button
            variant={filter === 'paid' ? 'primary' : 'secondary'}
            size="sm"
            className="w-full"
            onClick={() => setFilter('paid')}
          >
            Saldados
          </Button>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por persona o concepto…"
            className="input-base pl-9"
          />
        </div>
      </div>

      {/* 4. Lista de Préstamos */}
      {filteredLoans.length === 0 ? (
        <div className="glass rounded-[var(--radius-lg)] flex flex-col items-center justify-center py-16 px-4 gap-3 text-center">
          <div className="w-14 h-14 rounded-[var(--radius-full)] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[var(--color-text-muted)]">
            <HandCoins size={28} />
          </div>
          <div>
            <p className="font-medium text-[var(--color-text-primary)] text-sm">
              No hay préstamos registrados
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-xs">
              {searchTerm
                ? 'No se encontraron préstamos que coincidan con la búsqueda.'
                : 'Llevá el control exacto de la plata que prestaste o te prestaron.'}
            </p>
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="primary" size="sm" onClick={() => handleOpenCreate('lent')}>
              <Plus size={15} />
              <span>Presté dinero</span>
            </Button>
            <Button variant="danger" size="sm" onClick={() => handleOpenCreate('borrowed')}>
              <Plus size={15} />
              <span>Me prestaron dinero</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredLoans.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              onSelect={(l) => setSelectedLoan(l)}
              onPayment={(l) => setPaymentLoan(l)}
            />
          ))}
        </div>
      )}

      {/* MODAL: Crear o Editar Préstamo */}
      <LoanForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editingLoan={editingLoan}
        initialType={formInitialType}
        accounts={accounts}
      />

      {/* MODAL: Detalle Completo del Préstamo */}
      <LoanDetailModal
        open={!!selectedLoan}
        onClose={() => setSelectedLoan(null)}
        loan={selectedLoan}
        onEdit={(l) => handleEdit(l)}
        onPayment={(l) => setPaymentLoan(l)}
        onDeleted={() => setSelectedLoan(null)}
      />

      {/* MODAL: Registrar Cobro / Pago de Devolución */}
      <LoanPaymentModal
        open={!!paymentLoan}
        onClose={() => setPaymentLoan(null)}
        loan={paymentLoan}
        accounts={accounts}
        onSuccess={() => {
          // Refrescar si selectedLoan está abierto
          if (selectedLoan && paymentLoan && selectedLoan.id === paymentLoan.id) {
            const updated = loans.find((l) => l.id === selectedLoan.id)
            if (updated) setSelectedLoan(updated)
          }
        }}
      />
    </div>
  )
}

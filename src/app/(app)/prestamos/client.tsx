'use client'

import { useState, useEffect } from 'react'
import {
  HandCoins,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
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
    <div className="flex flex-col gap-5 font-mono">
      {/* 1. Header Principal */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide uppercase">
            PRÉSTAMOS Y DEUDAS
          </h1>
          <p className="text-xs text-[#8B92A9] mt-0.5">
            Registro de dinero prestado y deudas • No afecta tu saldo total
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenCreate('lent')}
            className="btn-arcade-green py-2 px-3.5 rounded-[4px] text-xs font-bold text-black flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
          >
            <Plus size={16} className="stroke-[3]" />
            <span>NUEVO PRÉSTAMO</span>
          </button>
        </div>
      </div>

      {/* 2. HUD Superior: Resumen de Préstamos (Scanlines CRT) */}
      <div className="crt-scanlines pixel-border-green rounded-[4px] p-5 shadow-[0_0_15px_rgba(0,255,102,0.15)] relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[#00FF66] text-xs sm:text-sm font-bold tracking-wider uppercase glow-text-green flex items-center gap-1.5">
              <HandCoins size={16} />
              <span>BALANCE NETO DE PRÉSTAMOS</span>
            </span>

            <button
              onClick={toggleHide}
              aria-label={isHidden ? 'Mostrar saldo' : 'Ocultar saldo'}
              className="text-[#00FF66]/70 hover:text-[#00FF66] p-1 rounded hover:bg-[#00FF66]/10 transition-colors cursor-pointer"
            >
              {isHidden ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <div className="border border-[#00FF66] px-2.5 py-0.5 bg-[#0f111e] text-[#00FF66] text-xs font-bold tracking-widest rounded-[2px]">
            {countActivos} ACTIVOS
          </div>
        </div>

        {/* Monto Balance Neto */}
        <div
          className={cn(
            'text-2xl sm:text-3xl font-bold tracking-tight mb-4 tabular-nums select-none',
            balanceNeto >= 0 ? 'text-[#00FF66] glow-text-green' : 'text-[#ff4d6d] glow-text-pink'
          )}
        >
          {isHidden ? '••••••••' : `${balanceNeto >= 0 ? '+ ' : ''}${formatCurrency(balanceNeto, defaultCurrency)}`}
        </div>

        {/* Grilla de 3 Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[#293056]">
          {/* 1. Por Cobrar */}
          <div className="bg-[#14182b] border border-[#00FF66]/30 rounded-[4px] p-3 flex flex-col">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#00FF66] uppercase">
              <ArrowUpRight size={14} className="stroke-[3]" />
              <span>ME DEBEN (POR COBRAR)</span>
            </div>
            <span className="text-base sm:text-lg font-bold text-[#00FF66] tabular-nums mt-1">
              {isHidden ? '••••' : formatCurrency(totalPorCobrar, defaultCurrency)}
            </span>
          </div>

          {/* 2. Por Pagar */}
          <div className="bg-[#14182b] border border-[#ff4d6d]/30 rounded-[4px] p-3 flex flex-col">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#ff4d6d] uppercase">
              <ArrowDownLeft size={14} className="stroke-[3]" />
              <span>DEBO (POR PAGAR)</span>
            </div>
            <span className="text-base sm:text-lg font-bold text-[#ff4d6d] tabular-nums mt-1">
              {isHidden ? '••••' : formatCurrency(totalPorPagar, defaultCurrency)}
            </span>
          </div>

          {/* 3. Saldados */}
          <div className="bg-[#14182b] border border-[#293056] rounded-[4px] p-3 flex flex-col">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#8B92A9] uppercase">
              <CheckCircle2 size={14} />
              <span>SALDADOS / HISTÓRICOS</span>
            </div>
            <span className="text-base sm:text-lg font-bold text-white tabular-nums mt-1">
              {countSaldados} REGISTROS
            </span>
          </div>
        </div>
      </div>

      {/* 3. Filtros y Buscador */}
      <div className="flex flex-col gap-3">
        {/* Filtros Segmentados */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'py-2 px-2 rounded-[4px] text-xs font-bold tracking-wider uppercase transition-all cursor-pointer text-center active:scale-95',
              filter === 'all'
                ? 'bg-[#00FF66] text-black shadow-[0_0_10px_rgba(0,255,102,0.4)]'
                : 'bg-[#181c31] text-[#8B92A9] border border-[#293056] hover:text-white'
            )}
          >
            TODOS ({loans.length})
          </button>

          <button
            onClick={() => setFilter('lent')}
            className={cn(
              'py-2 px-2 rounded-[4px] text-xs font-bold tracking-wider uppercase transition-all cursor-pointer text-center active:scale-95',
              filter === 'lent'
                ? 'bg-[#00FF66] text-black shadow-[0_0_10px_rgba(0,255,102,0.4)]'
                : 'bg-[#181c31] text-[#8B92A9] border border-[#293056] hover:text-white'
            )}
          >
            ME DEBEN
          </button>

          <button
            onClick={() => setFilter('borrowed')}
            className={cn(
              'py-2 px-2 rounded-[4px] text-xs font-bold tracking-wider uppercase transition-all cursor-pointer text-center active:scale-95',
              filter === 'borrowed'
                ? 'bg-[#00FF66] text-black shadow-[0_0_10px_rgba(0,255,102,0.4)]'
                : 'bg-[#181c31] text-[#8B92A9] border border-[#293056] hover:text-white'
            )}
          >
            DEBO
          </button>

          <button
            onClick={() => setFilter('pending')}
            className={cn(
              'py-2 px-2 rounded-[4px] text-xs font-bold tracking-wider uppercase transition-all cursor-pointer text-center active:scale-95',
              filter === 'pending'
                ? 'bg-[#00FF66] text-black shadow-[0_0_10px_rgba(0,255,102,0.4)]'
                : 'bg-[#181c31] text-[#8B92A9] border border-[#293056] hover:text-white'
            )}
          >
            PENDIENTES
          </button>

          <button
            onClick={() => setFilter('paid')}
            className={cn(
              'py-2 px-2 rounded-[4px] text-xs font-bold tracking-wider uppercase transition-all cursor-pointer text-center active:scale-95',
              filter === 'paid'
                ? 'bg-[#00FF66] text-black shadow-[0_0_10px_rgba(0,255,102,0.4)]'
                : 'bg-[#181c31] text-[#8B92A9] border border-[#293056] hover:text-white'
            )}
          >
            SALDADOS
          </button>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5d6786]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por persona o concepto..."
            className="w-full pl-9 pr-4 py-2 bg-[#181c31] border border-[#293056] rounded-[4px] text-xs text-white placeholder-[#5d6786] focus:border-[#00FF66] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* 4. Lista de Préstamos */}
      {filteredLoans.length === 0 ? (
        <div className="bg-[#181c31] border border-[#293056] rounded-[4px] flex flex-col items-center justify-center py-16 px-4 gap-3 text-center">
          <div className="w-14 h-14 rounded-[4px] bg-[#14182b] border border-[#293056] flex items-center justify-center text-[#5d6786]">
            <HandCoins size={28} />
          </div>
          <div>
            <p className="font-bold text-white text-sm uppercase tracking-wide">
              NO HAY PRÉSTAMOS REGISTRADOS
            </p>
            <p className="text-xs text-[#8B92A9] mt-1 max-w-xs">
              {searchTerm
                ? 'No se encontraron préstamos que coincidan con la búsqueda.'
                : 'Llevá el control exacto de la plata que prestaste o te prestaron.'}
            </p>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => handleOpenCreate('lent')}
              className="btn-arcade-green py-2 px-3.5 rounded-[4px] text-xs font-bold text-black flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus size={15} />
              <span>PRESTÉ DINERO</span>
            </button>
            <button
              onClick={() => handleOpenCreate('borrowed')}
              className="btn-arcade-pink py-2 px-3.5 rounded-[4px] text-xs font-bold text-black flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus size={15} />
              <span>ME PRESTARON DINERO</span>
            </button>
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

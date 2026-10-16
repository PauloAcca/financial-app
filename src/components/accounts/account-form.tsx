'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { createAccount, updateAccount } from '@/actions/accounts'
import { ACCOUNT_TYPES, CURRENCIES, ACCOUNT_COLORS } from '@/lib/constants'
import { DEFAULT_CLOSING_DAY, DEFAULT_DUE_DAY } from '@/lib/credit-card'
import { cn } from '@/lib/utils'
import { Wallet, TrendingUp } from 'lucide-react'
import type { Account, AccountType } from '@/types/database'

interface AccountFormProps {
  open: boolean
  onClose: () => void
  editingAccount?: Account | null
}

export function AccountForm({ open, onClose, editingAccount }: AccountFormProps) {
  const isEditing = !!editingAccount
  const [isPending, startTransition] = useTransition()

  const [name, setName]         = useState(editingAccount?.name ?? '')
  const [type, setType]         = useState<AccountType>(editingAccount?.type ?? 'bank')
  const [currency, setCurrency] = useState(editingAccount?.currency ?? 'ARS')
  const [balance, setBalance]   = useState(editingAccount ? editingAccount.current_balance.toString() : '0')
  const [color, setColor]       = useState(editingAccount?.color ?? ACCOUNT_COLORS[0])
  const [closingDay, setClosingDay] = useState(
    editingAccount?.closing_day != null ? String(editingAccount.closing_day) : String(DEFAULT_CLOSING_DAY)
  )
  const [dueDay, setDueDay] = useState(
    editingAccount?.due_day != null ? String(editingAccount.due_day) : String(DEFAULT_DUE_DAY)
  )
  const [error, setError]       = useState<string | null>(null)

  // Resetear form cuando cambia editingAccount
  function resetForm() {
    setName(editingAccount?.name ?? '')
    setType(editingAccount?.type ?? 'bank')
    setCurrency(editingAccount?.currency ?? 'ARS')
    setBalance(editingAccount ? editingAccount.current_balance.toString() : '0')
    setColor(editingAccount?.color ?? ACCOUNT_COLORS[0])
    setClosingDay(editingAccount?.closing_day != null ? String(editingAccount.closing_day) : String(DEFAULT_CLOSING_DAY))
    setDueDay(editingAccount?.due_day != null ? String(editingAccount.due_day) : String(DEFAULT_DUE_DAY))
    setError(null)
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const numBalance = parseFloat(balance)
    if (!name.trim()) { setError('El nombre es obligatorio.'); return }
    if (isNaN(numBalance)) { setError('El saldo debe ser un número válido.'); return }

    const isCard = type === 'credit_card'
    const numClosing = isCard ? parseInt(closingDay, 10) : undefined
    const numDue = isCard ? parseInt(dueDay, 10) : undefined
    if (isCard && (isNaN(numClosing!) || numClosing! < 1 || numClosing! > 31)) {
      setError('El día de cierre debe estar entre 1 y 31.')
      return
    }
    if (isCard && (isNaN(numDue!) || numDue! < 1 || numDue! > 31)) {
      setError('El día de vencimiento debe estar entre 1 y 31.')
      return
    }

    startTransition(async () => {
      const result = isEditing
        ? await updateAccount({
            id: editingAccount!.id,
            name,
            type,
            currency,
            color,
            current_balance: numBalance,
            closing_day: numClosing,
            due_day: numDue,
          })
        : await createAccount({
            name,
            type,
            currency,
            initial_balance: numBalance,
            color,
            closing_day: numClosing,
            due_day: numDue,
          })

      if (result.success) {
        toast.success(isEditing ? 'Cuenta actualizada.' : 'Cuenta creada.')
        handleClose()
      } else {
        setError(result.error)
      }
    })
  }

  const isInvestment = type === 'investment'
  const isCard = type === 'credit_card'
  const accountTypeOptions = ACCOUNT_TYPES.filter((t) => t.value !== 'investment')

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditing ? 'Editar cuenta' : 'Nueva cuenta'}
      description={isEditing ? 'Modificá los datos de la cuenta.' : 'Agregá una nueva cuenta o billetera.'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="px-4 py-3 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] border border-[var(--color-danger)]/30">
            <p className="text-sm text-[var(--color-danger)]">{error}</p>
          </div>
        )}

        <Input
          id="account-form-name"
          label="Nombre"
          placeholder='Ej: "Banco Galicia", "Efectivo", "MP"'
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--color-text-secondary)]">
            ¿Qué tipo de cuenta es?
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { if (isInvestment) setType('bank') }}
              className={cn(
                'py-2.5 px-3 rounded-[var(--radius-md)] text-xs font-medium flex items-center justify-center gap-1.5 border transition-all cursor-pointer',
                !isInvestment
                  ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border-[rgba(143,203,176,0.45)]'
                  : 'bg-[rgba(255,255,255,0.04)] text-[var(--color-text-secondary)] border-[rgba(255,255,255,0.09)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(255,255,255,0.07)]'
              )}
            >
              <Wallet size={15} className="stroke-[2.5]" />
              <span>Cuenta / Billetera</span>
            </button>
            <button
              type="button"
              onClick={() => setType('investment')}
              className={cn(
                'py-2.5 px-3 rounded-[var(--radius-md)] text-xs font-medium flex items-center justify-center gap-1.5 border transition-all cursor-pointer',
                isInvestment
                  ? 'bg-[var(--color-investment-subtle)] text-[var(--color-investment)] border-[rgba(191,174,232,0.45)]'
                  : 'bg-[rgba(255,255,255,0.04)] text-[var(--color-text-secondary)] border-[rgba(255,255,255,0.09)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(255,255,255,0.07)]'
              )}
            >
              <TrendingUp size={15} className="stroke-[2.5]" />
              <span>Inversión</span>
            </button>
          </div>
          {isInvestment && (
            <p className="text-xs text-[var(--color-investment)]">
              Se va a mostrar en la sección Inversiones para seguir su valor y rentabilidad.
            </p>
          )}
        </div>

        {!isInvestment && (
          <Select
            id="account-form-type"
            label="Tipo de cuenta"
            value={type}
            onChange={(e) => setType(e.target.value as AccountType)}
            options={accountTypeOptions.map((t) => ({ value: t.value, label: t.label }))}
          />
        )}

        {isCard && (
          <div className="grid grid-cols-2 gap-3 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.09)] rounded-[var(--radius-md)] p-3">
            <Input
              id="account-form-closing-day"
              label="Día de cierre"
              type="number"
              min="1"
              max="31"
              value={closingDay}
              onChange={(e) => setClosingDay(e.target.value)}
              helper="Día del mes en que cierra el resumen"
            />
            <Input
              id="account-form-due-day"
              label="Día de vencimiento"
              type="number"
              min="1"
              max="31"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              helper="Día del mes en que vence el pago"
            />
            <p className="col-span-2 text-xs text-[var(--color-text-secondary)]">
              Los gastos de esta tarjeta se agruparán en métricas según el mes en que cierra el resumen.
            </p>
          </div>
        )}

        <Select
          id="account-form-currency"
          label="Moneda"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} — ${c.label}` }))}
        />

        <Input
          id="account-form-balance"
          label={isEditing ? "Saldo actual" : "Saldo inicial"}
          type="number"
          step="0.01"
          placeholder="0"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          helper={isEditing ? "Podés ajustar manualmente el saldo si es necesario." : "Podés ajustarlo después si cargás transacciones históricas."}
        />

        {/* Selector de color */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--color-text-secondary)]">
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {ACCOUNT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  'w-7 h-7 rounded-full transition-all duration-150 cursor-pointer',
                  color === c
                    ? 'ring-2 ring-offset-2 ring-offset-[var(--color-surface)] ring-white scale-110'
                    : 'hover:scale-105'
                )}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={isPending}>
            {isEditing ? 'Guardar cambios' : 'Crear cuenta'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

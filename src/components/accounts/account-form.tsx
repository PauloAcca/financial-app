'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { createAccount, updateAccount } from '@/actions/accounts'
import { ACCOUNT_TYPES, CURRENCIES, ACCOUNT_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
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
  const [error, setError]       = useState<string | null>(null)

  // Resetear form cuando cambia editingAccount
  function resetForm() {
    setName(editingAccount?.name ?? '')
    setType(editingAccount?.type ?? 'bank')
    setCurrency(editingAccount?.currency ?? 'ARS')
    setBalance(editingAccount ? editingAccount.current_balance.toString() : '0')
    setColor(editingAccount?.color ?? ACCOUNT_COLORS[0])
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

    startTransition(async () => {
      const result = isEditing
        ? await updateAccount({ id: editingAccount!.id, name, type, currency, color, current_balance: numBalance })
        : await createAccount({ name, type, currency, initial_balance: numBalance, color })

      if (result.success) {
        toast.success(isEditing ? 'Cuenta actualizada.' : 'Cuenta creada.')
        handleClose()
      } else {
        setError(result.error)
      }
    })
  }

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

        <Select
          id="account-form-type"
          label="Tipo de cuenta"
          value={type}
          onChange={(e) => setType(e.target.value as AccountType)}
          options={ACCOUNT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
        />

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

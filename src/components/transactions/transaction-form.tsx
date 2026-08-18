'use client'

import { useState, useTransition } from 'react'
import { cn, toISODate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { createTransaction } from '@/actions/transactions'
import { CURRENCIES, PAYMENT_METHODS } from '@/lib/constants'
import type { Account, Category, TransactionType } from '@/types/database'
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Plus } from 'lucide-react'

interface TransactionFormProps {
  accounts: Account[]
  categories: Category[]
  defaultCurrency?: string
}

const TYPE_OPTIONS: { value: TransactionType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'expense',  label: 'Gasto',         icon: <ArrowDownCircle size={18} />, color: 'var(--color-expense)' },
  { value: 'income',   label: 'Ingreso',        icon: <ArrowUpCircle size={18} />,  color: 'var(--color-income)' },
  { value: 'transfer', label: 'Transferencia',  icon: <ArrowLeftRight size={18} />, color: 'var(--color-transfer)' },
]

export function TransactionForm({ accounts, categories, defaultCurrency = 'ARS' }: TransactionFormProps) {
  const [isPending, startTransition] = useTransition()
  const [type, setType] = useState<TransactionType>('expense')

  const [amount,           setAmount]           = useState('')
  const [currency,         setCurrency]         = useState(defaultCurrency)
  const [accountId,        setAccountId]        = useState(accounts[0]?.id ?? '')
  const [transferAccountId,setTransferAccountId]= useState('')
  const [categoryId,       setCategoryId]       = useState('')
  const [description,      setDescription]      = useState('')
  const [date,             setDate]             = useState(toISODate(new Date()))
  const [paymentMethod,    setPaymentMethod]    = useState('')
  const [error,            setError]            = useState<string | null>(null)

  const filteredCategories = categories.filter(
    (c) => c.kind === (type === 'income' ? 'income' : 'expense')
  )

  const transferDestAccounts = accounts.filter((a) => a.id !== accountId && !a.archived)

  function resetForm() {
    setAmount('')
    setDescription('')
    setCategoryId('')
    setTransferAccountId('')
    setPaymentMethod('')
    setDate(toISODate(new Date()))
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const numAmount = parseFloat(amount)
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Ingresá un monto válido mayor a cero.')
      return
    }
    if (!accountId) {
      setError('Seleccioná una cuenta.')
      return
    }
    if (type === 'transfer' && !transferAccountId) {
      setError('Seleccioná la cuenta de destino.')
      return
    }

    startTransition(async () => {
      const result = await createTransaction({
        type,
        amount: numAmount,
        currency,
        account_id: accountId,
        category_id: type !== 'transfer' && categoryId ? categoryId : undefined,
        transfer_account_id: type === 'transfer' ? transferAccountId : undefined,
        description: description || undefined,
        occurred_at: date,
        payment_method: paymentMethod || undefined,
      })

      if (result.success) {
        const labels: Record<TransactionType, string> = {
          income: 'Ingreso registrado ✓',
          expense: 'Gasto registrado ✓',
          transfer: 'Transferencia registrada ✓',
        }
        toast.success(labels[type])
        resetForm()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] p-6 shadow-[var(--shadow-sm)]">
      <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
        <Plus size={18} className="text-[var(--color-accent)]" />
        Nueva transacción
      </h2>

      {/* Selector de tipo */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {TYPE_OPTIONS.map(({ value, label, icon, color }) => (
          <button
            key={value}
            type="button"
            onClick={() => { setType(value); setCategoryId(''); setTransferAccountId('') }}
            className={cn(
              'flex flex-col items-center gap-1.5 py-3 px-2 rounded-[var(--radius-md)]',
              'border transition-all duration-150 cursor-pointer text-sm font-medium',
              type === value
                ? 'border-current bg-current/10'
                : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'
            )}
            style={type === value ? { color } : undefined}
            aria-pressed={type === value}
          >
            {icon}
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="px-4 py-3 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] border border-[var(--color-danger)]/30">
            <p className="text-sm text-[var(--color-danger)]">{error}</p>
          </div>
        )}

        {/* Monto + moneda */}
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              id="tx-amount"
              label="Monto"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="w-28">
            <Select
              id="tx-currency"
              label="Moneda"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={CURRENCIES.map((c) => ({ value: c.code, label: c.code }))}
            />
          </div>
        </div>

        {/* Cuenta origen */}
        <Select
          id="tx-account"
          label={type === 'transfer' ? 'Cuenta origen' : 'Cuenta'}
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          options={accounts.filter((a) => !a.archived).map((a) => ({ value: a.id, label: a.name }))}
          placeholder="Seleccioná una cuenta"
        />

        {/* Cuenta destino (solo transfers) */}
        {type === 'transfer' && (
          <Select
            id="tx-transfer-account"
            label="Cuenta destino"
            value={transferAccountId}
            onChange={(e) => setTransferAccountId(e.target.value)}
            options={transferDestAccounts.map((a) => ({ value: a.id, label: a.name }))}
            placeholder="Seleccioná cuenta destino"
          />
        )}

        {/* Categoría (no en transfers) */}
        {type !== 'transfer' && (
          <Select
            id="tx-category"
            label="Categoría"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            options={filteredCategories.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Sin categoría"
          />
        )}

        {/* Descripción */}
        <Input
          id="tx-description"
          label="Descripción"
          placeholder={
            type === 'income'   ? 'Ej: Sueldo de agosto'  :
            type === 'expense'  ? 'Ej: Supermercado Coto' :
            'Ej: Ahorro a MP'
          }
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Fecha + método de pago */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="tx-date"
            label="Fecha"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <Select
            id="tx-payment-method"
            label="Medio de pago"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))}
            placeholder="Opcional"
          />
        </div>

        <Button
          id="btn-submit-transaction"
          type="submit"
          size="lg"
          className="w-full mt-1"
          loading={isPending}
        >
          {isPending ? 'Guardando...' : `Registrar ${type === 'expense' ? 'gasto' : type === 'income' ? 'ingreso' : 'transferencia'}`}
        </Button>
      </form>
    </div>
  )
}

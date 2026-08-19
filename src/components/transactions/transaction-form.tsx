'use client'

import { useState, useEffect, useTransition } from 'react'
import { cn, toISODate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { createTransaction } from '@/actions/transactions'
import { CategoryForm } from '@/components/categories/category-form'
import { CURRENCIES, PAYMENT_METHODS } from '@/lib/constants'
import type { Account, Category, TransactionType } from '@/types/database'
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Plus, TrendingUp } from 'lucide-react'

interface TransactionFormProps {
  accounts: Account[]
  categories: Category[]
  defaultCurrency?: string
}

const MODE_OPTIONS: { value: TransactionType | 'investment'; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'expense',    label: 'Gasto',         icon: <ArrowDownCircle size={18} />, color: 'var(--color-expense)' },
  { value: 'income',     label: 'Ingreso',        icon: <ArrowUpCircle size={18} />,  color: 'var(--color-income)' },
  { value: 'transfer',   label: 'Transferencia',  icon: <ArrowLeftRight size={18} />, color: 'var(--color-transfer)' },
  { value: 'investment', label: 'A inversión',    icon: <TrendingUp size={18} />,     color: '#8b5cf6' },
]

export function TransactionForm({ accounts, categories, defaultCurrency = 'ARS' }: TransactionFormProps) {
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<TransactionType | 'investment'>('expense')
  const [categoriesList, setCategoriesList] = useState<Category[]>(categories)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)

  useEffect(() => {
    setCategoriesList(categories)
  }, [categories])

  const [amount,           setAmount]           = useState('')
  const [currency,         setCurrency]         = useState(defaultCurrency)
  const [accountId,        setAccountId]        = useState(accounts[0]?.id ?? '')
  const [transferAccountId,setTransferAccountId]= useState('')
  const [categoryId,       setCategoryId]       = useState('')
  const [description,      setDescription]      = useState('')
  const [date,             setDate]             = useState(toISODate(new Date()))
  const [paymentMethod,    setPaymentMethod]    = useState('')
  const [error,            setError]            = useState<string | null>(null)

  // Inversiones no tienen categoría de gasto/ingreso — categoría solo aplica a expense/income
  const filteredCategories = categoriesList.filter(
    (c) => c.kind === (mode === 'income' ? 'income' : 'expense')
  )

  const sortedCategories: { value: string; label: string }[] = []
  const parents = filteredCategories.filter(c => !c.parent_id)
  const children = filteredCategories.filter(c => c.parent_id)

  parents.forEach(parent => {
    sortedCategories.push({ value: parent.id, label: parent.name })
    const subcats = children.filter(c => c.parent_id === parent.id)
    subcats.forEach(child => {
      sortedCategories.push({ value: child.id, label: `— ${child.name}` })
    })
  })

  // Para transfers normales: cualquier cuenta distinta. Para inversiones: solo cuentas tipo investment.
  const transferDestAccounts = mode === 'investment'
    ? accounts.filter((a) => a.id !== accountId && !a.archived && a.type === 'investment')
    : accounts.filter((a) => a.id !== accountId && !a.archived)

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
    if ((mode === 'expense' || mode === 'income') && !categoryId) {
      setError('Seleccioná una categoría.')
      return
    }
    if (mode === 'transfer' && !transferAccountId) {
      setError('Seleccioná la cuenta de destino.')
      return
    }
    if (mode === 'investment' && !transferAccountId) {
      setError('Seleccioná la cuenta de destino (ej. Broker).')
      return
    }

    const actualType = mode === 'investment' ? 'transfer' : mode;

    startTransition(async () => {
      const result = await createTransaction({
        type: actualType,
        amount: numAmount,
        currency,
        account_id: accountId,
        category_id: mode !== 'transfer' && categoryId ? categoryId : undefined,
        transfer_account_id: actualType === 'transfer' ? transferAccountId : undefined,
        description: description || undefined,
        occurred_at: date,
        payment_method: paymentMethod || undefined,
      })

      if (result.success) {
        const labels: Record<TransactionType | 'investment', string> = {
          income: 'Ingreso registrado ✓',
          expense: 'Gasto registrado ✓',
          transfer: 'Transferencia registrada ✓',
          investment: 'Inversión registrada ✓',
        }
        toast.success(labels[mode])
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
      <div className="grid grid-cols-4 gap-2 mb-5">
        {MODE_OPTIONS.map(({ value, label, icon, color }) => (
          <button
            key={value}
            type="button"
            onClick={() => { setMode(value); setCategoryId(''); setTransferAccountId('') }}
            className={cn(
              'flex flex-col items-center gap-1.5 py-3 px-2 rounded-[var(--radius-md)]',
              'border transition-all duration-150 cursor-pointer text-sm font-medium',
              mode === value
                ? 'border-current bg-current/10'
                : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'
            )}
            style={mode === value ? { color } : undefined}
            aria-pressed={mode === value}
          >
            {icon}
            <span className="text-[10px] leading-tight">{label}</span>
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
          label={(mode === 'transfer' || mode === 'investment') ? 'Cuenta origen' : 'Cuenta'}
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          options={accounts.filter((a) => !a.archived).map((a) => ({ value: a.id, label: a.name }))}
          placeholder="Seleccioná una cuenta"
        />

        {/* Cuenta Destino (solo transferencias o inversiones) */}
        {(mode === 'transfer' || mode === 'investment') && (
          <Select
            id="tx-form-transfer-dest"
            label={mode === 'investment' ? 'Cuenta destino (Broker/Inversión)' : 'Cuenta destino'}
            value={transferAccountId}
            onChange={(e) => setTransferAccountId(e.target.value)}
            options={[
              { value: '', label: 'Seleccionar...' },
              ...transferDestAccounts.map((a) => ({ value: a.id, label: a.name })),
            ]}
          />
        )}

        {/* Categoría (solo gastos e ingresos) */}
        {(mode === 'expense' || mode === 'income') && (
          <div className="flex flex-col gap-1.5 w-full">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                Categoría
              </span>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(true)}
                className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} /> Nueva categoría
              </button>
            </div>
            <Select
              id="tx-form-category"
              value={categoryId}
              onChange={(e) => {
                if (e.target.value === '__new__') {
                  setCategoryModalOpen(true)
                } else {
                  setCategoryId(e.target.value)
                }
              }}
              options={[
                ...sortedCategories,
                { value: '__new__', label: '+ Crear nueva categoría...' },
              ]}
              placeholder="Seleccioná una categoría"
            />
          </div>
        )}

        {/* Descripción */}
        <Input
          id="tx-desc"
          label="Descripción (opcional)"
          placeholder={
            mode === 'income' ? 'Ej: Sueldo de agosto' :
            mode === 'expense' ? 'Ej: Supermercado Coto' :
            mode === 'investment' ? 'Ej: Compra de CEDEARs' :
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
          {isPending ? 'Guardando...' : `Registrar ${mode === 'expense' ? 'gasto' : mode === 'income' ? 'ingreso' : mode === 'investment' ? 'inversión' : 'transferencia'}`}
        </Button>
      </form>

      <CategoryForm
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        defaultKind={mode === 'income' ? 'income' : 'expense'}
        categories={categoriesList}
        onCreated={(newCat) => {
          setCategoriesList((prev) => [...prev, newCat])
          setCategoryId(newCat.id)
        }}
      />
    </div>
  )
}

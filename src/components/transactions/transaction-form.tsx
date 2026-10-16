'use client'

import { useState, useEffect, useTransition } from 'react'
import { cn, toISODate } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { createTransaction } from '@/actions/transactions'
import { createLoan } from '@/actions/loans'
import { CategoryForm } from '@/components/categories/category-form'
import { CURRENCIES, PAYMENT_METHODS, DEFAULT_CURRENCY } from '@/lib/constants'
import type { Account, Category, TransactionType, LoanType } from '@/types/database'
import { ArrowLeftRight, Plus, PiggyBank, ArrowUpCircle, HandCoins, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

interface TransactionFormProps {
  accounts: Account[]
  categories: Category[]
  defaultCurrency?: string
  initialType?: TransactionType | 'loan'
  initialAccountId?: string
  onSuccess?: () => void
}

const MODE_OPTIONS: { value: TransactionType | 'loan'; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'expense',    label: 'Gasto',         icon: <ArrowUpCircle size={18} />,    color: 'var(--color-expense)' },
  { value: 'income',     label: 'Ingreso',       icon: <PiggyBank size={18} />,        color: 'var(--color-income)' },
  { value: 'loan',       label: 'Préstamo',      icon: <HandCoins size={18} />,        color: 'var(--color-income)' },
  { value: 'transfer',   label: 'Transferencia', icon: <ArrowLeftRight size={18} />,  color: 'var(--color-transfer)' },
]

export function TransactionForm({ accounts, categories, defaultCurrency = DEFAULT_CURRENCY, initialType = 'expense', initialAccountId, onSuccess }: TransactionFormProps) {
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<TransactionType | 'loan'>(initialType)
  const [categoriesList, setCategoriesList] = useState<Category[]>(categories)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)

  // Estados de Préstamo
  const [loanType, setLoanType] = useState<LoanType>('lent')
  const [personName, setPersonName] = useState('')
  const [dueDate, setDueDate] = useState('')

  useEffect(() => {
    setCategoriesList(categories)
  }, [categories])

  useEffect(() => {
    if (initialType) setMode(initialType)
  }, [initialType])

  const [amount,           setAmount]           = useState('')
  const [currency,         setCurrency]         = useState(defaultCurrency)
  const [accountId,        setAccountId]        = useState(initialAccountId || accounts[0]?.id || '')

  useEffect(() => {
    if (initialAccountId) {
      setAccountId(initialAccountId)
    }
  }, [initialAccountId])
  const [transferAccountId,setTransferAccountId]= useState('')
  const [categoryId,       setCategoryId]       = useState('')
  const [description,      setDescription]      = useState('')
  const [date,             setDate]             = useState(toISODate(new Date()))
  const [paymentMethod,    setPaymentMethod]    = useState('')
  const [error,            setError]            = useState<string | null>(null)

  // Categorías según modo (income usa categorías de ingreso)
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

    // MODO PRÉSTAMO
    if (mode === 'loan') {
      if (!personName.trim()) {
        setError('El nombre de la persona es obligatorio.')
        return
      }

      startTransition(async () => {
        const result = await createLoan({
          person_name: personName,
          type: loanType,
          amount: numAmount,
          currency,
          due_date: dueDate || undefined,
          account_id: accountId || undefined,
          description: description.trim() || undefined,
        })

        if (result.success) {
          toast.success(
            loanType === 'lent'
              ? 'Préstamo otorgado registrado (no descuenta saldo de cuenta).'
              : 'Préstamo recibido registrado con éxito.'
          )
          resetForm()
          setPersonName('')
          setDueDate('')
          if (onSuccess) onSuccess()
        } else {
          setError(result.error)
        }
      })
      return
    }

    if (!accountId) {
      setError('Seleccioná una cuenta.')
      return
    }
    if (mode === 'expense' && !categoryId) {
      setError('Seleccioná una categoría.')
      return
    }
    if (mode === 'transfer' && !transferAccountId) {
      setError('Seleccioná la cuenta de destino.')
      return
    }

    // Si es inversión ya no hay modo propio: mover plata a una cuenta de
    // inversión se hace con una transferencia normal a esa cuenta.
    const actualType: TransactionType = mode

    startTransition(async () => {
      const result = await createTransaction({
        type: actualType,
        amount: numAmount,
        currency,
        account_id: accountId,
        category_id: actualType !== 'transfer' && categoryId ? categoryId : undefined,
        transfer_account_id: actualType === 'transfer' ? transferAccountId : undefined,
        description: description.trim() || undefined,
        occurred_at: date,
        payment_method: paymentMethod || undefined,
      })

      if (result.success) {
        const labels: Record<TransactionType, string> = {
          income: 'Ingreso registrado con éxito.',
          expense: 'Gasto registrado con éxito.',
          transfer: 'Transferencia registrada con éxito.',
        }
        toast.success(labels[mode as TransactionType])
        resetForm()
        if (onSuccess) onSuccess()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="glass rounded-[var(--radius-lg)] p-5">
      {/* Selector de tipo de transacción */}
      <div className="grid grid-cols-4 gap-1.5 mb-5">
        {MODE_OPTIONS.map(({ value, label, icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => { setMode(value); setCategoryId(''); setTransferAccountId('') }}
            className={cn(
              'flex flex-col items-center gap-1 py-2.5 px-1 rounded-[var(--radius-md)]',
              'border transition-all duration-200 cursor-pointer text-xs font-medium',
              mode === value
                ? 'border-[rgba(143,203,176,0.45)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
                : 'border-[rgba(255,255,255,0.09)] bg-[rgba(255,255,255,0.03)] text-[var(--color-text-secondary)] hover:bg-[rgba(255,255,255,0.07)] hover:text-[var(--color-text-primary)]'
            )}
            aria-pressed={mode === value}
          >
            {icon}
            <span className="text-[10px] sm:text-[11px] leading-tight truncate">{label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="px-4 py-3 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] border border-[rgba(227,160,170,0.35)]">
            <p className="text-xs text-[var(--color-danger)] font-medium">{error}</p>
          </div>
        )}

        {/* MODO PRÉSTAMO: Selector de tipo de préstamo y Persona */}
        {mode === 'loan' && (
          <div className="flex flex-col gap-3 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.09)] rounded-[var(--radius-md)] p-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLoanType('lent')}
                className={cn(
                  'py-2 px-2 rounded-[var(--radius-md)] text-xs font-medium flex items-center justify-center gap-1.5 border transition-all cursor-pointer',
                  loanType === 'lent'
                    ? 'bg-[var(--color-income)] text-[#0A0E14] border-[var(--color-income)]'
                    : 'bg-[rgba(255,255,255,0.04)] text-[var(--color-text-secondary)] border-[rgba(255,255,255,0.09)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(255,255,255,0.07)]'
                )}
              >
                <ArrowUpRight size={14} className="stroke-[2.5]" />
                <span>Presté (me deben)</span>
              </button>

              <button
                type="button"
                onClick={() => setLoanType('borrowed')}
                className={cn(
                  'py-2 px-2 rounded-[var(--radius-md)] text-xs font-medium flex items-center justify-center gap-1.5 border transition-all cursor-pointer',
                  loanType === 'borrowed'
                    ? 'bg-[var(--color-expense)] text-[#0A0E14] border-[var(--color-expense)]'
                    : 'bg-[rgba(255,255,255,0.04)] text-[var(--color-text-secondary)] border-[rgba(255,255,255,0.09)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(255,255,255,0.07)]'
                )}
              >
                <ArrowDownLeft size={14} className="stroke-[2.5]" />
                <span>Me prestaron (debo)</span>
              </button>
            </div>

            <Input
              id="loan-form-person"
              label={loanType === 'lent' ? '¿A quién le prestaste?' : '¿Quién te prestó?'}
              placeholder='Ej: "Juan Perez", "Mamá", "Carlos"'
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              required
            />
          </div>
        )}

        {/* Monto + moneda */}
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              id="tx-amount"
              label="Monto ($)"
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

        {/* Cuenta origen / destino / referencia */}
        <Select
          id="tx-account"
          label={
            mode === 'loan' ? 'Cuenta de referencia (opcional)' :
            mode === 'transfer' ? 'Cuenta origen' :
            'Cuenta'
          }
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          options={[
            ...(mode === 'loan' ? [{ value: '', label: 'Sin vincular a cuenta' }] : []),
            ...accounts.filter((a) => !a.archived).map((a) => ({ value: a.id, label: a.name })),
          ]}
          placeholder={mode === 'loan' ? 'Opcional' : 'Seleccioná una cuenta'}
        />

        {/* Fecha Límite para Préstamos */}
        {mode === 'loan' && (
          <Input
            id="loan-due-date"
            label="Fecha límite de devolución (opcional)"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        )}

        {/* Cuenta Destino (transferencias) */}
        {mode === 'transfer' && (
          <Select
            id="tx-form-transfer-dest"
            label="Cuenta destino"
            value={transferAccountId}
            onChange={(e) => setTransferAccountId(e.target.value)}
            options={[
              { value: '', label: 'Seleccionar...' },
              ...transferDestAccounts.map((a) => ({ value: a.id, label: a.name })),
            ]}
          />
        )}

        {/* Categoría */}
        {(mode === 'expense' || mode === 'income') && (
          <div className="flex flex-col gap-1.5 w-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                Categoría {mode !== 'expense' && '(opcional)'}
              </span>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(true)}
                className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} /> Nueva
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
                { value: '', label: 'Sin categoría' },
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
          label="Descripción"
          placeholder={
            mode === 'loan' ? 'Ej: Préstamo personal / Para compras' :
            mode === 'income' ? 'Ej: Sueldo / Venta' :
            mode === 'expense' ? 'Ej: Café / Almuerzo' :
            'Ej: Transferencia a caja de ahorro'
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
            label="Método de pago"
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
          className="w-full mt-2"
          disabled={isPending}
          variant={mode === 'expense' || (mode === 'loan' && loanType === 'borrowed') ? 'danger' : 'primary'}
        >
          {isPending
            ? 'Guardando…'
            : `Confirmar ${
                mode === 'expense'
                  ? 'gasto'
                  : mode === 'income'
                  ? 'ingreso'
                  : mode === 'loan'
                  ? 'préstamo'
                  : 'transferencia'
              }`}
        </Button>
      </form>

      <CategoryForm
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        defaultKind={mode === 'expense' ? 'expense' : 'income'}
        categories={categoriesList}
        onCreated={(newCat) => {
          setCategoriesList((prev) => [...prev, newCat])
          setCategoryId(newCat.id)
        }}
      />
    </div>
  )
}

'use client'

import { useState, useEffect, useTransition } from 'react'
import { cn, toISODate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { createTransaction } from '@/actions/transactions'
import { CategoryForm } from '@/components/categories/category-form'
import { CURRENCIES, PAYMENT_METHODS, DEFAULT_CURRENCY } from '@/lib/constants'
import type { Account, Category, TransactionType } from '@/types/database'
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Plus, TrendingUp, PiggyBank, Swords } from 'lucide-react'

interface TransactionFormProps {
  accounts: Account[]
  categories: Category[]
  defaultCurrency?: string
  initialType?: TransactionType | 'investment'
  onSuccess?: () => void
}

const MODE_OPTIONS: { value: TransactionType | 'investment'; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'expense',    label: 'GASTO',         icon: <Swords size={18} />,     color: 'var(--color-neon-pink)' },
  { value: 'income',     label: 'BOTÍN',         icon: <PiggyBank size={18} />,  color: 'var(--color-neon-green)' },
  { value: 'transfer',   label: 'TRANSFERENCIA', icon: <ArrowLeftRight size={18} />, color: 'var(--color-neon-cyan)' },
  { value: 'investment', label: 'INVERSIÓN',     icon: <TrendingUp size={18} />, color: '#a855f7' },
]

export function TransactionForm({ accounts, categories, defaultCurrency = DEFAULT_CURRENCY, initialType = 'expense', onSuccess }: TransactionFormProps) {
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<TransactionType | 'investment'>(initialType)
  const [categoriesList, setCategoriesList] = useState<Category[]>(categories)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)

  useEffect(() => {
    setCategoriesList(categories)
  }, [categories])

  useEffect(() => {
    if (initialType) setMode(initialType)
  }, [initialType])

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
          income: '¡Botín añadido con éxito! 💰',
          expense: '¡Jefe pagado / Gasto registrado! ⚔️',
          transfer: 'Transferencia registrada ✓',
          investment: 'Inversión registrada ✓',
        }
        toast.success(labels[mode])
        resetForm()
        if (onSuccess) onSuccess()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="bg-[#181c31] border border-[#293056] rounded-[4px] p-5 shadow-sm font-mono">
      {/* Selector de tipo de transacción */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {MODE_OPTIONS.map(({ value, label, icon, color }) => (
          <button
            key={value}
            type="button"
            onClick={() => { setMode(value); setCategoryId(''); setTransferAccountId('') }}
            className={cn(
              'flex flex-col items-center gap-1.5 py-2.5 px-1.5 rounded-[4px]',
              'border transition-all duration-150 cursor-pointer text-xs font-bold tracking-wider',
              mode === value
                ? 'border-[#00FF66] bg-[#00FF66]/15 text-[#00FF66] shadow-[0_0_8px_rgba(0,255,102,0.3)]'
                : 'border-[#293056] text-[#8B92A9] hover:border-[#384277] hover:text-white hover:bg-[#20253f]'
            )}
            aria-pressed={mode === value}
          >
            {icon}
            <span className="text-[9px] leading-tight uppercase">{label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="px-4 py-3 rounded-[4px] bg-[rgba(255,77,109,0.15)] border border-[#ff4d6d]/40">
            <p className="text-xs text-[#ff4d6d] font-bold">{error}</p>
          </div>
        )}

        {/* Monto + moneda */}
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              id="tx-amount"
              label="MONTO ($)"
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
              label="MONEDA"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={CURRENCIES.map((c) => ({ value: c.code, label: c.code }))}
            />
          </div>
        </div>

        {/* Cuenta origen */}
        <Select
          id="tx-account"
          label={(mode === 'transfer' || mode === 'investment') ? 'CUENTA ORIGEN' : 'CUENTA'}
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          options={accounts.filter((a) => !a.archived).map((a) => ({ value: a.id, label: a.name }))}
          placeholder="Seleccioná una cuenta"
        />

        {/* Cuenta Destino (solo transferencias o inversiones) */}
        {(mode === 'transfer' || mode === 'investment') && (
          <Select
            id="tx-form-transfer-dest"
            label={mode === 'investment' ? 'CUENTA DESTINO (BROKER)' : 'CUENTA DESTINO'}
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
              <span className="text-xs font-bold text-[#8B92A9] uppercase tracking-wider">
                CATEGORÍA
              </span>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(true)}
                className="text-[11px] text-[#00FF66] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} /> NUEVA
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
          label="DESCRIPCIÓN DE LA MISIÓN"
          placeholder={
            mode === 'income' ? 'Ej: Recompensa de Caza / Salario' :
            mode === 'expense' ? 'Ej: Mana Potion / Café' :
            mode === 'investment' ? 'Ej: Mejora de Bóveda' :
            'Ej: Transferencia a Bóveda'
          }
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Fecha + método de pago */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="tx-date"
            label="FECHA"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <Select
            id="tx-payment-method"
            label="MÉTODO"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))}
            placeholder="Opcional"
          />
        </div>

        <button
          id="btn-submit-transaction"
          type="submit"
          disabled={isPending}
          className={cn(
            'py-3.5 px-4 rounded-[4px] text-xs font-bold font-mono tracking-widest uppercase mt-2 cursor-pointer w-full transition-all',
            mode === 'expense' ? 'btn-arcade-pink' : 'btn-arcade-green'
          )}
        >
          {isPending ? 'REGISTRANDO...' : `CONFIRMAR ${mode === 'expense' ? 'GASTO' : mode === 'income' ? 'BOTÍN' : mode === 'investment' ? 'INVERSIÓN' : 'TRANSFERENCIA'}`}
        </button>
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

'use client'

import { useState, useEffect, useTransition } from 'react'
import { cn, toISODate } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { createTransaction } from '@/actions/transactions'
import { createLoan } from '@/actions/loans'
import { CategoryForm } from '@/components/categories/category-form'
import { CURRENCIES, PAYMENT_METHODS, DEFAULT_CURRENCY } from '@/lib/constants'
import type { Account, Category, TransactionType, LoanType } from '@/types/database'
import { ArrowLeftRight, Plus, TrendingUp, PiggyBank, Swords, HandCoins, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

interface TransactionFormProps {
  accounts: Account[]
  categories: Category[]
  defaultCurrency?: string
  initialType?: TransactionType | 'investment' | 'loan'
  initialAccountId?: string
  onSuccess?: () => void
}

const MODE_OPTIONS: { value: TransactionType | 'investment' | 'loan'; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'expense',    label: 'GASTO',         icon: <Swords size={18} />,     color: 'var(--color-neon-pink)' },
  { value: 'income',     label: 'BOTÍN',         icon: <PiggyBank size={18} />,  color: 'var(--color-neon-green)' },
  { value: 'loan',       label: 'PRÉSTAMO',      icon: <HandCoins size={18} />,  color: '#00FF66' },
  { value: 'investment', label: 'INVERSIÓN',     icon: <TrendingUp size={18} />, color: '#a855f7' },
  { value: 'transfer',   label: 'TRANSFER.',     icon: <ArrowLeftRight size={18} />, color: 'var(--color-neon-cyan)' },
]

export function TransactionForm({ accounts, categories, defaultCurrency = DEFAULT_CURRENCY, initialType = 'expense', initialAccountId, onSuccess }: TransactionFormProps) {
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<TransactionType | 'investment' | 'loan'>(initialType)
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

  // Categorías según modo (income/investment usa categorías de ingreso o inversión)
  const filteredCategories = categoriesList.filter(
    (c) => c.kind === (mode === 'income' || mode === 'investment' ? 'income' : 'expense')
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
              ? '¡Préstamo otorgado registrado! (No descuenta saldo de cuenta)'
              : '¡Préstamo recibido registrado con éxito!'
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

    // Si es inversión: si seleccionó cuenta destino es transfer; sino es income (+ suma dinero a la cuenta seleccionada)
    const actualType: TransactionType = mode === 'investment'
      ? (transferAccountId ? 'transfer' : 'income')
      : mode

    startTransition(async () => {
      const result = await createTransaction({
        type: actualType,
        amount: numAmount,
        currency,
        account_id: accountId,
        category_id: actualType !== 'transfer' && categoryId ? categoryId : undefined,
        transfer_account_id: actualType === 'transfer' ? transferAccountId : undefined,
        description: description.trim() || (mode === 'investment' ? 'Inversión' : undefined),
        occurred_at: date,
        payment_method: paymentMethod || undefined,
      })

      if (result.success) {
        const labels: Record<TransactionType | 'investment', string> = {
          income: '¡Botín añadido con éxito! 💰',
          expense: '¡Jefe pagado / Gasto registrado! ⚔️',
          investment: '¡Inversión registrada / Saldo sumado! 📈',
          transfer: 'Transferencia registrada ✓',
        }
        toast.success(labels[mode as TransactionType | 'investment'])
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
      <div className="grid grid-cols-5 gap-1.5 mb-5">
        {MODE_OPTIONS.map(({ value, label, icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => { setMode(value); setCategoryId(''); setTransferAccountId('') }}
            className={cn(
              'flex flex-col items-center gap-1 py-2 px-1 rounded-[4px]',
              'border transition-all duration-150 cursor-pointer text-xs font-bold tracking-wider',
              mode === value
                ? 'border-[#00FF66] bg-[#00FF66]/15 text-[#00FF66] shadow-[0_0_8px_rgba(0,255,102,0.3)]'
                : 'border-[#293056] text-[#8B92A9] hover:border-[#384277] hover:text-white hover:bg-[#20253f]'
            )}
            aria-pressed={mode === value}
          >
            {icon}
            <span className="text-[8px] sm:text-[9px] leading-tight uppercase truncate">{label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="px-4 py-3 rounded-[4px] bg-[rgba(255,77,109,0.15)] border border-[#ff4d6d]/40">
            <p className="text-xs text-[#ff4d6d] font-bold">{error}</p>
          </div>
        )}

        {/* MODO PRÉSTAMO: Selector de tipo de préstamo y Persona */}
        {mode === 'loan' && (
          <div className="flex flex-col gap-3 bg-[#14182b] border border-[#293056] rounded-[4px] p-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLoanType('lent')}
                className={cn(
                  'py-2 px-2 rounded-[4px] text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 border transition-all cursor-pointer',
                  loanType === 'lent'
                    ? 'bg-[#00FF66] text-black border-[#00FF66] shadow-[0_0_8px_rgba(0,255,102,0.3)]'
                    : 'bg-[#181c31] text-[#8B92A9] border-[#293056] hover:text-white'
                )}
              >
                <ArrowUpRight size={14} className="stroke-[3]" />
                <span>PRESTÉ (ME DEBEN)</span>
              </button>

              <button
                type="button"
                onClick={() => setLoanType('borrowed')}
                className={cn(
                  'py-2 px-2 rounded-[4px] text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 border transition-all cursor-pointer',
                  loanType === 'borrowed'
                    ? 'bg-[#ff4d6d] text-white border-[#ff4d6d] shadow-[0_0_8px_rgba(255,77,109,0.3)]'
                    : 'bg-[#181c31] text-[#8B92A9] border-[#293056] hover:text-white'
                )}
              >
                <ArrowDownLeft size={14} className="stroke-[3]" />
                <span>ME PRESTARON (DEBO)</span>
              </button>
            </div>

            <Input
              id="loan-form-person"
              label={loanType === 'lent' ? '¿A QUIÉN LE PRESTASTE?' : '¿QUIÉN TE PRESTÓ?'}
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

        {/* Cuenta origen / destino / referencia */}
        <Select
          id="tx-account"
          label={
            mode === 'loan' ? 'CUENTA DE REFERENCIA (OPCIONAL)' :
            mode === 'transfer' ? 'CUENTA ORIGEN' :
            mode === 'investment' ? 'CUENTA O BÓVEDA' :
            'CUENTA'
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
            label="FECHA LÍMITE DE DEVOLUCIÓN (OPCIONAL)"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        )}

        {/* Cuenta Destino (transferencias o inversiones con broker) */}
        {(mode === 'transfer' || mode === 'investment') && (
          <Select
            id="tx-form-transfer-dest"
            label={mode === 'investment' ? 'TRANSFERIR A OTRA CUENTA / BROKER (OPCIONAL)' : 'CUENTA DESTINO'}
            value={transferAccountId}
            onChange={(e) => setTransferAccountId(e.target.value)}
            options={[
              { value: '', label: mode === 'investment' ? 'Sumar directamente a la cuenta elegida' : 'Seleccionar...' },
              ...transferDestAccounts.map((a) => ({ value: a.id, label: a.name })),
            ]}
          />
        )}

        {/* Categoría */}
        {(mode === 'expense' || mode === 'income' || mode === 'investment') && (
          <div className="flex flex-col gap-1.5 w-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#8B92A9] uppercase tracking-wider">
                CATEGORÍA {mode !== 'expense' && '(OPCIONAL)'}
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
          label="DESCRIPCIÓN DE LA MISIÓN"
          placeholder={
            mode === 'loan' ? 'Ej: Préstamo personal / Para compras' :
            mode === 'income' ? 'Ej: Recompensa de Caza / Salario' :
            mode === 'expense' ? 'Ej: Mana Potion / Café' :
            mode === 'investment' ? 'Ej: Inversión en Acciones / Plazo Fijo' :
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
            mode === 'expense' || (mode === 'loan' && loanType === 'borrowed') ? 'btn-arcade-pink' : 'btn-arcade-green'
          )}
        >
          {isPending
            ? 'REGISTRANDO...'
            : `CONFIRMAR ${
                mode === 'expense'
                  ? 'GASTO'
                  : mode === 'income'
                  ? 'BOTÍN'
                  : mode === 'investment'
                  ? 'INVERSIÓN'
                  : mode === 'loan'
                  ? 'PRÉSTAMO'
                  : 'TRANSFERENCIA'
              }`}
        </button>
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

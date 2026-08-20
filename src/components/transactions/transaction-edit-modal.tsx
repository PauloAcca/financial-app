'use client'

import { useState, useEffect, useTransition } from 'react'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { updateTransaction } from '@/actions/transactions'
import { CURRENCIES, PAYMENT_METHODS, DEFAULT_CURRENCY } from '@/lib/constants'
import type { Account, Category, Transaction, TransactionType } from '@/types/database'
import { cn } from '@/lib/utils'

interface TransactionEditModalProps {
  open: boolean
  onClose: () => void
  transaction: Transaction | null
  accounts: Account[]
  categories: Category[]
}

const TYPE_OPTIONS = [
  { value: 'expense', label: '⚔️ GASTO' },
  { value: 'income', label: '💰 BOTÍN / INGRESO' },
  { value: 'transfer', label: '🔄 TRANSFERENCIA' },
]

export function TransactionEditModal({
  open,
  onClose,
  transaction,
  accounts,
  categories,
}: TransactionEditModalProps) {
  const [isPending, startTransition] = useTransition()

  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY)
  const [type, setType] = useState<TransactionType>('expense')
  const [accountId, setAccountId] = useState('')
  const [transferAccountId, setTransferAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (transaction && open) {
      setAmount(transaction.amount.toString())
      setCurrency(transaction.currency || DEFAULT_CURRENCY)
      setType(transaction.type)
      setAccountId(transaction.account_id)
      setTransferAccountId(transaction.transfer_account_id ?? '')
      setCategoryId(transaction.category_id ?? '')
      setDescription(transaction.description ?? '')
      setDate(transaction.occurred_at)
      setPaymentMethod(transaction.payment_method ?? '')
      setError(null)
    }
  }, [transaction, open])

  const filteredCategories = categories.filter(
    (c) => c.kind === (type === 'income' ? 'income' : 'expense')
  )

  const sortedCategories: { value: string; label: string }[] = []
  const parents = filteredCategories.filter((c) => !c.parent_id)
  const children = filteredCategories.filter((c) => c.parent_id)

  parents.forEach((parent) => {
    sortedCategories.push({ value: parent.id, label: parent.name })
    const subcats = children.filter((c) => c.parent_id === parent.id)
    subcats.forEach((child) => {
      sortedCategories.push({ value: child.id, label: `— ${child.name}` })
    })
  })

  const transferDestAccounts = accounts.filter((a) => a.id !== accountId && !a.archived)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!transaction) return
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
    if ((type === 'expense' || type === 'income') && !categoryId) {
      setError('Seleccioná una categoría.')
      return
    }
    if (type === 'transfer' && !transferAccountId) {
      setError('Seleccioná la cuenta destino.')
      return
    }

    startTransition(async () => {
      const result = await updateTransaction({
        id: transaction.id,
        amount: numAmount,
        currency,
        type,
        account_id: accountId,
        category_id: type !== 'transfer' && categoryId ? categoryId : undefined,
        transfer_account_id: type === 'transfer' && transferAccountId ? transferAccountId : undefined,
        description: description.trim() || undefined,
        occurred_at: date,
        payment_method: paymentMethod || undefined,
      })

      if (result.success) {
        toast.success('Transacción actualizada con éxito.')
        onClose()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="EDITAR TRANSACCIÓN"
      description="Modificá los detalles de la misión o movimiento."
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-mono pt-2">
        {error && (
          <div className="px-4 py-3 rounded-[4px] bg-[rgba(255,77,109,0.15)] border border-[#ff4d6d]/40">
            <p className="text-xs text-[#ff4d6d] font-bold">{error}</p>
          </div>
        )}

        {/* Tipo */}
        <Select
          id="edit-tx-type"
          label="TIPO DE MOVIMIENTO"
          value={type}
          onChange={(e) => {
            setType(e.target.value as TransactionType)
            setCategoryId('')
          }}
          options={TYPE_OPTIONS}
        />

        {/* Monto + Moneda */}
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              id="edit-tx-amount"
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
              id="edit-tx-currency"
              label="MONEDA"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={CURRENCIES.map((c) => ({ value: c.code, label: c.code }))}
            />
          </div>
        </div>

        {/* Cuenta */}
        <Select
          id="edit-tx-account"
          label={type === 'transfer' ? 'CUENTA ORIGEN' : 'CUENTA'}
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          options={accounts.filter((a) => !a.archived).map((a) => ({ value: a.id, label: a.name }))}
        />

        {/* Cuenta Destino (solo transfer) */}
        {type === 'transfer' && (
          <Select
            id="edit-tx-transfer-dest"
            label="CUENTA DESTINO"
            value={transferAccountId}
            onChange={(e) => setTransferAccountId(e.target.value)}
            options={[
              { value: '', label: 'Seleccionar...' },
              ...transferDestAccounts.map((a) => ({ value: a.id, label: a.name })),
            ]}
          />
        )}

        {/* Categoría (solo gastos/ingresos) */}
        {type !== 'transfer' && (
          <Select
            id="edit-tx-category"
            label="CATEGORÍA"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            options={sortedCategories}
            placeholder="Seleccioná una categoría"
            required
          />
        )}

        {/* Descripción */}
        <Input
          id="edit-tx-desc"
          label="DESCRIPCIÓN"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Fecha + Medio de pago */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="edit-tx-date"
            label="FECHA"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <Select
            id="edit-tx-payment-method"
            label="MEDIO DE PAGO"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))}
            placeholder="Opcional"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-[4px] border border-[#293056] text-[#8B92A9] hover:text-white hover:bg-[#20253f] text-xs font-bold uppercase transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="btn-arcade-green px-5 py-2.5 rounded-[4px] text-xs font-bold text-black uppercase cursor-pointer"
          >
            {isPending ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

'use client'

import { useState, useEffect, useTransition } from 'react'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { createLoan, updateLoan } from '@/actions/loans'
import { CURRENCIES, DEFAULT_CURRENCY } from '@/lib/constants'
import { cn, toISODate } from '@/lib/utils'
import type { Loan, LoanType, Account } from '@/types/database'
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react'

interface LoanFormProps {
  open: boolean
  onClose: () => void
  editingLoan?: Loan | null
  initialType?: LoanType
  accounts?: Account[]
  onSuccess?: () => void
}

export function LoanForm({
  open,
  onClose,
  editingLoan,
  initialType = 'lent',
  accounts = [],
  onSuccess,
}: LoanFormProps) {
  const isEditing = !!editingLoan
  const [isPending, startTransition] = useTransition()

  const [type, setType] = useState<LoanType>(editingLoan?.type ?? initialType)
  const [personName, setPersonName] = useState(editingLoan?.person_name ?? '')
  const [amount, setAmount] = useState(editingLoan ? editingLoan.amount.toString() : '')
  const [currency, setCurrency] = useState(editingLoan?.currency ?? DEFAULT_CURRENCY)
  const [dueDate, setDueDate] = useState(editingLoan?.due_date ?? '')
  const [accountId, setAccountId] = useState(editingLoan?.account_id ?? '')
  const [description, setDescription] = useState(editingLoan?.description ?? '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (editingLoan) {
      setType(editingLoan.type)
      setPersonName(editingLoan.person_name)
      setAmount(editingLoan.amount.toString())
      setCurrency(editingLoan.currency || DEFAULT_CURRENCY)
      setDueDate(editingLoan.due_date || '')
      setAccountId(editingLoan.account_id || '')
      setDescription(editingLoan.description || '')
    } else {
      setType(initialType)
      setPersonName('')
      setAmount('')
      setCurrency(DEFAULT_CURRENCY)
      setDueDate('')
      setAccountId('')
      setDescription('')
    }
    setError(null)
  }, [editingLoan, initialType, open])

  function handleClose() {
    setError(null)
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const numAmount = parseFloat(amount)
    if (!personName.trim()) {
      setError('El nombre de la persona o contacto es obligatorio.')
      return
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('El monto debe ser un número válido mayor a cero.')
      return
    }

    startTransition(async () => {
      const result = isEditing
        ? await updateLoan({
            id: editingLoan!.id,
            person_name: personName,
            type,
            amount: numAmount,
            currency,
            due_date: dueDate || undefined,
            account_id: accountId || undefined,
            description: description || undefined,
          })
        : await createLoan({
            person_name: personName,
            type,
            amount: numAmount,
            currency,
            due_date: dueDate || undefined,
            account_id: accountId || undefined,
            description: description || undefined,
          })

      if (result.success) {
        toast.success(
          isEditing
            ? 'Préstamo actualizado.'
            : type === 'lent'
            ? 'Préstamo otorgado registrado (no descuenta de cuentas).'
            : 'Préstamo recibido registrado con éxito.'
        )
        handleClose()
        onSuccess?.()
      } else {
        setError(result.error)
      }
    })
  }

  const activeAccounts = accounts.filter((a) => !a.archived)

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditing ? 'Editar préstamo' : 'Nuevo préstamo / deuda'}
      description={
        isEditing
          ? 'Modificá los datos del préstamo registrado.'
          : 'Registrá un préstamo otorgado o recibido sin alterar el saldo de tus cuentas.'
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-mono">
        {error && (
          <div className="px-4 py-3 rounded-[4px] bg-[#ff4d6d]/15 border border-[#ff4d6d]/30 text-xs text-[#ff4d6d]">
            {error}
          </div>
        )}

        {/* Selector de Tipo: PRESTÉ vs ME PRESTARON */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-[#8B92A9] uppercase">
            Tipo de préstamo
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('lent')}
              className={cn(
                'py-2.5 px-3 rounded-[4px] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all cursor-pointer',
                type === 'lent'
                  ? 'bg-[#00FF66] text-black border-[#00FF66] shadow-[0_0_10px_rgba(0,255,102,0.3)]'
                  : 'bg-[#181c31] text-[#8B92A9] border-[#293056] hover:text-white'
              )}
            >
              <ArrowUpRight size={16} className="stroke-[3]" />
              <span>YO PRESTÉ (ME DEBEN)</span>
            </button>

            <button
              type="button"
              onClick={() => setType('borrowed')}
              className={cn(
                'py-2.5 px-3 rounded-[4px] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all cursor-pointer',
                type === 'borrowed'
                  ? 'bg-[#ff4d6d] text-white border-[#ff4d6d] shadow-[0_0_10px_rgba(255,77,109,0.3)]'
                  : 'bg-[#181c31] text-[#8B92A9] border-[#293056] hover:text-white'
              )}
            >
              <ArrowDownLeft size={16} className="stroke-[3]" />
              <span>ME PRESTARON (DEBO)</span>
            </button>
          </div>
        </div>

        {/* Nombre de la Persona */}
        <Input
          id="loan-person-name"
          label={type === 'lent' ? '¿A quién le prestaste?' : '¿Quién te prestó?'}
          placeholder='Ej: "Juan Perez", "Mamá", "Carlos Gómez"'
          value={personName}
          onChange={(e) => setPersonName(e.target.value)}
          required
        />

        {/* Monto y Moneda */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              id="loan-amount"
              label="Monto"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <Select
              id="loan-currency"
              label="Moneda"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={CURRENCIES.map((c) => ({ value: c.code, label: c.code }))}
            />
          </div>
        </div>

        {/* Fecha Límite / Estimada de Devolución */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            id="loan-due-date"
            label="Fecha límite (Opcional)"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            helper="Cuándo se espera que se devuelva"
          />

          {activeAccounts.length > 0 && (
            <Select
              id="loan-account-ref"
              label="Cuenta vinculada (Opcional)"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              options={[
                { value: '', label: 'Sin vincular' },
                ...activeAccounts.map((a) => ({ value: a.id, label: `${a.name} (${a.currency})` })),
              ]}
              helper="Referencia de dónde salió o entrará"
            />
          )}
        </div>

        {/* Descripción / Notas */}
        <Input
          id="loan-description"
          label="Concepto o notas (Opcional)"
          placeholder='Ej: "Cena del sábado", "Para el alquiler", "Préstamo personal"'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex justify-end gap-2.5 pt-3 border-t border-[#293056]">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-[4px] bg-[#181c31] border border-[#293056] text-[#8B92A9] text-xs font-bold uppercase hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className={cn(
              'px-4 py-2 rounded-[4px] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50',
              type === 'lent'
                ? 'bg-[#00FF66] text-black hover:bg-[#00cc52]'
                : 'bg-[#ff4d6d] text-white hover:bg-[#e03a58]'
            )}
          >
            {isPending ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Registrar Préstamo'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

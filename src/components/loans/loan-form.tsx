'use client'

import { useState, useEffect, useTransition } from 'react'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { createLoan, updateLoan } from '@/actions/loans'
import { CURRENCIES, DEFAULT_CURRENCY } from '@/lib/constants'
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="px-4 py-3 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] border border-[rgba(227,160,170,0.4)] text-xs text-[var(--color-danger)]">
            {error}
          </div>
        )}

        {/* Selector de Tipo: Presté vs Me prestaron */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">
            Tipo de préstamo
          </span>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={type === 'lent' ? 'primary' : 'secondary'}
              className="h-10"
              onClick={() => setType('lent')}
            >
              <ArrowUpRight size={16} />
              <span>Le presté (me deben)</span>
            </Button>

            <Button
              type="button"
              variant={type === 'borrowed' ? 'danger' : 'secondary'}
              className="h-10"
              onClick={() => setType('borrowed')}
            >
              <ArrowDownLeft size={16} />
              <span>Me prestaron (debo)</span>
            </Button>
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
            label="Fecha límite (opcional)"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            helper="Cuándo se espera que se devuelva"
          />

          {activeAccounts.length > 0 && (
            <Select
              id="loan-account-ref"
              label="Cuenta vinculada (opcional)"
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
          label="Concepto o notas (opcional)"
          placeholder='Ej: "Cena del sábado", "Para el alquiler", "Préstamo personal"'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex justify-end gap-2.5 pt-3 border-t border-[rgba(255,255,255,0.07)]">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant={type === 'lent' ? 'primary' : 'danger'}
            disabled={isPending}
          >
            {isPending ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Registrar préstamo'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

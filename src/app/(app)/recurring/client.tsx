'use client'

import { useState, useTransition } from 'react'
import { Plus, CheckCircle2, Clock, AlertCircle, ToggleLeft, ToggleRight, Trash2, Repeat, Pencil } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { markRecurringPaid, toggleRecurringActive, deleteRecurring, createRecurring, updateRecurring } from '@/actions/recurring'
import type { RecurringTransaction, RecurringTransactionPayment, Account, Category } from '@/types/database'
import type { RecurrenceFrequency, TransactionType } from '@/types/database'

interface RecurringClientProps {
  recurring: RecurringTransaction[]
  accounts: Pick<Account, 'id' | 'name' | 'type' | 'currency' | 'color' | 'icon'>[]
  categories: Pick<Category, 'id' | 'name' | 'kind' | 'color'>[]
  payments: RecurringTransactionPayment[]
  currentPeriod: string
  defaultCurrency: string
}

const FREQ_LABELS: Record<RecurrenceFrequency, string> = {
  daily:   'Diario',
  weekly:  'Semanal',
  monthly: 'Mensual',
  yearly:  'Anual',
}

const FREQ_OPTIONS = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'weekly',  label: 'Semanal' },
  { value: 'yearly',  label: 'Anual' },
  { value: 'daily',   label: 'Diario' },
]

const TYPE_OPTIONS = [
  { value: 'expense', label: 'Gasto' },
  { value: 'income',  label: 'Ingreso' },
]

function currentMonthLabel(period: string) {
  const [year, month] = period.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleString('es-AR', { month: 'long', year: 'numeric' })
}

export function RecurringClient({
  recurring,
  accounts,
  categories,
  payments,
  currentPeriod,
  defaultCurrency,
}: RecurringClientProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null)
  const [isPending, startTransition] = useTransition()

  // Form state
  const [formDesc,    setFormDesc]    = useState('')
  const [formAmount,  setFormAmount]  = useState('')
  const [formType,    setFormType]    = useState<TransactionType>('expense')
  const [formAccount, setFormAccount] = useState(accounts[0]?.id ?? '')
  const [formCat,     setFormCat]     = useState('')
  const [formFreq,    setFormFreq]    = useState<RecurrenceFrequency>('monthly')
  const [formDay,     setFormDay]     = useState('1')
  const [formNext,    setFormNext]    = useState('')
  const [formSub,     setFormSub]     = useState(false)
  const [formError,   setFormError]   = useState<string | null>(null)

  const paidIds = new Set(payments.filter(p => p.paid).map(p => p.recurring_transaction_id))

  const monthLabel = currentMonthLabel(currentPeriod)
  const active = recurring.filter(r => r.active)
  const inactive = recurring.filter(r => !r.active)

  function resetForm() {
    setFormDesc(''); setFormAmount(''); setFormType('expense')
    setFormAccount(accounts[0]?.id ?? ''); setFormCat('')
    setFormFreq('monthly'); setFormDay('1'); setFormNext('')
    setFormSub(false); setFormError(null); setEditingItem(null)
  }

  function handleOpenNew() {
    resetForm()
    setFormOpen(true)
  }

  function handleEdit(item: RecurringTransaction) {
    setEditingItem(item)
    setFormDesc(item.description)
    setFormAmount(item.amount.toString())
    setFormType(item.type)
    setFormAccount(item.account_id)
    setFormCat(item.category_id ?? '')
    setFormFreq(item.frequency)
    setFormDay(item.day_of_month?.toString() ?? '1')
    setFormNext(item.next_run_date)
    setFormSub(item.is_subscription)
    setFormError(null)
    setFormOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    const amt = parseFloat(formAmount)
    if (!formDesc.trim())        { setFormError('Ingresá una descripción.'); return }
    if (isNaN(amt) || amt <= 0)  { setFormError('Ingresá un monto válido.'); return }
    if (!formAccount)            { setFormError('Seleccioná una cuenta.'); return }
    if (!formNext)               { setFormError('Indicá la próxima fecha.'); return }

    startTransition(async () => {
      const payload = {
        description: formDesc,
        amount: amt,
        type: formType,
        account_id: formAccount,
        category_id: formCat || undefined,
        currency: accounts.find(a => a.id === formAccount)?.currency ?? defaultCurrency,
        frequency: formFreq,
        day_of_month: parseInt(formDay) || undefined,
        next_run_date: formNext,
        is_subscription: formSub,
      }

      const res = editingItem
        ? await updateRecurring({ id: editingItem.id, ...payload })
        : await createRecurring(payload)

      if (res.success) {
        toast.success(editingItem ? 'Gasto fijo actualizado.' : 'Gasto fijo creado.')
        setFormOpen(false)
        resetForm()
      } else {
        setFormError(res.error)
      }
    })
  }

  function handleMarkPaid(id: string) {
    startTransition(async () => {
      const res = await markRecurringPaid(id, currentPeriod)
      if (res.success) {
        toast.success('Marcado como pagado. Transacción generada.')
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      const res = await toggleRecurringActive(id, !current)
      if (res.success) {
        toast.success(current ? 'Desactivado.' : 'Activado.')
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('¿Eliminar este gasto fijo? Se borrarán también sus registros de pagos.')) return
    startTransition(async () => {
      const res = await deleteRecurring(id)
      if (res.success) toast.success('Eliminado.')
      else toast.error(res.error)
    })
  }

  const filteredCats = categories.filter(c => c.kind === formType)

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Gastos Fijos</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5 capitalize">
            {monthLabel} — {active.length} activo{active.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button id="btn-new-recurring" onClick={handleOpenNew}>
          <Plus size={16} /> Nuevo fijo
        </Button>
      </div>

      {/* Banner SQL */}
      <div className="mb-6 px-4 py-3 rounded-[var(--radius-md)] bg-amber-500/10 border border-amber-500/30 text-sm text-amber-400 flex gap-2">
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
        <span>
          Si es la primera vez que usás esta sección, corré el script SQL de la migración 005 en tu panel de Supabase para crear la tabla de pagos.
        </span>
      </div>

      {active.length === 0 && inactive.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center">
            <Repeat size={32} className="text-[var(--color-text-muted)]" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-[var(--color-text-primary)]">No tenés gastos fijos todavía</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">Agregá tus suscripciones, alquileres o cuotas.</p>
          </div>
          <Button id="btn-new-recurring-empty" onClick={handleOpenNew}>
            <Plus size={16} /> Agregar primero
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Activos */}
          {active.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Activos</h2>
              <div className="flex flex-col gap-3">
                {active.map(r => (
                  <RecurringCard
                    key={r.id}
                    item={r}
                    isPaid={paidIds.has(r.id)}
                    isPending={isPending}
                    onMarkPaid={() => handleMarkPaid(r.id)}
                    onEdit={() => handleEdit(r)}
                    onToggle={() => handleToggle(r.id, r.active)}
                    onDelete={() => handleDelete(r.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Inactivos */}
          {inactive.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Pausados</h2>
              <div className="flex flex-col gap-3">
                {inactive.map(r => (
                  <RecurringCard
                    key={r.id}
                    item={r}
                    isPaid={false}
                    isPending={isPending}
                    onMarkPaid={() => {}}
                    onEdit={() => handleEdit(r)}
                    onToggle={() => handleToggle(r.id, r.active)}
                    onDelete={() => handleDelete(r.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Modal nuevo / editar fijo */}
      <Modal open={formOpen} onClose={() => { setFormOpen(false); resetForm() }} title={editingItem ? 'Editar gasto fijo' : 'Nuevo gasto fijo'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          {formError && (
            <div className="px-4 py-3 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] border border-[var(--color-danger)]/30">
              <p className="text-sm text-[var(--color-danger)]">{formError}</p>
            </div>
          )}

          <Input id="rec-desc" label="Descripción" placeholder='Ej: "Netflix", "Alquiler"' value={formDesc} onChange={e => setFormDesc(e.target.value)} required />

          <div className="grid grid-cols-2 gap-3">
            <Select id="rec-type" label="Tipo" value={formType} onChange={e => setFormType(e.target.value as TransactionType)} options={TYPE_OPTIONS} />
            <Select id="rec-freq" label="Frecuencia" value={formFreq} onChange={e => setFormFreq(e.target.value as RecurrenceFrequency)} options={FREQ_OPTIONS} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input id="rec-amount" label="Monto" type="number" step="0.01" min="0.01" placeholder="0.00" value={formAmount} onChange={e => setFormAmount(e.target.value)} required />
            <Input id="rec-day" label="Día del mes" type="number" min="1" max="31" value={formDay} onChange={e => setFormDay(e.target.value)} helper="Opcional" />
          </div>

          <Select
            id="rec-account"
            label="Cuenta"
            value={formAccount}
            onChange={e => setFormAccount(e.target.value)}
            options={accounts.map(a => ({ value: a.id, label: a.name }))}
          />

          <Select
            id="rec-category"
            label="Categoría (opcional)"
            value={formCat}
            onChange={e => setFormCat(e.target.value)}
            options={[{ value: '', label: 'Sin categoría' }, ...filteredCats.map(c => ({ value: c.id, label: c.name }))]}
          />

          <Input id="rec-next" label="Próxima fecha" type="date" value={formNext} onChange={e => setFormNext(e.target.value)} required />

          <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] cursor-pointer select-none">
            <input type="checkbox" className="rounded" checked={formSub} onChange={e => setFormSub(e.target.checked)} />
            Es una suscripción
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => { setFormOpen(false); resetForm() }}>Cancelar</Button>
            <Button type="submit" loading={isPending}>{editingItem ? 'Guardar cambios' : 'Crear'}</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

// =========================================================
// Card de cada gasto fijo
// =========================================================
interface RecurringCardProps {
  item: RecurringTransaction
  isPaid: boolean
  isPending: boolean
  onMarkPaid: () => void
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}

function RecurringCard({ item, isPaid, isPending, onMarkPaid, onEdit, onToggle, onDelete }: RecurringCardProps) {
  const isExpense = item.type === 'expense'

  return (
    <div className={cn(
      'bg-[var(--color-surface)] border rounded-[var(--radius-lg)] p-4',
      'flex items-center gap-4',
      !item.active && 'opacity-50',
      isPaid ? 'border-[var(--color-income)]/30' : 'border-[var(--color-border)]'
    )}>
      {/* Estado de pago */}
      <div className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
        isPaid
          ? 'bg-[var(--color-income-subtle)] text-[var(--color-income)]'
          : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)]'
      )}>
        {isPaid ? <CheckCircle2 size={20} /> : <Clock size={20} />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-[var(--color-text-primary)] truncate">{item.description}</p>
          {item.is_subscription && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-medium shrink-0">SUB</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className={cn('text-sm font-semibold tabular-nums', isExpense ? 'text-[var(--color-expense)]' : 'text-[var(--color-income)]')}>
            {isExpense ? '−' : '+'}{formatCurrency(item.amount, item.currency)}
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">· {FREQ_LABELS[item.frequency]}</span>
          {(item as RecurringTransaction & { account?: { name: string } }).account && (
            <span className="text-xs text-[var(--color-text-muted)] truncate">
              · {(item as RecurringTransaction & { account?: { name: string } }).account?.name}
            </span>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 shrink-0">
        {item.active && !isPaid && (
          <Button
            id={`btn-mark-paid-${item.id}`}
            size="sm"
            variant="ghost"
            onClick={onMarkPaid}
            loading={isPending}
            className="text-[var(--color-income)] border border-[var(--color-income)]/30 hover:bg-[var(--color-income-subtle)]"
          >
            <CheckCircle2 size={14} />
            <span className="hidden sm:inline">Pagado</span>
          </Button>
        )}
        {isPaid && (
          <span className="text-xs text-[var(--color-income)] font-medium px-2 py-1 rounded bg-[var(--color-income-subtle)]">✓ Pagado</span>
        )}
        <button
          onClick={onEdit}
          disabled={isPending}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors p-1"
          title="Editar"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={onToggle}
          disabled={isPending}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors p-1"
          title={item.active ? 'Pausar' : 'Activar'}
        >
          {item.active ? <ToggleRight size={20} className="text-[var(--color-accent)]" /> : <ToggleLeft size={20} />}
        </button>
        <button
          onClick={onDelete}
          disabled={isPending}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors p-1"
          title="Eliminar"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

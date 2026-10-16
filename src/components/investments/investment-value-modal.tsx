'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { createInvestmentValuation } from '@/actions/investments'
import { cn, formatCurrency, toISODate } from '@/lib/utils'
import type { InvestmentPlatform } from '@/lib/investments'

interface InvestmentValueModalProps {
  open: boolean
  onClose: () => void
  platform: InvestmentPlatform | null
  onSuccess?: () => void
}

export function InvestmentValueModal({
  open,
  onClose,
  platform,
  onSuccess,
}: InvestmentValueModalProps) {
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState(() =>
    platform && platform.currentValue ? platform.currentValue.toString() : ''
  )
  const [date, setDate] = useState(() => toISODate(new Date()))
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!platform) return null

  const currency = platform.account.currency
  const preview = parseFloat(value)
  const previewGain = !isNaN(preview) ? preview - platform.capital : 0
  const previewPct =
    !isNaN(preview) && platform.capital > 0 ? (previewGain / platform.capital) * 100 : null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!platform) return

    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue < 0) {
      setError('Ingresá un valor válido (mayor o igual a cero).')
      return
    }

    const accountId = platform.account.id
    startTransition(async () => {
      const res = await createInvestmentValuation({
        account_id: accountId,
        value: numValue,
        currency,
        valued_at: date,
        notes: notes || undefined,
      })

      if (res.success) {
        toast.success('Valor actualizado. Ganancia recalculada.')
        onClose()
        onSuccess?.()
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Actualizar valor de la inversión"
      description={`¿Cuánto vale hoy "${platform.account.name}"?`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
        {error && (
          <div className="px-4 py-3 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] border border-[rgba(227,160,170,0.35)] text-xs text-[var(--color-danger)]">
            {error}
          </div>
        )}

        {/* Comparativa rápida */}
        <div className="grid grid-cols-3 gap-2 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-[var(--radius-md)] p-3">
          <div>
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">Aportado</p>
            <p className="text-xs font-semibold text-[var(--color-text-primary)] tabular-nums mt-0.5">
              {formatCurrency(platform.capital, currency)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">Valor actual</p>
            <p className="text-xs font-semibold text-[var(--color-transfer)] tabular-nums mt-0.5">
              {isNaN(preview) ? '—' : formatCurrency(preview, currency)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">Ganancia</p>
            <p
              className={cn(
                'text-xs font-semibold tabular-nums mt-0.5 flex items-center gap-1 flex-wrap',
                previewGain >= 0 ? 'text-[var(--color-income)]' : 'text-[var(--color-expense)]'
              )}
            >
              {isNaN(preview)
                ? '—'
                : `${previewGain >= 0 ? '+' : ''}${formatCurrency(previewGain, currency)}`}
              {!isNaN(preview) && previewPct !== null && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-px text-[0.625rem] font-medium tabular-nums',
                    previewGain >= 0
                      ? 'bg-[var(--color-income-subtle)] text-[var(--color-income)]'
                      : 'bg-[var(--color-expense-subtle)] text-[var(--color-expense)]'
                  )}
                >
                  {previewPct >= 0 ? '+' : ''}
                  {previewPct.toFixed(2)}%
                </span>
              )}
            </p>
          </div>
        </div>

        <Input
          id="valuation-value"
          label="Valor actual total"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          helper={`En ${currency}. Poné cuánto vale hoy la posición completa.`}
          required
        />

        <Input
          id="valuation-date"
          label="Fecha de la valuación"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <Input
          id="valuation-notes"
          label="Notas (opcional)"
          placeholder='Ej: "Cierre de mes", "Después del rally"'
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex justify-end gap-2.5 pt-3 border-t border-[rgba(255,255,255,0.06)]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isPending}>
            {isPending ? 'Guardando…' : 'Guardar valor'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

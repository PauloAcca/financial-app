'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { createInvestmentValuation } from '@/actions/investments'
import { formatCurrency, toISODate } from '@/lib/utils'
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
        toast.success('Valor actualizado. ¡Ganancia recalculada!')
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
      title="📈 ACTUALIZAR VALOR DE LA INVERSIÓN"
      description={`¿Cuánto vale hoy "${platform.account.name}"?`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-mono pt-2">
        {error && (
          <div className="px-4 py-3 rounded-[4px] bg-[#ff4d6d]/15 border border-[#ff4d6d]/30 text-xs text-[#ff4d6d]">
            {error}
          </div>
        )}

        {/* Comparativa rápida */}
        <div className="grid grid-cols-3 gap-2 bg-[#14182b] border border-[#293056] rounded-[4px] p-3">
          <div>
            <p className="text-[10px] text-[#8B92A9] uppercase">APORTADO</p>
            <p className="text-xs font-bold text-white tabular-nums mt-0.5">
              {formatCurrency(platform.capital, currency)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-[#8B92A9] uppercase">VALOR ACTUAL</p>
            <p className="text-xs font-bold text-[#38d9f5] tabular-nums mt-0.5">
              {isNaN(preview) ? '—' : formatCurrency(preview, currency)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-[#8B92A9] uppercase">GANANCIA</p>
            <p
              className={`text-xs font-bold tabular-nums mt-0.5 ${
                previewGain >= 0 ? 'text-[#00FF66]' : 'text-[#ff4d6d]'
              }`}
            >
              {isNaN(preview)
                ? '—'
                : `${previewGain >= 0 ? '+' : ''}${formatCurrency(previewGain, currency)}${
                    previewPct !== null ? ` (${previewPct >= 0 ? '+' : ''}${previewPct.toFixed(2)}%)` : ''
                  }`}
            </p>
          </div>
        </div>

        <Input
          id="valuation-value"
          label="VALOR ACTUAL TOTAL"
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
          label="FECHA DE LA VALUACIÓN"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <Input
          id="valuation-notes"
          label="NOTAS (OPCIONAL)"
          placeholder='Ej: "Cierre de mes", "Después del rally"'
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex justify-end gap-2.5 pt-3 border-t border-[#293056]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-[4px] bg-[#181c31] border border-[#293056] text-[#8B92A9] text-xs font-bold uppercase hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="btn-arcade-green px-4 py-2 rounded-[4px] text-xs font-bold text-black uppercase tracking-wider cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isPending ? 'Guardando...' : 'Guardar Valor'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

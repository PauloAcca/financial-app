'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { createTransaction } from '@/actions/transactions'
import { cn, toISODate } from '@/lib/utils'
import type { InvestmentPlatform } from '@/lib/investments'
import type { Account } from '@/types/database'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'

interface InvestmentContributionModalProps {
  open: boolean
  onClose: () => void
  platform: InvestmentPlatform | null
  accounts: Account[]
  onSuccess?: () => void
}

export function InvestmentContributionModal({
  open,
  onClose,
  platform,
  accounts,
  onSuccess,
}: InvestmentContributionModalProps) {
  const [isPending, startTransition] = useTransition()
  const [direction, setDirection] = useState<'in' | 'out'>('in')
  const [counterAccountId, setCounterAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(() => toISODate(new Date()))
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!platform) return null

  const currency = platform.account.currency
  const counterAccounts = accounts.filter((a) => a.id !== platform.account.id && !a.archived)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!platform) return

    const numAmount = parseFloat(amount)
    if (!counterAccountId) {
      setError(direction === 'in' ? 'Elegí la cuenta de donde sale el dinero.' : 'Elegí la cuenta donde entra el dinero.')
      return
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Ingresá un monto válido mayor a cero.')
      return
    }

    const investmentId = platform.account.id
    const isContribution = direction === 'in'

    startTransition(async () => {
      const res = await createTransaction({
        type: 'transfer',
        amount: numAmount,
        currency,
        account_id: isContribution ? counterAccountId : investmentId,
        transfer_account_id: isContribution ? investmentId : counterAccountId,
        occurred_at: date,
        description: description.trim() || (isContribution ? 'Aporte a inversión' : 'Retiro de inversión'),
      })

      if (res.success) {
        toast.success(isContribution ? '¡Aporte registrado!' : '¡Retiro registrado!')
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
      title={direction === 'in' ? '💰 REGISTRAR APORTE' : '💸 REGISTRAR RETIRO'}
      description={`Movimiento de dinero en "${platform.account.name}"`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-mono pt-2">
        {error && (
          <div className="px-4 py-3 rounded-[4px] bg-[#ff4d6d]/15 border border-[#ff4d6d]/30 text-xs text-[#ff4d6d]">
            {error}
          </div>
        )}

        {/* Dirección */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDirection('in')}
            className={cn(
              'py-2.5 px-3 rounded-[4px] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all cursor-pointer',
              direction === 'in'
                ? 'bg-[#00FF66] text-black border-[#00FF66] shadow-[0_0_10px_rgba(0,255,102,0.3)]'
                : 'bg-[#181c31] text-[#8B92A9] border-[#293056] hover:text-white'
            )}
          >
            <ArrowDownLeft size={16} className="stroke-[3]" />
            <span>APORTAR</span>
          </button>
          <button
            type="button"
            onClick={() => setDirection('out')}
            className={cn(
              'py-2.5 px-3 rounded-[4px] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all cursor-pointer',
              direction === 'out'
                ? 'bg-[#ff4d6d] text-white border-[#ff4d6d] shadow-[0_0_10px_rgba(255,77,109,0.3)]'
                : 'bg-[#181c31] text-[#8B92A9] border-[#293056] hover:text-white'
            )}
          >
            <ArrowUpRight size={16} className="stroke-[3]" />
            <span>RETIRAR</span>
          </button>
        </div>

        <Input
          id="contribution-amount"
          label="MONTO"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          helper={`En ${currency}`}
          required
        />

        <Select
          id="contribution-account"
          label={direction === 'in' ? 'CUENTA DE ORIGEN' : 'CUENTA DE DESTINO'}
          value={counterAccountId}
          onChange={(e) => setCounterAccountId(e.target.value)}
          options={[
            { value: '', label: 'Seleccionar...' },
            ...counterAccounts.map((a) => ({ value: a.id, label: `${a.name} (${a.currency})` })),
          ]}
        />

        <Input
          id="contribution-date"
          label="FECHA"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <Input
          id="contribution-desc"
          label="DESCRIPCIÓN (OPCIONAL)"
          placeholder='Ej: "Aporte mensual", "Rescate parcial"'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
            className={cn(
              'px-4 py-2 rounded-[4px] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50',
              direction === 'in' ? 'bg-[#00FF66] text-black hover:bg-[#00cc52]' : 'bg-[#ff4d6d] text-white hover:bg-[#e03a58]'
            )}
          >
            {isPending ? 'Registrando...' : direction === 'in' ? 'Registrar Aporte' : 'Registrar Retiro'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

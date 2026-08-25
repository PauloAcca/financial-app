'use client'

import { useState, useTransition } from 'react'
import { Plus, Wallet, RotateCw } from 'lucide-react'
import { AccountCard } from '@/components/accounts/account-card'
import { AccountDetail } from '@/components/accounts/account-detail'
import { AccountForm } from '@/components/accounts/account-form'
import { recalculateAccountBalances } from '@/actions/accounts'
import { toast } from '@/components/ui/toast'
import type { Account, Category, Transaction } from '@/types/database'

interface AccountsClientProps {
  accounts: Account[]
  categories?: Category[]
  transactions?: Transaction[]
}

export function AccountsClient({
  accounts,
  categories = [],
  transactions = [],
}: AccountsClientProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [isRecalculating, startRecalculate] = useTransition()

  const active = accounts.filter((a) => !a.archived)
  const archived = accounts.filter((a) => a.archived)

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) ?? null

  function handleEdit(account: Account) {
    setEditingAccount(account)
    setFormOpen(true)
  }

  function handleCloseForm() {
    setFormOpen(false)
    setEditingAccount(null)
  }

  function handleRecalculate() {
    startRecalculate(async () => {
      const res = await recalculateAccountBalances()
      if (res.success) {
        toast.success('Saldos recalculados según tus transacciones actuales.')
      } else {
        toast.error('Error al recalcular saldos.')
      }
    })
  }

  // Si hay una cuenta seleccionada, mostrar la vista detallada de la cuenta
  if (selectedAccount) {
    return (
      <>
        <AccountDetail
          account={selectedAccount}
          accounts={accounts}
          categories={categories}
          transactions={transactions}
          onBack={() => setSelectedAccountId(null)}
          onSelectAccount={(acc) => setSelectedAccountId(acc.id)}
          onEditAccount={handleEdit}
        />

        <AccountForm
          open={formOpen}
          onClose={handleCloseForm}
          editingAccount={editingAccount}
        />
      </>
    )
  }

  // Vista general de todas las cuentas
  return (
    <div className="flex flex-col gap-6 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide uppercase">
            CUENTAS Y BÓVEDAS
          </h1>
          <p className="text-xs text-[#8B92A9] mt-0.5">
            {active.length} cuenta{active.length !== 1 ? 's' : ''} activa{active.length !== 1 ? 's' : ''} • Tocá una cuenta para ver sus movimientos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="btn-recalculate-balances"
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className="p-2.5 sm:px-3 sm:py-2 rounded-[4px] bg-[#181c31] border border-[#293056] text-white text-xs font-bold tracking-wider uppercase hover:border-[#00FF66] hover:text-[#00FF66] transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-40"
            title="Recalcular saldos"
          >
            <RotateCw size={15} className={isRecalculating ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Recalcular</span>
          </button>
          <button
            id="btn-new-account"
            onClick={() => {
              setEditingAccount(null)
              setFormOpen(true)
            }}
            className="btn-arcade-green py-2 px-3.5 rounded-[4px] text-xs font-bold text-black flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
          >
            <Plus size={16} className="stroke-[3]" />
            <span>Nueva cuenta</span>
          </button>
        </div>
      </div>

      {/* Cuentas activas */}
      {active.length === 0 ? (
        <div className="bg-[#181c31] border border-[#293056] rounded-[4px] flex flex-col items-center justify-center py-16 px-4 gap-3 text-center">
          <div className="w-14 h-14 rounded-[4px] bg-[#14182b] border border-[#293056] flex items-center justify-center text-[#5d6786]">
            <Wallet size={28} />
          </div>
          <div>
            <p className="font-bold text-white text-sm uppercase tracking-wide">
              NO TENÉS CUENTAS REGISTRADAS
            </p>
            <p className="text-xs text-[#8B92A9] mt-1 max-w-xs">
              Agregá tu banco, efectivo, billetera virtual o broker para organizar tus finanzas.
            </p>
          </div>
          <button
            id="btn-new-account-empty"
            onClick={() => setFormOpen(true)}
            className="btn-arcade-green mt-2 py-2.5 px-4 rounded-[4px] text-xs font-bold text-black flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus size={16} />
            <span>AGREGAR PRIMERA CUENTA</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {active.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={handleEdit}
              onSelect={(acc) => setSelectedAccountId(acc.id)}
            />
          ))}
        </div>
      )}

      {/* Cuentas archivadas */}
      {archived.length > 0 && (
        <div className="mt-6 pt-6 border-t border-[#1e233f]">
          <h2 className="text-xs font-bold text-[#8B92A9] mb-3 uppercase tracking-widest flex items-center gap-2">
            <span>CUENTAS ARCHIVADAS ({archived.length})</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {archived.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onEdit={handleEdit}
                onSelect={(acc) => setSelectedAccountId(acc.id)}
              />
            ))}
          </div>
        </div>
      )}

      <AccountForm
        open={formOpen}
        onClose={handleCloseForm}
        editingAccount={editingAccount}
      />
    </div>
  )
}

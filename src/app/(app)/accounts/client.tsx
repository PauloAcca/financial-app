'use client'

import { useState, useTransition } from 'react'
import { Plus, Wallet, RotateCw } from 'lucide-react'
import { AccountCard } from '@/components/accounts/account-card'
import { AccountDetail } from '@/components/accounts/account-detail'
import { AccountForm } from '@/components/accounts/account-form'
import { recalculateAccountBalances } from '@/actions/accounts'
import { Button } from '@/components/ui/button'
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
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            Cuentas
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            {active.length} cuenta{active.length !== 1 ? 's' : ''} activa{active.length !== 1 ? 's' : ''} • Tocá una cuenta para ver sus movimientos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            id="btn-recalculate-balances"
            variant="secondary"
            size="sm"
            onClick={handleRecalculate}
            disabled={isRecalculating}
            title="Recalcular saldos"
          >
            <RotateCw size={15} className={isRecalculating ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Recalcular</span>
          </Button>
          <Button
            id="btn-new-account"
            size="sm"
            onClick={() => {
              setEditingAccount(null)
              setFormOpen(true)
            }}
          >
            <Plus size={16} className="stroke-[2.5]" />
            <span>Nueva cuenta</span>
          </Button>
        </div>
      </div>

      {/* Cuentas activas */}
      {active.length === 0 ? (
        <div className="glass rounded-[var(--radius-lg)] flex flex-col items-center justify-center py-16 px-4 gap-3 text-center">
          <div className="w-14 h-14 rounded-[var(--radius-full)] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[var(--color-text-muted)]">
            <Wallet size={28} />
          </div>
          <div>
            <p className="font-medium text-[var(--color-text-primary)] text-sm">
              No tenés cuentas registradas
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-xs">
              Agregá tu banco, efectivo, billetera virtual o broker para organizar tus finanzas.
            </p>
          </div>
          <Button
            id="btn-new-account-empty"
            className="mt-2"
            onClick={() => setFormOpen(true)}
          >
            <Plus size={16} />
            <span>Agregar primera cuenta</span>
          </Button>
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
        <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.06)]">
          <h2 className="text-xs font-medium text-[var(--color-text-secondary)] mb-3 flex items-center gap-2">
            <span>Cuentas archivadas ({archived.length})</span>
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

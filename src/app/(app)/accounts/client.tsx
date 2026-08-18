'use client'

import { useState } from 'react'
import { Plus, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AccountCard } from '@/components/accounts/account-card'
import { AccountForm } from '@/components/accounts/account-form'
import type { Account } from '@/types/database'

interface AccountsClientProps {
  accounts: Account[]
}

export function AccountsClient({ accounts }: AccountsClientProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)

  const active   = accounts.filter((a) => !a.archived)
  const archived = accounts.filter((a) => a.archived)

  function handleEdit(account: Account) {
    setEditingAccount(account)
    setFormOpen(true)
  }

  function handleCloseForm() {
    setFormOpen(false)
    setEditingAccount(null)
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Cuentas</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            {active.length} cuenta{active.length !== 1 ? 's' : ''} activa{active.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          id="btn-new-account"
          onClick={() => { setEditingAccount(null); setFormOpen(true) }}
        >
          <Plus size={16} />
          Nueva cuenta
        </Button>
      </div>

      {/* Cuentas activas */}
      {active.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center">
            <Wallet size={32} className="text-[var(--color-text-muted)]" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-[var(--color-text-primary)]">No tenés cuentas todavía</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Agregá tu banco, efectivo, Mercado Pago o tarjeta.
            </p>
          </div>
          <Button id="btn-new-account-empty" onClick={() => setFormOpen(true)}>
            <Plus size={16} />
            Agregar primera cuenta
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {active.map((account) => (
            <AccountCard key={account.id} account={account} onEdit={handleEdit} />
          ))}
        </div>
      )}

      {/* Cuentas archivadas */}
      {archived.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-medium text-[var(--color-text-muted)] mb-4 uppercase tracking-wider">
            Archivadas ({archived.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {archived.map((account) => (
              <AccountCard key={account.id} account={account} onEdit={handleEdit} />
            ))}
          </div>
        </div>
      )}

      <AccountForm
        open={formOpen}
        onClose={handleCloseForm}
        editingAccount={editingAccount}
      />
    </>
  )
}

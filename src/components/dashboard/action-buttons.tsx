'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PiggyBank, Swords, Plus, Mic, Keyboard } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { TransactionForm } from '@/components/transactions/transaction-form'
import type { Account, Category } from '@/types/database'

interface ActionButtonsProps {
  accounts?: Account[]
  categories?: Category[]
}

export function ActionButtons({ accounts = [], categories = [] }: ActionButtonsProps) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<'income' | 'expense'>('income')

  const handleOpen = (type: 'income' | 'expense') => {
    setSelectedType(type)
    setModalOpen(true)
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3.5 my-1">
        {/* BOTÓN 1: AÑADIR BOTÍN (VERDE NEÓN) */}
        <button
          onClick={() => handleOpen('income')}
          className="btn-arcade-green flex flex-col items-center justify-center gap-1.5 py-3.5 px-3 rounded-[4px] cursor-pointer"
        >
          <PiggyBank size={24} className="text-black stroke-[2.2]" />
          <span className="text-xs font-bold font-mono tracking-wider text-black">
            AÑADIR BOTÍN
          </span>
        </button>

        {/* BOTÓN 2: PAGAR JEFE (ROSA NEÓN) */}
        <button
          onClick={() => handleOpen('expense')}
          className="btn-arcade-pink flex flex-col items-center justify-center gap-1.5 py-3.5 px-3 rounded-[4px] cursor-pointer"
        >
          <Swords size={24} className="text-black stroke-[2.2]" />
          <span className="text-xs font-bold font-mono tracking-wider text-black">
            PAGAR JEFE
          </span>
        </button>
      </div>

      {/* Modal para ingresar Botín o Gasto */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedType === 'income' ? '💰 REGISTRAR BOTÍN' : '⚔️ PAGAR JEFE / GASTO'}
        size="md"
      >
        <div className="pt-2">
          <TransactionForm
            accounts={accounts}
            categories={categories}
            initialType={selectedType}
            onSuccess={() => {
              setModalOpen(false)
              router.refresh()
            }}
          />
        </div>
      </Modal>
    </>
  )
}

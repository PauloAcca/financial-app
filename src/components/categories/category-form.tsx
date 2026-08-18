'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { createCategory, updateCategory } from '@/actions/categories'
import { ACCOUNT_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Category, CategoryKind } from '@/types/database'

const KIND_OPTIONS = [
  { value: 'expense', label: 'Gasto' },
  { value: 'income',  label: 'Ingreso' },
]

interface CategoryFormProps {
  open: boolean
  onClose: () => void
  editingCategory?: Category | null
  defaultKind?: CategoryKind
}

export function CategoryForm({ open, onClose, editingCategory, defaultKind = 'expense' }: CategoryFormProps) {
  const isEditing = !!editingCategory
  const [isPending, startTransition] = useTransition()

  const [name, setName]   = useState(editingCategory?.name ?? '')
  const [kind, setKind]   = useState<CategoryKind>(editingCategory?.kind ?? defaultKind)
  const [color, setColor] = useState(editingCategory?.color ?? ACCOUNT_COLORS[0])
  const [error, setError] = useState<string | null>(null)

  function resetForm() {
    setName(editingCategory?.name ?? '')
    setKind(editingCategory?.kind ?? defaultKind)
    setColor(editingCategory?.color ?? ACCOUNT_COLORS[0])
    setError(null)
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) { setError('El nombre es obligatorio.'); return }

    startTransition(async () => {
      const result = isEditing
        ? await updateCategory({ id: editingCategory!.id, name, color })
        : await createCategory({ name, kind, color })

      if (result.success) {
        toast.success(isEditing ? 'Categoría actualizada.' : 'Categoría creada.')
        handleClose()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditing ? 'Editar categoría' : 'Nueva categoría'}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="px-4 py-3 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] border border-[var(--color-danger)]/30">
            <p className="text-sm text-[var(--color-danger)]">{error}</p>
          </div>
        )}

        <Input
          id="category-form-name"
          label="Nombre"
          placeholder='Ej: "Fútbol", "Mascotas", "Consultoría"'
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        {!isEditing && (
          <Select
            id="category-form-kind"
            label="Tipo"
            value={kind}
            onChange={(e) => setKind(e.target.value as CategoryKind)}
            options={KIND_OPTIONS}
          />
        )}

        {/* Color picker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--color-text-secondary)]">Color</label>
          <div className="flex flex-wrap gap-2">
            {ACCOUNT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  'w-6 h-6 rounded-full transition-all duration-150 cursor-pointer',
                  color === c
                    ? 'ring-2 ring-offset-2 ring-offset-[var(--color-surface)] ring-white scale-110'
                    : 'hover:scale-105'
                )}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={isPending}>
            {isEditing ? 'Guardar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

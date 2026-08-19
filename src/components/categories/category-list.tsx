'use client'

import { useState, useTransition } from 'react'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { deleteCategory } from '@/actions/categories'
import { toast } from '@/components/ui/toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CategoryForm } from './category-form'
import type { Category, CategoryKind } from '@/types/database'

interface CategoryListProps {
  categories: Category[]
}

interface CategoryRowProps {
  category: Category
  onEdit: (cat: Category) => void
}

function CategoryRow({ category, onEdit }: CategoryRowProps) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm(`¿Eliminás la categoría "${category.name}"? Las transacciones existentes quedarán sin categoría.`)) return

    startTransition(async () => {
      const result = await deleteCategory(category.id)
      if (result.success) toast.success('Categoría eliminada.')
      else toast.error(result.error)
    })
  }

  return (
    <div className="group flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-2)] transition-colors">
      {/* Color dot */}
      <div
        className="w-3 h-3 rounded-full shrink-0"
        style={{ backgroundColor: category.color ?? '#6B7280' }}
      />

      <span className="flex-1 text-sm text-[var(--color-text-primary)]">{category.name}</span>

      {category.is_system ? (
        <Badge variant="system">Sistema</Badge>
      ) : (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(category)}
            className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-muted)]
                       hover:bg-[var(--color-surface-3)] hover:text-[var(--color-text-primary)]
                       transition-colors cursor-pointer"
            aria-label={`Editar ${category.name}`}
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-muted)]
                       hover:bg-[var(--color-danger-subtle)] hover:text-[var(--color-danger)]
                       transition-colors cursor-pointer disabled:opacity-40"
            aria-label={`Eliminar ${category.name}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

function renderCategoryTree(categories: Category[], isSystem: boolean, onEdit: (cat: Category) => void) {
  // Obtenemos solo los padres que correspondan a esta sección (Sistema o Personalizadas)
  const parents = categories.filter(c => !c.parent_id && c.is_system === isSystem)
  
  if (parents.length === 0) return null

  return (
    <>
      {parents.map(parent => {
        // Buscamos los hijos en TODA la lista de esta categoría (sin importar si el hijo es de sistema o no)
        const subcategories = categories.filter(c => c.parent_id === parent.id)
        return (
          <div key={parent.id} className="flex flex-col">
            <CategoryRow category={parent} onEdit={onEdit} />
            {subcategories.map(child => (
              <div key={child.id} className="pl-6 border-l-2 border-l-[var(--color-border-subtle)] ml-5">
                <CategoryRow category={child} onEdit={onEdit} />
              </div>
            ))}
          </div>
        )
      })}
    </>
  )
}

interface SectionProps {
  title: string
  kind: CategoryKind
  categories: Category[]
  onAdd: (kind: CategoryKind) => void
  onEdit: (cat: Category) => void
}

function CategorySection({ title, kind, categories, onAdd, onEdit }: SectionProps) {
  const system = categories.filter((c) => c.is_system)
  const custom = categories.filter((c) => !c.is_system)
  const customParents = custom.filter(c => !c.parent_id)

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-[var(--color-text-primary)]">{title}</h2>
          <span className="text-xs text-[var(--color-text-muted)] tabular-nums">
            {categories.length}
          </span>
        </div>
        <Button
          id={`btn-add-category-${kind}`}
          variant="ghost"
          size="sm"
          onClick={() => onAdd(kind)}
        >
          <Plus size={14} />
          Agregar
        </Button>
      </div>

      <div className="divide-y divide-[var(--color-border-subtle)]">
        {categories.length === 0 ? (
          <p className="px-5 py-6 text-sm text-center text-[var(--color-text-muted)]">
            No hay categorías todavía.
          </p>
        ) : (
          <>
            {/* Categorías del sistema */}
            {system.length > 0 && (
              <div className="px-1 py-1">
                {renderCategoryTree(categories, true, onEdit)}
              </div>
            )}

            {/* Categorías del usuario */}
            {customParents.length > 0 && (
              <div className={cn('px-1 py-1', system.length > 0 && 'border-t border-[var(--color-border-subtle)]')}>
                {system.length > 0 && (
                  <p className="px-4 py-1.5 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                    Personalizadas
                  </p>
                )}
                {renderCategoryTree(categories, false, onEdit)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export function CategoryList({ categories }: CategoryListProps) {
  const [formOpen, setFormOpen]     = useState(false)
  const [defaultKind, setDefaultKind] = useState<CategoryKind>('expense')
  const [editingCat, setEditingCat] = useState<Category | null>(null)

  const income  = categories.filter((c) => c.kind === 'income')
  const expense = categories.filter((c) => c.kind === 'expense')

  function handleAdd(kind: CategoryKind) {
    setDefaultKind(kind)
    setEditingCat(null)
    setFormOpen(true)
  }

  function handleEdit(cat: Category) {
    setEditingCat(cat)
    setFormOpen(true)
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategorySection
          title="Gastos"
          kind="expense"
          categories={expense}
          onAdd={handleAdd}
          onEdit={handleEdit}
        />
        <CategorySection
          title="Ingresos"
          kind="income"
          categories={income}
          onAdd={handleAdd}
          onEdit={handleEdit}
        />
      </div>

      <CategoryForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingCat(null) }}
        editingCategory={editingCat}
        defaultKind={defaultKind}
        categories={categories}
      />
    </>
  )
}

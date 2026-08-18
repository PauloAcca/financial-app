import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CategoryList } from '@/components/categories/category-list'

export const metadata: Metadata = { title: 'Categorías' }

export default async function CategoriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Categorías del sistema (is_system=true, user_id=null) + las del usuario
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .or(`user_id.eq.${user!.id},is_system.eq.true`)
    .order('name', { ascending: true })

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Categorías</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
          Las categorías del sistema son compartidas. Podés agregar las tuyas propias.
        </p>
      </div>
      <CategoryList categories={categories ?? []} />
    </>
  )
}

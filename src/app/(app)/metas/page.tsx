'use client'

import { useState, useEffect } from 'react'
import { Trophy, Target, Plus, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'

interface Goal {
  id: string
  title: string
  category: string
  current: number
  target: number
  rewardXP: number
  color: string
}

export default function MetasPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [target, setTarget] = useState('')
  const [current, setCurrent] = useState('0')
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Cargar metas del usuario desde localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pixel_realm_goals')
      if (saved) {
        setGoals(JSON.parse(saved))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  const saveGoals = (newGoals: Goal[]) => {
    setGoals(newGoals)
    try {
      localStorage.setItem('pixel_realm_goals', JSON.stringify(newGoals))
    } catch (e) {
      console.error(e)
    }
  }

  function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !target) return

    const numTarget = parseFloat(target)
    const numCurrent = parseFloat(current) || 0
    if (isNaN(numTarget) || numTarget <= 0) {
      toast.error('Ingresá un monto objetivo válido')
      return
    }

    const newGoal: Goal = {
      id: Date.now().toString(),
      title,
      category: 'Meta de ahorro',
      current: numCurrent,
      target: numTarget,
      rewardXP: Math.round(numTarget * 0.1),
      color: '#8FCBB0',
    }

    const updated = [...goals, newGoal]
    saveGoals(updated)
    toast.success('Meta creada')
    setModalOpen(false)
    setTitle('')
    setTarget('')
    setCurrent('0')
  }

  function handleDeleteGoal(id: string) {
    if (!confirm('¿Eliminás esta meta?')) return
    const updated = goals.filter((g) => g.id !== id)
    saveGoals(updated)
    toast.success('Meta eliminada')
  }

  // Normalizar etiquetas de datos previos
  const displayCategory = (c: string) => (c === 'Misión de Ahorro' ? 'Meta de ahorro' : c)

  return (
    <div className="flex flex-col gap-5 max-w-md mx-auto w-full pb-6">
      {/* Crear nueva meta */}
      <Button
        onClick={() => setModalOpen(true)}
        size="lg"
        className="w-full"
        type="button"
      >
        <Plus size={17} className="stroke-[2.4]" />
        Nueva meta
      </Button>

      {/* Lista de metas */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)]">
            <Target size={14} />
            <span>Metas activas ({goals.length})</span>
          </div>
        </div>
        <div className="h-px bg-[rgba(255,255,255,0.07)] w-full" />

        {isLoaded && goals.length === 0 ? (
          <div className="glass rounded-[var(--radius-lg)] p-8 text-center flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-[var(--radius-full)] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[var(--color-text-muted)] mb-1">
              <Trophy size={20} />
            </div>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              Sin metas activas
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] max-w-xs">
              Creá tu primera meta de ahorro para seguir tu progreso con calma.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {goals.map((goal) => {
              const pct = Math.min(100, Math.round((goal.current / goal.target) * 100))

              return (
                <div
                  key={goal.id}
                  className="glass rounded-[var(--radius-lg)] p-4 flex flex-col gap-3 transition-all duration-300 hover:bg-[rgba(255,255,255,0.07)] hover:border-[rgba(255,255,255,0.14)] relative group"
                >
                  {/* Encabezado */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                        {goal.title}
                      </h3>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        {displayCategory(goal.category)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[var(--color-accent)] bg-[var(--color-accent-subtle)] px-2 py-0.5 rounded-[var(--radius-full)] tabular-nums">
                        +{goal.rewardXP.toLocaleString('es-AR')} XP
                      </span>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="p-1.5 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[rgba(227,160,170,0.1)] opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        title="Eliminar meta"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Montos y porcentaje */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--color-text-primary)] font-medium tabular-nums">
                      ${goal.current.toLocaleString('es-AR')}{' '}
                      <span className="text-[var(--color-text-secondary)]">
                        / ${goal.target.toLocaleString('es-AR')}
                      </span>
                    </span>
                    <span className="font-medium text-[var(--color-accent)] tabular-nums">{pct}%</span>
                  </div>

                  {/* Progreso */}
                  <div className="w-full bg-[rgba(255,255,255,0.06)] h-1.5 rounded-[var(--radius-full)] overflow-hidden">
                    <div
                      className="h-full transition-all duration-500 bg-[var(--color-accent)] rounded-[var(--radius-full)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Crear Meta */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva meta" size="sm">
        <form onSubmit={handleCreateGoal} className="flex flex-col gap-4 pt-2">
          <Input
            label="Nombre de la meta"
            placeholder="Ej: Fondo de emergencia"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Input
            label="Monto objetivo ($)"
            type="number"
            step="0.01"
            min="1"
            placeholder="Ej: 5000"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            required
          />

          <Input
            label="Monto ya ahorrado ($)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />

          <Button type="submit" size="lg" className="w-full mt-1">
            Crear meta
          </Button>
        </form>
      </Modal>
    </div>
  )
}

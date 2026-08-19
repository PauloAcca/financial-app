'use client'

import { useState, useEffect } from 'react'
import { Trophy, Target, Sparkles, Plus, Swords, Shield, Coins, CheckCircle2, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

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

  // Cargar metas reales del usuario desde localStorage
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
      category: 'Misión de Ahorro',
      current: numCurrent,
      target: numTarget,
      rewardXP: Math.round(numTarget * 0.1),
      color: '#00FF66',
    }

    const updated = [...goals, newGoal]
    saveGoals(updated)
    toast.success('¡Misión activada con éxito!')
    setModalOpen(false)
    setTitle('')
    setTarget('')
    setCurrent('0')
  }

  function handleDeleteGoal(id: string) {
    if (!confirm('¿Eliminás esta meta?')) return
    const updated = goals.filter(g => g.id !== id)
    saveGoals(updated)
    toast.success('Meta eliminada')
  }

  return (
    <div className="flex flex-col gap-5 max-w-md mx-auto w-full font-mono pb-6">
      {/* BOTÓN CREAR NUEVA META */}
      <button
        onClick={() => setModalOpen(true)}
        className="btn-arcade-green flex items-center justify-center gap-2 py-3.5 px-4 rounded-[4px] cursor-pointer shadow-sm"
      >
        <Plus size={18} className="text-black stroke-[3]" />
        <span className="text-xs font-bold font-mono tracking-widest text-black uppercase">
          NUEVA META / QUEST
        </span>
      </button>

      {/* LISTA DE QUESTS DE AHORRO REALES */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs font-bold tracking-widest uppercase">
          <div className="flex items-center gap-2 text-[#00FF66]">
            <Target size={14} />
            <span>MISIONES ACTIVAS ({goals.length})</span>
          </div>
        </div>
        <div className="h-px bg-[#293056] w-full" />

        {isLoaded && goals.length === 0 ? (
          <div className="bg-[#181c31] border border-[#293056] rounded-[4px] p-8 text-center flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-[4px] bg-[#14182b] border border-[#293056] flex items-center justify-center text-[#5d6786] mb-1">
              <Trophy size={22} />
            </div>
            <p className="text-xs font-bold text-white uppercase tracking-wide">
              NO TENÉS METAS ACTIVAS
            </p>
            <p className="text-[11px] text-[#8B92A9] max-w-xs">
              Creá tu primera misión de ahorro con el botón de arriba para seguir tu progreso.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {goals.map((goal) => {
              const pct = Math.min(100, Math.round((goal.current / goal.target) * 100))

              return (
                <div
                  key={goal.id}
                  className="bg-[#181c31] border border-[#293056] rounded-[4px] p-4 flex flex-col gap-3 hover:border-[#384277] transition-all relative group"
                >
                  {/* Header de la Meta */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-wide">
                        {goal.title}
                      </h3>
                      <p className="text-xs text-[#8B92A9] mt-0.5">
                        {goal.category}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#38d9f5] bg-[#14182b] border border-[#293056] px-2 py-0.5 rounded-[2px] tabular-nums">
                        +{goal.rewardXP} XP
                      </span>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="p-1 text-[#5d6786] hover:text-[#ff4d6d] opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Eliminar meta"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Montos y Porcentaje */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white font-bold tabular-nums">
                      ${goal.current.toLocaleString('es-AR')} <span className="text-[#8B92A9]">/ ${goal.target.toLocaleString('es-AR')}</span>
                    </span>
                    <span className="font-bold text-[#00FF66] tabular-nums">{pct}%</span>
                  </div>

                  {/* Barra de progreso */}
                  <div className="w-full bg-[#20253f] h-2.5 rounded-[2px] overflow-hidden border border-[#293056]">
                    <div
                      className="h-full transition-all duration-500 bg-[#00FF66] shadow-[0_0_8px_rgba(0,255,102,0.6)]"
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
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="NUEVA MISIÓN / META" size="sm">
        <form onSubmit={handleCreateGoal} className="flex flex-col gap-4 font-mono pt-2">
          <Input
            label="NOMBRE DE LA MISIÓN"
            placeholder="Ej: Bóveda Fondo de Emergencia"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Input
            label="MONTO OBJETIVO ($)"
            type="number"
            step="0.01"
            min="1"
            placeholder="Ej: 5000"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            required
          />

          <Input
            label="MONTO YA AHORRADO ($)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />

          <button
            type="submit"
            className="btn-arcade-green py-3 rounded-[4px] text-xs font-bold tracking-widest text-black uppercase mt-2 cursor-pointer"
          >
            ACTIVAR MISIÓN
          </button>
        </form>
      </Modal>
    </div>
  )
}

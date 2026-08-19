'use client'

import { useState } from 'react'
import { Trophy, Target, Sparkles, Plus, Swords, Shield, Coins, CheckCircle2 } from 'lucide-react'
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

  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Bóveda Fondo de Emergencia',
      category: 'Jefe Supremo (Ahorro)',
      current: 15000,
      target: 20000,
      rewardXP: 5000,
      color: '#00FF66',
    },
    {
      id: '2',
      title: 'Viaje a Tokio 2027',
      category: 'Misión Épica (Viajes)',
      current: 3200,
      target: 5000,
      rewardXP: 2500,
      color: '#38d9f5',
    },
    {
      id: '3',
      title: 'Mejora de Setup Cyberpunk',
      category: 'Equipo (Compras)',
      current: 850,
      target: 1200,
      rewardXP: 1000,
      color: '#ff4d6d',
    },
  ])

  function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !target) return

    const newGoal: Goal = {
      id: Date.now().toString(),
      title,
      category: 'Misión Secundaria',
      current: 0,
      target: parseFloat(target),
      rewardXP: Math.round(parseFloat(target) * 0.25),
      color: '#00FF66',
    }

    setGoals([...goals, newGoal])
    toast.success('¡Nueva meta creada!')
    setModalOpen(false)
    setTitle('')
    setTarget('')
  }

  return (
    <div className="flex flex-col gap-5 max-w-md mx-auto w-full font-mono pb-4">
      {/* 1. TARJETA PRINCIPAL: BOSS RAID */}
      <div className="crt-scanlines pixel-border-green rounded-[4px] p-5 shadow-[0_0_15px_rgba(0,255,102,0.2)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-[#00FF66] text-xs font-bold tracking-wider uppercase glow-text-green">
            <Swords size={16} />
            <span>BOSS RAID: FONDO DE RESERVA</span>
          </div>
          <span className="text-[10px] text-black font-bold bg-[#00FF66] px-2 py-0.5 rounded-[2px]">
            NIVEL 50
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-2">
          <div className="text-xl font-bold text-white tracking-tight">
            $15,000 <span className="text-xs text-[#8B92A9]">/ $20,000</span>
          </div>
          <span className="text-xs text-[#00FF66] font-bold">75% COMPLETADO</span>
        </div>

        {/* Barra de Vida / Progreso segmentada */}
        <div className="w-full bg-[#20253f] h-3.5 rounded-[2px] overflow-hidden border border-[#293056]">
          <div
            className="bg-[#00FF66] h-full shadow-[0_0_10px_rgba(0,255,102,0.7)] transition-all duration-500"
            style={{ width: '75%' }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#8B92A9] mt-3">
          <span>Recompensa al derrotar:</span>
          <span className="text-[#00FF66] font-bold">+5,000 XP • Trofeo Oro</span>
        </div>
      </div>

      {/* 2. BOTÓN CREAR NUEVA META */}
      <button
        onClick={() => setModalOpen(true)}
        className="btn-arcade-green flex items-center justify-center gap-2 py-3 px-4 rounded-[4px] cursor-pointer"
      >
        <Plus size={18} className="text-black stroke-[3]" />
        <span className="text-xs font-bold font-mono tracking-wider text-black uppercase">
          NUEVA META / QUEST
        </span>
      </button>

      {/* 3. LISTA DE QUESTS DE AHORRO */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[#00FF66] text-xs font-bold tracking-widest uppercase">
          <Target size={14} />
          <span>MISIONES ACTIVAS ({goals.length})</span>
        </div>
        <div className="h-px bg-[#293056] w-full" />

        <div className="flex flex-col gap-3">
          {goals.map((goal) => {
            const pct = Math.min(100, Math.round((goal.current / goal.target) * 100))

            return (
              <div
                key={goal.id}
                className="bg-[#181c31] border border-[#293056] rounded-[4px] p-4 flex flex-col gap-3 hover:border-[#384277] transition-all"
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

                  <span className="text-xs font-bold text-[#38d9f5] bg-[#14182b] border border-[#293056] px-2 py-0.5 rounded-[2px]">
                    +{goal.rewardXP} XP
                  </span>
                </div>

                {/* Montos y Porcentaje */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white font-bold tabular-nums">
                    ${goal.current.toLocaleString('es-AR')} <span className="text-[#8B92A9]">/ ${goal.target.toLocaleString('es-AR')}</span>
                  </span>
                  <span className="font-bold text-[#00FF66]">{pct}%</span>
                </div>

                {/* Barra de progreso */}
                <div className="w-full bg-[#20253f] h-2 rounded-[2px] overflow-hidden border border-[#293056]">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: goal.color,
                      boxShadow: `0 0 8px ${goal.color}`,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal Crear Meta */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="NUEVA MISIÓN / META" size="sm">
        <form onSubmit={handleCreateGoal} className="flex flex-col gap-4 font-mono pt-2">
          <Input
            label="NOMBRE DE LA META"
            placeholder="Ej: Bóveda Vacaciones"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Input
            label="MONTO OBJETIVO ($)"
            type="number"
            placeholder="5000"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            required
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

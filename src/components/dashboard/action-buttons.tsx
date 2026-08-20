'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PiggyBank, Swords, Mic, Square, Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { TransactionForm } from '@/components/transactions/transaction-form'
import { toast } from '@/components/ui/toast'
import type { Account, Category } from '@/types/database'
import type { Message } from '@/components/chat/chat-message'
import { cn } from '@/lib/utils'

interface ActionButtonsProps {
  accounts?: Account[]
  categories?: Category[]
}

export function ActionButtons({ accounts = [], categories = [] }: ActionButtonsProps) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<'income' | 'expense'>('income')

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const handleOpen = (type: 'income' | 'expense') => {
    setSelectedType(type)
    setModalOpen(true)
  }

  const handleVoiceClick = async () => {
    if (isProcessing) return

    if (isRecording) {
      // Detener grabación
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
    } else {
      // Iniciar grabación
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        chunksRef.current = []

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data)
        }

        mediaRecorder.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType })
          const reader = new FileReader()
          reader.readAsDataURL(blob)

          reader.onloadend = async () => {
            const base64data = (reader.result as string).split(',')[1]
            await processAudio({ base64: base64data, mimeType: mediaRecorder.mimeType })
          }

          // Liberar micrófono
          stream.getTracks().forEach((track) => track.stop())
        }

        mediaRecorder.start()
        setIsRecording(true)
        toast.info('🎙️ Grabando... Hablá claro (ej: "Gasté 5000 pesos en supermercado")')
      } catch (err) {
        console.error('Error accediendo al micrófono:', err)
        toast.error('No se pudo acceder al micrófono. Verificá los permisos del navegador.')
      }
    }
  }

  const processAudio = async (audioData: { base64: string; mimeType: string }) => {
    setIsProcessing(true)
    let transactionCreated = false
    let assistantMessage = ''

    const userMessage: Message = {
      role: 'user',
      content: '',
      audioData,
    }

    try {
      let history: Message[] = []
      const saved = localStorage.getItem('app_finanzas_chat_history')
      if (saved) {
        try {
          history = JSON.parse(saved) as Message[]
        } catch (e) {}
      }

      const updatedMessages = [...history, userMessage]

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiMessages = updatedMessages.map((m: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parts: any[] = []
        if (m.audioData) {
          parts.push({
            inlineData: {
              data: m.audioData.base64,
              mimeType: m.audioData.mimeType,
            },
          })
        }
        if (m.content) {
          parts.push({ text: m.content })
        } else if (m.audioData) {
          parts.push({ text: 'Analizá este audio para registrar la transacción' })
        }

        return {
          role: m.role === 'assistant' ? 'model' : 'user',
          parts,
        }
      })

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      })

      if (!res.ok || !res.body) throw new Error('Error al conectar con la IA.')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      const toolsUsed: string[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'text') assistantMessage += event.text
            if (event.type === 'tool' && !toolsUsed.includes(event.name)) toolsUsed.push(event.name)
            if (event.type === 'done' && event.transactionCreated) transactionCreated = true
          } catch {}
        }
      }

      const finalHistory = [
        ...updatedMessages,
        {
          role: 'assistant' as const,
          content: assistantMessage || 'Procesado correctamente.',
          isStreaming: false,
          toolsUsed,
        },
      ]
      localStorage.setItem('app_finanzas_chat_history', JSON.stringify(finalHistory))

      if (transactionCreated) {
        toast.success('¡Misión / Transacción registrada por voz con éxito! ⚡')
        router.refresh()
      } else {
        toast.info(assistantMessage ? `IA: ${assistantMessage}` : 'Audio procesado.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Hubo un problema procesando el audio.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col gap-2.5 my-1 font-mono">
      {/* FILA DE 2 BOTONES PRINCIPALES */}
      <div className="grid grid-cols-2 gap-3">
        {/* BOTÓN 1: AÑADIR BOTÍN (VERDE NEÓN) */}
        <button
          onClick={() => handleOpen('income')}
          className="btn-arcade-green flex flex-col items-center justify-center gap-1.5 py-3.5 px-3 rounded-[4px] cursor-pointer active:scale-95 transition-transform"
        >
          <PiggyBank size={24} className="text-black stroke-[2.2]" />
          <span className="text-xs font-bold tracking-wider text-black">
            AÑADIR BOTÍN
          </span>
        </button>

        {/* BOTÓN 2: PAGAR JEFE (ROSA NEÓN) */}
        <button
          onClick={() => handleOpen('expense')}
          className="btn-arcade-pink flex flex-col items-center justify-center gap-1.5 py-3.5 px-3 rounded-[4px] cursor-pointer active:scale-95 transition-transform"
        >
          <Swords size={24} className="text-black stroke-[2.2]" />
          <span className="text-xs font-bold tracking-wider text-black">
            PAGAR JEFE
          </span>
        </button>
      </div>

      {/* BOTÓN 3: REGISTRAR POR VOZ / AUDIO (PROMINENTE) */}
      <button
        onClick={handleVoiceClick}
        disabled={isProcessing}
        className={cn(
          'w-full py-3 px-4 rounded-[4px] flex items-center justify-center gap-2.5 transition-all duration-150 cursor-pointer border',
          isRecording
            ? 'bg-[#ff4d6d] text-white border-[#ff4d6d] shadow-[0_0_15px_rgba(255,77,109,0.5)] animate-pulse'
            : isProcessing
            ? 'bg-[#181c31] text-[#38d9f5] border-[#38d9f5]/50 opacity-80'
            : 'bg-[#181c31] border-[#38d9f5]/60 text-[#38d9f5] hover:bg-[#38d9f5]/15 hover:border-[#38d9f5] shadow-[0_0_10px_rgba(56,217,245,0.15)] active:scale-[0.99]'
        )}
      >
        {isProcessing ? (
          <>
            <Loader2 size={18} className="animate-spin text-[#38d9f5]" />
            <span className="text-xs font-bold tracking-wider uppercase">
              PROCESANDO AUDIO CON IA...
            </span>
          </>
        ) : isRecording ? (
          <>
            <Square size={18} fill="currentColor" />
            <span className="text-xs font-bold tracking-wider uppercase">
              GRABANDO... TOCÁ PARA FINALIZAR
            </span>
          </>
        ) : (
          <>
            <Mic size={18} className="stroke-[2.5]" />
            <span className="text-xs font-bold tracking-wider uppercase">
              🎙️ REGISTRAR GASTO POR VOZ
            </span>
          </>
        )}
      </button>

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
    </div>
  )
}

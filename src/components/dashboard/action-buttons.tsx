'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDownCircle, ArrowUpCircle, Mic, Square, Loader2 } from 'lucide-react'
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
        toast.info('Grabando… hablá claro (ej: "Gasté 5000 pesos en supermercado")')
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
        toast.success('Transacción registrada por voz')
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
    <div className="flex flex-col gap-2.5 my-1">
      {/* Acciones principales */}
      <div className="grid grid-cols-2 gap-3">
        {/* Agregar ingreso */}
        <button
          onClick={() => handleOpen('income')}
          className="bg-[#8FCBB0] text-[#0A0E14] flex flex-col items-center justify-center gap-1.5 py-4 px-3 rounded-[var(--radius-lg)] cursor-pointer active:translate-y-px transition-all duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_2px_10px_rgba(143,203,176,0.2)] hover:bg-[#A5D8C3]"
        >
          <ArrowDownCircle size={22} className="stroke-[2]" />
          <span className="text-sm font-semibold">Agregar ingreso</span>
        </button>

        {/* Registrar gasto */}
        <button
          onClick={() => handleOpen('expense')}
          className="glass text-[var(--color-expense)] flex flex-col items-center justify-center gap-1.5 py-4 px-3 rounded-[var(--radius-lg)] cursor-pointer active:translate-y-px transition-all duration-200 hover:border-[rgba(227,160,170,0.35)] hover:bg-[rgba(227,160,170,0.08)]"
        >
          <ArrowUpCircle size={22} className="stroke-[2]" />
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">Registrar gasto</span>
        </button>
      </div>

      {/* Registrar por voz */}
      <button
        onClick={handleVoiceClick}
        disabled={isProcessing}
        className={cn(
          'w-full py-3 px-4 rounded-[var(--radius-lg)] flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer border',
          isRecording
            ? 'bg-[var(--color-danger-subtle)] text-[var(--color-danger)] border-[rgba(227,160,170,0.45)] animate-pulse'
            : isProcessing
            ? 'glass text-[var(--color-text-secondary)] border-[rgba(255,255,255,0.09)] opacity-80'
            : 'glass text-[var(--color-accent)] hover:border-[rgba(143,203,176,0.4)] hover:bg-[rgba(143,203,176,0.07)] active:scale-[0.99]'
        )}
      >
        {isProcessing ? (
          <>
            <Loader2 size={17} className="animate-spin" />
            <span className="text-sm font-medium">Procesando audio…</span>
          </>
        ) : isRecording ? (
          <>
            <Square size={16} fill="currentColor" />
            <span className="text-sm font-medium">Grabando — tocá para finalizar</span>
          </>
        ) : (
          <>
            <Mic size={17} className="stroke-[2]" />
            <span className="text-sm font-medium">Registrar gasto por voz</span>
          </>
        )}
      </button>

      {/* Modal para ingreso o gasto */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedType === 'income' ? 'Agregar ingreso' : 'Registrar gasto'}
        size="md"
      >
        <div className="pt-1">
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

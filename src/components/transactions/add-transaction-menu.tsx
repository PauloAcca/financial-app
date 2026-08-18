'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Mic, Square, Loader2, Keyboard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/toast'
import { Modal } from '@/components/ui/modal'
import type { Message } from '@/components/chat/chat-message'

export function AddTransactionMenu() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const handleAudioClick = async () => {
    if (isProcessing) return

    if (isRecording) {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
    } else {
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
          
          stream.getTracks().forEach((track) => track.stop())
        }

        mediaRecorder.start()
        setIsRecording(true)
      } catch (err) {
        console.error(err)
        toast.error('No se pudo acceder al micrófono.')
      }
    }
  }

  const processAudio = async (audioData: { base64: string; mimeType: string }) => {
    setIsProcessing(true)
    let transactionCreated = false
    let assistantMessage = ''
    
    const userMessage: Message = { role: 'user', content: '', audioData }

    try {
      let history: Message[] = []
      const saved = localStorage.getItem('app_finanzas_chat_history')
      if (saved) {
        try { history = JSON.parse(saved) as Message[] } catch (e) {}
      }

      const updatedMessages = [...history, userMessage]
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiMessages = updatedMessages.map((m: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parts: any[] = []
        if (m.audioData) {
          parts.push({ inlineData: { data: m.audioData.base64, mimeType: m.audioData.mimeType } })
        }
        if (m.content) parts.push({ text: m.content })
        else if (m.audioData) parts.push({ text: 'Analizá este audio' })

        return { role: m.role === 'assistant' ? 'model' : 'user', parts }
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
        }
      ]
      localStorage.setItem('app_finanzas_chat_history', JSON.stringify(finalHistory))

      if (transactionCreated) {
        toast.success('¡Transacción registrada con éxito!')
        setOpen(false)
        router.refresh()
      } else {
        toast.info('La IA respondió, pero no registró una transacción.')
        setOpen(false)
      }
    } catch (err) {
      console.error(err)
      toast.error('Hubo un problema procesando el audio.')
    } finally {
      setIsProcessing(false)
    }
  }

  const isBusy = isRecording || isProcessing

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 h-10 px-4 rounded-[var(--radius-md)]
                   bg-[var(--color-accent)] text-white text-sm font-medium
                   hover:bg-[var(--color-accent-hover)] transition-colors
                   shadow-[0_0_16px_rgba(99,102,241,0.3)]"
      >
        <Plus size={16} />
        <span className="hidden sm:inline">Nueva transacción</span>
        <span className="sm:hidden">Agregar</span>
      </button>

      <Modal open={open} onClose={() => !isBusy && setOpen(false)} title="Agregar gasto" size="sm">
        <div className="grid grid-cols-2 gap-4 mt-4">
          <button
            onClick={() => {
              setOpen(false)
              router.push('/transactions')
            }}
            disabled={isBusy}
            className="flex flex-col items-center justify-center gap-3 p-6 rounded-[var(--radius-xl)]
                       border border-[var(--color-border)] bg-[var(--color-surface-2)]
                       hover:bg-[var(--color-surface-3)] transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-12 h-12 rounded-full bg-[var(--color-surface-3)] flex items-center justify-center text-[var(--color-text-secondary)]">
              <Keyboard size={24} />
            </div>
            <span className="text-sm font-medium text-[var(--color-text-primary)]">Manualmente</span>
          </button>

          <button
            onClick={handleAudioClick}
            disabled={isProcessing}
            className={cn(
              "flex flex-col items-center justify-center gap-3 p-6 rounded-[var(--radius-xl)]",
              "border transition-all duration-200 relative overflow-hidden",
              isRecording 
                ? "border-red-500 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.2)]" 
                : "border-[var(--color-border)] bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)]",
              isProcessing && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
              isRecording 
                ? "bg-red-500 text-white animate-pulse" 
                : "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]",
              isProcessing && "bg-transparent text-[var(--color-accent)]"
            )}>
              {isProcessing ? (
                <Loader2 size={24} className="animate-spin" />
              ) : isRecording ? (
                <Square size={20} fill="currentColor" />
              ) : (
                <Mic size={24} />
              )}
            </div>
            <span className="text-sm font-medium text-[var(--color-text-primary)] relative z-10">
              {isProcessing ? 'Procesando...' : isRecording ? 'Grabando...' : 'Por voz'}
            </span>
            
            {/* Animación de ondas cuando graba */}
            {isRecording && (
              <div className="absolute inset-0 bg-red-500/5 animate-[pulse_1.5s_ease-in-out_infinite]" />
            )}
          </button>
        </div>
        
        {isRecording && (
          <p className="text-center text-xs text-[var(--color-text-muted)] mt-6 animate-fade-in">
            Hablale a la IA detallando tu gasto. Volvé a presionar para enviar.
          </p>
        )}
      </Modal>
    </>
  )
}

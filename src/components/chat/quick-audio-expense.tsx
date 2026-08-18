'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Mic, Square, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/toast'
import type { Message } from '@/components/chat/chat-message'

export function QuickAudioExpense() {
  const router = useRouter()
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const handleClick = async () => {
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
          
          // Liberar recursos
          stream.getTracks().forEach((track) => track.stop())
        }

        mediaRecorder.start()
        setIsRecording(true)
      } catch (err) {
        console.error('Error accediendo al micrófono:', err)
        toast.error('No se pudo acceder al micrófono.')
      }
    }
  }

  const processAudio = async (audioData: { base64: string; mimeType: string }) => {
    setIsProcessing(true)
    let transactionCreated = false
    let assistantMessage = ''
    
    // Preparar mensaje local
    const userMessage: Message = { 
      role: 'user', 
      content: '', 
      audioData 
    }

    try {
      // 1. Obtener el historial de localStorage (si existe) para tener contexto
      let history: Message[] = []
      const saved = localStorage.getItem('app_finanzas_chat_history')
      if (saved) {
        try {
          history = JSON.parse(saved) as Message[]
        } catch (e) {}
      }

      const updatedMessages = [...history, userMessage]
      
      // 2. Construir el payload de la API
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
          parts.push({ text: 'Analizá este audio' })
        }

        return {
          role: m.role === 'assistant' ? 'model' : 'user',
          parts,
        }
      })

      // 3. Enviar a la API
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

      // 4. Guardar en localStorage la respuesta de la IA
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

      // 5. Notificar
      if (transactionCreated) {
        toast.success('¡Transacción registrada con éxito!')
        router.refresh() // Actualiza el dashboard
      } else {
        toast.info('La IA respondió, pero no registró una transacción.')
      }

    } catch (err) {
      console.error(err)
      toast.error('Hubo un problema procesando el audio.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isProcessing}
      className={cn(
        'inline-flex items-center gap-2 h-10 px-4 rounded-[var(--radius-md)]',
        'text-sm font-medium transition-all duration-200',
        'border border-[var(--color-border)] bg-[var(--color-surface-2)]',
        isRecording
          ? 'bg-red-500/10 text-red-500 border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.2)] animate-pulse'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-3)] hover:text-[var(--color-text-primary)]',
        isProcessing && 'opacity-70 cursor-not-allowed'
      )}
      title="Grabar gasto rápido por voz"
    >
      {isProcessing ? (
        <Loader2 size={16} className="animate-spin text-[var(--color-accent)]" />
      ) : isRecording ? (
        <Square size={16} fill="currentColor" />
      ) : (
        <Mic size={16} />
      )}
      <span className="hidden sm:inline">
        {isProcessing ? 'Procesando...' : isRecording ? 'Grabando...' : 'Gasto por voz'}
      </span>
      <span className="sm:hidden">
        {isProcessing ? 'Procesando' : isRecording ? 'Grabando' : 'Voz'}
      </span>
    </button>
  )
}

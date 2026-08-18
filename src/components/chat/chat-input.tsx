'use client'

import { useRef, useEffect, KeyboardEvent, useState } from 'react'
import { Send, Mic, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AudioData {
  base64: string
  mimeType: string
}

interface ChatInputProps {
  value: string
  onChange: (val: string) => void
  onSubmit: (audioData?: AudioData) => void
  isLoading: boolean
  placeholder?: string
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  placeholder = 'Escribí un mensaje...',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
  }, [value])

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isLoading && value.trim()) onSubmit()
    }
  }

  const handleMicClick = async () => {
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

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType })
          const reader = new FileReader()
          reader.readAsDataURL(blob)
          reader.onloadend = () => {
            const base64data = (reader.result as string).split(',')[1]
            onSubmit({ base64: base64data, mimeType: mediaRecorder.mimeType })
          }
          // Liberar recursos
          stream.getTracks().forEach((track) => track.stop())
        }

        mediaRecorder.start()
        setIsRecording(true)
      } catch (err) {
        console.error('Error accediendo al micrófono:', err)
        alert('No se pudo acceder al micrófono. Por favor, revisá los permisos de tu navegador.')
      }
    }
  }

  const canSubmit = !isLoading && value.trim().length > 0

  return (
    <div
      className={cn(
        'flex items-end gap-3 p-3 rounded-[var(--radius-lg)]',
        'bg-[var(--color-surface-2)] border',
        isRecording ? 'border-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]' : 'border-[var(--color-border)]',
        'transition-all duration-150',
        !isRecording && 'focus-within:border-[var(--color-accent)] focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.15)]'
      )}
    >
      <button
        onClick={handleMicClick}
        disabled={isLoading && !isRecording}
        className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
          'transition-all duration-150',
          isRecording
            ? 'bg-red-500 text-white animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.4)]'
            : 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-3)] hover:text-[var(--color-text-primary)]'
        )}
        aria-label={isRecording ? 'Detener grabación' : 'Grabar mensaje de voz'}
      >
        {isRecording ? <Square size={16} fill="currentColor" /> : <Mic size={18} />}
      </button>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isRecording ? 'Grabando audio...' : placeholder}
        disabled={isLoading || isRecording}
        rows={1}
        className={cn(
          'flex-1 resize-none bg-transparent outline-none self-center',
          'text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
          'leading-relaxed max-h-[200px] overflow-y-auto pt-1',
          'disabled:opacity-50'
        )}
        style={{ scrollbarWidth: 'thin' }}
      />
      <button
        onClick={() => onSubmit()}
        disabled={!canSubmit}
        className={cn(
          'w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center shrink-0',
          'transition-all duration-150',
          canSubmit
            ? 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] shadow-[0_0_12px_rgba(99,102,241,0.4)]'
            : 'bg-[var(--color-surface-3)] text-[var(--color-text-muted)] cursor-not-allowed'
        )}
        aria-label="Enviar mensaje"
      >
        <Send size={16} />
      </button>
    </div>
  )
}

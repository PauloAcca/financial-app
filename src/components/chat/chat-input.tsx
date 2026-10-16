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
  placeholder = 'Escribí tu mensaje…',
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
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
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
        'flex items-center gap-2 p-1.5 rounded-[var(--radius-full)] glass-soft',
        isRecording
          ? 'border-[rgba(227,160,170,0.45)]'
          : 'focus-within:border-[rgba(143,203,176,0.5)]',
        'transition-all duration-150'
      )}
    >
      {/* Botón Micrófono */}
      <button
        onClick={handleMicClick}
        disabled={isLoading && !isRecording}
        className={cn(
          'w-9 h-9 rounded-[var(--radius-full)] flex items-center justify-center shrink-0 cursor-pointer',
          'transition-all duration-150',
          isRecording
            ? 'bg-[var(--color-danger-subtle)] text-[var(--color-danger)] border border-[rgba(227,160,170,0.45)] animate-pulse'
            : 'bg-[rgba(255,255,255,0.06)] text-[var(--color-info)] border border-[rgba(255,255,255,0.09)] hover:border-[rgba(166,185,232,0.4)] hover:bg-[rgba(255,255,255,0.1)]'
        )}
        aria-label={isRecording ? 'Detener grabación' : 'Grabar mensaje de voz'}
      >
        {isRecording ? <Square size={16} fill="currentColor" /> : <Mic size={18} />}
      </button>

      {/* Input Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isRecording ? 'Grabando…' : placeholder}
        disabled={isLoading || isRecording}
        rows={1}
        className={cn(
          'flex-1 resize-none bg-transparent focus:outline-none outline-none self-center',
          'text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
          'leading-relaxed max-h-[120px] overflow-y-auto py-1 px-1',
          'disabled:opacity-50'
        )}
        style={{ scrollbarWidth: 'thin' }}
      />

      {/* Botón Enviar */}
      <button
        onClick={() => onSubmit()}
        disabled={!canSubmit}
        className={cn(
          'w-9 h-9 rounded-[var(--radius-full)] flex items-center justify-center shrink-0',
          'transition-all duration-150',
          canSubmit
            ? 'bg-[var(--color-accent)] text-[#0A0E14] hover:bg-[var(--color-accent-hover)] active:scale-95 cursor-pointer'
            : 'bg-[rgba(255,255,255,0.06)] text-[var(--color-text-muted)] border border-[rgba(255,255,255,0.09)] cursor-not-allowed'
        )}
        aria-label="Enviar mensaje"
      >
        <Send size={16} className={canSubmit ? 'stroke-[2.5]' : ''} />
      </button>
    </div>
  )
}

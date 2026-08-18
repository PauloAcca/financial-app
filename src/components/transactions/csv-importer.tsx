'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, Loader2, CheckCircle2 } from 'lucide-react'
import Papa from 'papaparse'
import { cn } from '@/lib/utils'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/components/ui/toast'
import type { Account } from '@/types/database'
import { importCsvTransactions } from '@/actions/import'

interface CsvImporterProps {
  accounts: Account[]
}

export function CsvImporter({ accounts }: CsvImporterProps) {
  const [open, setOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!selectedAccountId) {
      toast.error('Por favor, selecciona una cuenta de destino primero.')
      return
    }

    setIsProcessing(true)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          // Validar que las columnas esperadas existan
          const rows = results.data as any[]
          if (rows.length === 0) {
            toast.error('El archivo CSV está vacío.')
            return
          }

          const firstRow = rows[0]
          if (!firstRow.Fecha || !firstRow.Monto) {
            toast.error('El CSV no tiene el formato correcto. Faltan columnas (Fecha, Monto).')
            return
          }

          const res = await importCsvTransactions(rows, selectedAccountId)
          
          if (res?.error) {
            toast.error(res.error)
          } else if (res?.success) {
            toast.success(`Se importaron ${res.count} transacciones exitosamente.`)
            if (res.newCategories > 0) {
              toast.info(`Se crearon ${res.newCategories} categorías nuevas.`)
            }
            setOpen(false)
          }
        } catch (error) {
          console.error(error)
          toast.error('Ocurrió un error inesperado al procesar el archivo.')
        } finally {
          setIsProcessing(false)
          if (fileInputRef.current) fileInputRef.current.value = ''
        }
      },
      error: (error) => {
        toast.error('Error al leer el archivo CSV: ' + error.message)
        setIsProcessing(false)
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 h-9 px-3 rounded-[var(--radius-md)]
                   bg-[var(--color-surface-2)] border border-[var(--color-border)]
                   text-sm font-medium text-[var(--color-text-secondary)]
                   hover:bg-[var(--color-surface-3)] hover:text-[var(--color-text-primary)]
                   transition-colors"
      >
        <Upload size={16} />
        <span className="hidden sm:inline">Importar CSV</span>
      </button>

      <Modal open={open} onClose={() => !isProcessing && setOpen(false)} title="Importar Transacciones" size="sm">
        <div className="flex flex-col gap-4 mt-2">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Sube un archivo <strong>.csv</strong> con tus gastos. Asegúrate de que tenga las columnas: <br/>
            <code className="text-xs bg-[var(--color-surface-3)] px-1 py-0.5 rounded">Fecha</code>, 
            <code className="text-xs bg-[var(--color-surface-3)] px-1 py-0.5 rounded ml-1">Descripción</code>, 
            <code className="text-xs bg-[var(--color-surface-3)] px-1 py-0.5 rounded ml-1">Monto</code>, 
            <code className="text-xs bg-[var(--color-surface-3)] px-1 py-0.5 rounded ml-1">Categoría</code>
          </p>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">
              Cuenta de destino
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              disabled={isProcessing || accounts.length === 0}
              className="w-full h-10 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)]
                         border border-[var(--color-border)] text-sm outline-none
                         focus:border-[var(--color-accent)] transition-colors"
            >
              <option value="" disabled>Seleccioná una cuenta</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.currency})
                </option>
              ))}
            </select>
          </div>

          <div 
            className={cn(
              "border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)] p-8",
              "flex flex-col items-center justify-center gap-3 text-center transition-colors",
              isProcessing ? "opacity-50" : "hover:border-[var(--color-accent)] cursor-pointer"
            )}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
          >
            {isProcessing ? (
              <Loader2 size={32} className="animate-spin text-[var(--color-accent)]" />
            ) : (
              <FileText size={32} className="text-[var(--color-text-muted)]" />
            )}
            <div className="text-sm">
              {isProcessing ? (
                <span className="text-[var(--color-text-primary)] font-medium">Procesando archivo...</span>
              ) : (
                <>
                  <span className="font-semibold text-[var(--color-accent)]">Haz clic para subir</span>
                  <span className="text-[var(--color-text-secondary)]"> o arrastra un archivo</span>
                </>
              )}
            </div>
          </div>

          <input
            type="file"
            accept=".csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={isProcessing}
          />
        </div>
      </Modal>
    </>
  )
}

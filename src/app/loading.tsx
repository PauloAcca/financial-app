import { BrandMark } from '@/components/ui/brand'

export default function RootLoading() {
  return (
    <div className="fixed inset-0 bg-[#0A0E14] flex flex-col items-center justify-center z-50 p-4 select-none">
      <div className="glass rounded-[var(--radius-xl)] px-10 py-9 max-w-xs w-full flex flex-col items-center text-center animate-scale-in">
        {/* Isotipo */}
        <div className="mb-4 animate-fade-in">
          <BrandMark size={56} />
        </div>

        {/* Marca */}
        <h2 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-text-primary)] mb-1">
          Aura
        </h2>
        <p className="text-xs font-medium tracking-[0.18em] text-[var(--color-text-muted)] mb-7">
          FINANZAS
        </p>

        {/* Barra de progreso sutil */}
        <div className="w-full h-1 rounded-[var(--radius-full)] bg-[rgba(255,255,255,0.06)] overflow-hidden">
          <div className="skeleton h-full w-full rounded-[var(--radius-full)]" />
        </div>

        <p className="mt-5 text-xs text-[var(--color-text-secondary)]">
          Cargando…
        </p>
      </div>
    </div>
  )
}

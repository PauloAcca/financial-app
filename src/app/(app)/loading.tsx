export default function Loading() {
  return (
    <div className="flex flex-col gap-4 max-w-md mx-auto w-full select-none">
      {/* 1. Skeleton de tarjeta principal */}
      <div className="glass rounded-[var(--radius-lg)] p-5 h-44 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="skeleton h-3.5 w-28" />
          <div className="skeleton h-5 w-20" />
        </div>
        <div className="skeleton h-9 w-48" />
        <div className="skeleton h-1.5 w-full rounded-[var(--radius-full)]" />
      </div>

      {/* 2. Skeleton de tarjeta secundaria */}
      <div className="glass rounded-[var(--radius-lg)] p-4 h-16 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-3.5 w-20" />
        </div>
        <div className="skeleton h-1 w-full rounded-[var(--radius-full)]" />
      </div>

      {/* 3. Skeleton de botones de acción */}
      <div className="grid grid-cols-2 gap-3 my-0.5">
        <div className="glass h-16 rounded-[var(--radius-lg)] flex items-center justify-center">
          <div className="skeleton h-4 w-24" />
        </div>
        <div className="glass h-16 rounded-[var(--radius-lg)] flex items-center justify-center">
          <div className="skeleton h-4 w-24" />
        </div>
      </div>

      {/* 4. Skeleton de botón de voz */}
      <div className="glass h-12 rounded-[var(--radius-lg)] flex items-center justify-center">
        <div className="skeleton h-3.5 w-44" />
      </div>

      {/* 5. Skeleton de lista de actividad */}
      <div className="glass rounded-[var(--radius-lg)] p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.06)]">
          <div className="skeleton h-4 w-36" />
          <div className="skeleton h-3 w-16" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.04)] last:border-0"
          >
            <div className="flex items-center gap-3">
              <div className="skeleton w-10 h-10 rounded-[var(--radius-sm)]" />
              <div className="flex flex-col gap-1.5">
                <div className="skeleton h-3.5 w-32" />
                <div className="skeleton h-2.5 w-20" />
              </div>
            </div>
            <div className="skeleton h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}

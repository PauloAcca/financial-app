export default function Loading() {
  return (
    <div className="flex flex-col gap-4 max-w-md mx-auto w-full font-mono animate-pulse select-none">
      {/* 1. Skeleton de Tarjeta Principal con Scanlines */}
      <div className="crt-scanlines border-2 border-[#00FF66]/40 rounded-[4px] p-5 h-40 flex flex-col justify-between shadow-[0_0_15px_rgba(0,255,102,0.15)]">
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 bg-[#20253f] rounded-[2px]" />
          <div className="h-5 w-20 bg-[#00FF66]/20 border border-[#00FF66]/40 rounded-[2px]" />
        </div>
        <div className="h-9 w-48 bg-[#00FF66]/20 rounded-[2px] shadow-[0_0_8px_rgba(0,255,102,0.3)]" />
        <div className="grid grid-cols-10 gap-1.5 h-3.5 w-full">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="h-full bg-[#20253f] rounded-[1px] border border-[#293056]"
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
      </div>

      {/* 2. Skeleton de Tarjeta Secundaria (XP / Gastado Hoy) */}
      <div className="bg-[#181c31] border border-[#38d9f5]/30 rounded-[4px] p-4 h-16 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="h-3.5 w-24 bg-[#38d9f5]/20 rounded-[2px]" />
          <div className="h-3.5 w-20 bg-[#20253f] rounded-[2px]" />
        </div>
        <div className="grid grid-cols-10 gap-1.5 h-2 w-full">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-full bg-[#20253f] rounded-[1px]" />
          ))}
        </div>
      </div>

      {/* 3. Skeleton de Botones de Acción */}
      <div className="grid grid-cols-2 gap-3 my-0.5">
        <div className="h-16 bg-[#00FF66]/15 border-2 border-[#00FF66]/40 rounded-[4px] flex items-center justify-center">
          <div className="h-4 w-24 bg-[#00FF66]/30 rounded-[2px]" />
        </div>
        <div className="h-16 bg-[#ff4d6d]/15 border-2 border-[#ff4d6d]/40 rounded-[4px] flex items-center justify-center">
          <div className="h-4 w-24 bg-[#ff4d6d]/30 rounded-[2px]" />
        </div>
      </div>

      {/* 4. Skeleton de Botón de Voz */}
      <div className="h-11 bg-[#181c31] border border-[#38d9f5]/40 rounded-[4px] flex items-center justify-center">
        <div className="h-3.5 w-44 bg-[#38d9f5]/20 rounded-[2px]" />
      </div>

      {/* 5. Skeleton de Lista de Misiones / Transacciones */}
      <div className="bg-[#181c31] border border-[#293056] rounded-[4px] p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#232845]">
          <div className="h-4 w-36 bg-[#20253f] rounded-[2px]" />
          <div className="h-3 w-16 bg-[#20253f] rounded-[2px]" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-[#20253f] last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#14182b] border border-[#293056] rounded-[4px]" />
              <div className="flex flex-col gap-1.5">
                <div className="h-3.5 w-32 bg-[#20253f] rounded-[2px]" />
                <div className="h-2.5 w-20 bg-[#20253f] rounded-[2px]" />
              </div>
            </div>
            <div className="h-4 w-20 bg-[#20253f] rounded-[2px]" />
          </div>
        ))}
      </div>
    </div>
  )
}

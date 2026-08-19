export default function Loading() {
  return (
    <div className="flex flex-col gap-4 max-w-md mx-auto w-full font-mono animate-pulse">
      {/* Skeleton de Tarjeta Principal con Scanlines */}
      <div className="crt-scanlines border border-[#293056] rounded-[4px] p-5 h-36 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 bg-[#20253f] rounded-[2px]" />
          <div className="h-5 w-16 bg-[#20253f] rounded-[2px]" />
        </div>
        <div className="h-8 w-44 bg-[#00FF66]/20 rounded-[2px]" />
        <div className="grid grid-cols-10 gap-1.5 h-3 w-full">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-full bg-[#20253f] rounded-[1px]" />
          ))}
        </div>
      </div>

      {/* Skeleton de Tarjeta Secundaria */}
      <div className="bg-[#181c31] border border-[#293056] rounded-[4px] p-4 h-16 flex items-center justify-between">
        <div className="h-4 w-24 bg-[#20253f] rounded-[2px]" />
        <div className="h-4 w-20 bg-[#20253f] rounded-[2px]" />
      </div>

      {/* Skeleton de Botones de Acción */}
      <div className="grid grid-cols-2 gap-3.5 my-1">
        <div className="h-16 bg-[#00FF66]/15 border border-[#00FF66]/30 rounded-[4px]" />
        <div className="h-16 bg-[#ff4d6d]/15 border border-[#ff4d6d]/30 rounded-[4px]" />
      </div>

      {/* Skeleton de Lista */}
      <div className="bg-[#181c31] border border-[#293056] rounded-[4px] p-4 flex flex-col gap-3">
        <div className="h-4 w-36 bg-[#20253f] rounded-[2px]" />
        <div className="h-px bg-[#232845] w-full" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#20253f] rounded-[4px]" />
              <div className="flex flex-col gap-1.5">
                <div className="h-3 w-28 bg-[#20253f] rounded-[2px]" />
                <div className="h-2.5 w-16 bg-[#20253f] rounded-[2px]" />
              </div>
            </div>
            <div className="h-4 w-16 bg-[#20253f] rounded-[2px]" />
          </div>
        ))}
      </div>
    </div>
  )
}

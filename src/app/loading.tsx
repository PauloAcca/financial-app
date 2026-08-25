import Image from 'next/image'

export default function RootLoading() {
  return (
    <div className="fixed inset-0 bg-[#0f111e] flex flex-col items-center justify-center font-mono z-50 p-4 select-none">
      {/* Contenedor Gamer CRT con resplandor neón */}
      <div className="crt-scanlines border-2 border-[#00FF66] rounded-[6px] p-8 max-w-xs w-full flex flex-col items-center text-center shadow-[0_0_30px_rgba(0,255,102,0.25)] relative overflow-hidden">
        {/* Moneda / Logo Animado */}
        <div className="relative w-16 h-16 rounded-[6px] border-2 border-[#00FF66] bg-[#181c31] overflow-hidden mb-4 shadow-[0_0_15px_rgba(0,255,102,0.4)] animate-pulse">
          <Image
            src="/pixel-coin.jpg"
            alt="Pixel Realm"
            width={64}
            height={64}
            className="w-full h-full object-cover"
            priority
          />
        </div>

        {/* Título Neón */}
        <h2 className="text-xl font-bold text-[#00FF66] tracking-widest glow-text-green uppercase mb-1">
          PIXEL REALM
        </h2>
        <p className="text-[10px] text-[#8B92A9] tracking-wider uppercase mb-5">
          FINANZAS &amp; CONTROL RPG
        </p>

        {/* Barra de Progreso Segmentada Neón */}
        <div className="grid grid-cols-10 gap-1.5 h-2.5 w-full mb-4">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={`splash-block-${index}`}
              className="h-full rounded-[1px] bg-[#00FF66] animate-pulse"
              style={{
                animationDelay: `${index * 80}ms`,
                animationDuration: '1s',
                boxShadow: '0 0 8px rgba(0,255,102,0.8)',
              }}
            />
          ))}
        </div>

        {/* Texto de Estado Terminal */}
        <div className="flex items-center gap-2 text-xs font-bold text-[#38d9f5] tracking-wider uppercase glow-text-cyan">
          <span className="animate-spin text-sm">✦</span>
          <span>INICIANDO SISTEMA...</span>
        </div>
      </div>
    </div>
  )
}

/**
 * AuroraBackdrop — fondo atmosférico fijo detrás de toda la app.
 * El vidrio necesita algo que refractar: auroras suaves (salvia,
 * azul niebla, lavanda) que derivan lentamente + grano sutil.
 */
export function AuroraBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#0A0E14]"
    >
      {/* Veladura base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 0%, #0D1420 0%, #0A0E14 55%)',
        }}
      />

      {/* Aurora salvia */}
      <div
        className="animate-drift-a absolute -top-[18%] left-[-12%] h-[62vmax] w-[62vmax] rounded-full blur-[110px]"
        style={{
          background:
            'radial-gradient(circle at 40% 40%, rgba(143, 203, 176, 0.34) 0%, rgba(143, 203, 176, 0.1) 42%, transparent 70%)',
        }}
      />

      {/* Aurora azul niebla */}
      <div
        className="animate-drift-b absolute top-[18%] right-[-15%] h-[58vmax] w-[58vmax] rounded-full blur-[110px]"
        style={{
          background:
            'radial-gradient(circle at 55% 45%, rgba(166, 185, 232, 0.28) 0%, rgba(166, 185, 232, 0.08) 45%, transparent 70%)',
        }}
      />

      {/* Aurora lavanda */}
      <div
        className="animate-drift-c absolute bottom-[-25%] left-[18%] h-[54vmax] w-[54vmax] rounded-full blur-[110px]"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(191, 174, 232, 0.2) 0%, rgba(191, 174, 232, 0.06) 45%, transparent 70%)',
        }}
      />

      {/* Grano sutil para evitar banding y dar textura */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  )
}

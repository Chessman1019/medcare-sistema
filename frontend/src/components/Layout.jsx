export default function Layout({ children, sidebar }) {
  return (
    <div className="min-h-screen flex flex-col">

      {/* BARRA SUPERIOR */}
      <header style={{background: 'linear-gradient(90deg, #0284c7 0%, #0ea5e9 40%, #06b6d4 100%)'}}
        className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-6 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <span className="text-lg">🏥</span>
          </div>
          <div>
            <span className="text-white font-bold text-base tracking-wide">MedCare</span>
            <span className="text-cyan-200 text-xs ml-2">| Sistema de Gestión Médica</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1">
            <span className="text-cyan-200 text-xs">🔒</span>
            <span className="text-cyan-100 text-xs">Conexión segura</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-cyan-200 text-xs">📡</span>
            <span className="text-cyan-100 text-xs">API conectada</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-white text-xs font-medium">En línea</span>
          </div>
        </div>
      </header>

      {/* CONTENIDO CENTRAL */}
      <div className="flex flex-1 pt-14 pb-12">
        {sidebar && sidebar}
        <main className={`flex-1 ${sidebar ? 'ml-64' : ''} bg-gray-100 min-h-full`}>
          {children}
        </main>
      </div>

      {/* BARRA INFERIOR */}
      <footer style={{background: 'linear-gradient(90deg, #0284c7 0%, #0ea5e9 40%, #06b6d4 80%, #0284c7 100%)'}}
        className="fixed bottom-0 left-0 right-0 z-50 h-12 flex items-center justify-between px-6 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-white text-sm">🏥</span>
          <span className="text-white text-xs font-semibold">MedCare S.A.C.</span>
          <span className="text-cyan-300 text-xs">© 2026 — Todos los derechos reservados</span>
        </div>
        <div className="flex items-center gap-2">
          {[
            { icon: '🐍', label: 'Python' },
            { icon: '⚛️', label: 'React' },
            { icon: '🗄️', label: 'Supabase' },
          ].map(tech => (
            <span key={tech.label}
              className="flex items-center gap-1 bg-white/15 text-white text-xs px-2.5 py-1 rounded-full">
              {tech.icon} {tech.label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-cyan-200 text-xs">📍 Lima, Perú</span>
          <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-white text-xs font-semibold">Sistema Activo</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
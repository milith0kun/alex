import { useConceptStore } from "../store/useConceptStore";

export function MainHeader() {
  const theme = useConceptStore((s) => s.theme);

  return (
    <header 
      className={`w-full z-[60] transition-colors duration-500 border-b ${
        theme === 'dark' 
          ? 'bg-[#020617]/80 backdrop-blur-md border-slate-800/50' 
          : 'bg-white border-gray-200 shadow-sm'
      }`}
    >
      <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="relative w-9 h-9 flex items-center justify-center">
            {/* Hexagon shape from image */}
            <svg viewBox="0 0 24 24" className="w-full h-full text-indigo-500 fill-current opacity-20 absolute rotate-90">
              <path d="M12 2l9 5v10l-9 5-9-5V7l9-5z" />
            </svg>
            <div className="relative w-7 h-7 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/40 rotate-12 group-hover:rotate-0 transition-transform duration-300">
              <div className="w-2.5 h-2.5 bg-white rounded-full shadow-inner"></div>
            </div>
          </div>
          <h1 className={`text-xl font-black tracking-tight flex items-baseline ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Genome</span>
            <span>Analyzer</span>
            <span className="text-[10px] font-black text-indigo-500 ml-0.5 opacity-80">PRO</span>
          </h1>
        </div>

        {/* Navigation */}
        <nav className="hidden lg:flex items-center gap-10 h-full">
          {[
            { label: 'Análisis', active: false },
            { label: 'Información', active: false },
            { label: 'Documentación', active: false },
            { label: 'Mapa Conceptual', active: true },
          ].map((item) => (
            <div key={item.label} className="h-full relative flex items-center">
              <button
                className={`px-1 text-sm font-bold transition-all duration-300 ${
                  item.active
                    ? (theme === 'dark' ? 'text-white' : 'text-slate-900')
                    : (theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800')
                }`}
              >
                {item.label}
              </button>
              {item.active && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-t-full shadow-[0_-2px_10px_rgba(99,102,241,0.4)]"></div>
              )}
            </div>
          ))}
        </nav>

        {/* Right side placeholder / User profile */}
        <div className="flex items-center gap-4">
          <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border ${
            theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-wider">Sistema Activo</span>
          </div>
        </div>
      </div>
    </header>
  );
}

import { useState, useRef } from "react";
import { useConceptStore } from "../store/useConceptStore";
import type { LayoutType } from "../types";

export function TopBar() {
  const {
    editMode,
    setEditMode,
    searchTerm,
    setSearchTerm,
    layoutType,
    setLayoutType,
    applyLayout,
    exportData,
    importData,
    resetToInitial,
    sidebarOpen,
    setSidebarOpen,
    viewMode,
    setViewMode,
    expandAllCategories,
    collapseAllCategories,
    focusedNodeId,
    setFocusedNodeId,
    theme,
    setTheme,
    isAuthenticatedForEdit,
    setIsPasswordModalOpen,
    saveToServer,
    setIsSaveModalOpen,
  } = useConceptStore();
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleToggleEdit = () => {
    if (editMode) {
      setEditMode(false);
    } else {
      if (isAuthenticatedForEdit) {
        setEditMode(true);
      } else {
        setIsPasswordModalOpen(true);
      }
    }
  };

  const handleSaveToServer = async () => {
    if (!isAuthenticatedForEdit) {
      setIsPasswordModalOpen(true);
      return;
    }

    setIsSaving(true);
    setSaveStatus('idle');
    
    try {
      const result = await saveToServer();
      if (result.success) {
        setSaveStatus('success');
        alert("✅ Cambios guardados correctamente en el servidor.");
      } else {
        setSaveStatus('error');
        alert("❌ Error: " + (result.error || "No se pudo guardar"));
      }
    } catch (err) {
      setSaveStatus('error');
      alert("❌ Error de conexión");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mapa-conceptual.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        importData(data);
        setShowImport(false);
      } catch { alert("Error al leer el archivo JSON"); }
    };
    reader.readAsText(file);
  };

  const handleImportText = () => {
    try {
      const data = JSON.parse(importText);
      importData(data);
      setShowImport(false);
      setImportText("");
    } catch { alert("JSON inválido"); }
  };

  const handleExitEdit = () => {
    const message = "⚠️ ATENCIÓN: ¿Estás seguro de que deseas salir del editor?\n\nSi no has guardado tus cambios, se perderán permanentemente.\n\n¿Deseas salir de todas formas?";
    if (confirm(message)) {
      setEditMode(false);
    }
  };

  return (
    <>
      <header className={`h-16 border-b transition-colors duration-500 z-50 flex items-center px-6 ${
        theme === 'dark' ? 'bg-[#020617]/80 backdrop-blur-md border-slate-800/50' : 'bg-white border-gray-100 shadow-sm'
      }`}>
        <div className="flex-1 flex items-center justify-between">
          {/* Lado Izquierdo: Toggle Sidebar + Logo */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-1.5 rounded-lg border transition-all ${
                theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
            
            <a href="/" className="flex items-center gap-3 group">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-full h-full text-indigo-500 fill-current opacity-20 absolute rotate-90">
                  <path d="M12 2l9 5v10l-9 5-9-5V7l9-5z" />
                </svg>
                <div className="relative w-6 h-6 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/40 rotate-12 group-hover:rotate-0 transition-transform duration-300">
                  <div className="w-2 h-2 bg-white rounded-full shadow-inner"></div>
                </div>
              </div>
              <h1 className={`text-lg font-black tracking-tight flex items-baseline ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Genome</span>
                <span>Analyzer</span>
                <span className="text-[9px] font-black text-indigo-500 ml-0.5 opacity-80 uppercase">Pro</span>
              </h1>
            </a>
          </div>

          {/* Centro: Navegación Principal */}
          <nav className="hidden xl:flex items-center gap-8 h-full">
            {[
              { label: 'Análisis', href: '/' },
              { label: 'Información', href: '/#about' },
              { label: 'Documentación', href: '/#docs' },
              { label: 'Mapa Conceptual', href: '/mapas', active: true },
            ].map((item) => (
              <div key={item.label} className="h-full relative flex items-center">
                <a
                  href={item.href}
                  className={`px-1 text-sm font-bold transition-all duration-300 ${
                    item.active
                      ? (theme === 'dark' ? 'text-white' : 'text-slate-900')
                      : (theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800')
                  }`}
                >
                  {item.label}
                </a>
                {item.active && (
                  <div className="absolute -bottom-[23px] left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-t-full shadow-[0_-2px_10px_rgba(99,102,241,0.4)]"></div>
                )}
              </div>
            ))}
          </nav>

          {/* Lado Derecho: Controles + Status */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative hidden md:block w-48 lg:w-64">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar conceptos…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 text-[12px] border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-slate-900/50 border-slate-700 text-slate-100 placeholder-slate-500' 
                    : 'bg-gray-50 border-gray-200 text-slate-700 placeholder-slate-400'
                }`}
              />
            </div>

            <div className={`h-6 w-px mx-1 hidden sm:block ${theme === 'dark' ? 'bg-slate-800' : 'bg-gray-200'}`} />

            {/* THEME TOGGLE */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-1.5 rounded-lg border transition-all ${
                theme === 'dark'
                  ? 'bg-slate-800 border-slate-700 text-amber-400 hover:border-amber-400/50'
                  : 'bg-white border-gray-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-500'
              }`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* EDIT MODE ACTIONS */}
            {editMode ? (    
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveToServer}
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-lg font-bold text-[11px] bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/20"
                >
                  <span>{isSaving ? "⏳" : "💾"}</span>
                  <span className="hidden lg:inline">{isSaving ? "GUARDANDO..." : "GUARDAR"}</span>
                </button>
                <button
                  onClick={handleExitEdit}
                  className={`px-4 py-1.5 rounded-lg font-bold text-[11px] border transition-all flex items-center gap-2 ${
                    theme === 'dark' 
                      ? 'bg-slate-800 text-rose-400 border-slate-700 hover:border-rose-500/50 hover:bg-rose-500/10' 
                      : 'bg-white text-rose-600 border-gray-200 hover:border-rose-500 shadow-sm hover:bg-rose-50'
                  }`}
                >
                  <span>🚪</span>
                  <span className="hidden lg:inline">SALIR</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleToggleEdit}
                className={`px-3 py-1.5 rounded-lg font-bold text-[11px] border transition-all flex items-center gap-1.5 ${
                  theme === 'dark'
                    ? 'bg-slate-900 text-slate-300 border-slate-700 hover:border-indigo-500'
                    : 'bg-white text-slate-600 border-gray-200 hover:border-indigo-500 shadow-sm'
                }`}
              >
                <span>👁️</span><span className="hidden lg:inline">EDITAR</span>
              </button>
            )}

            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border ${
              theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[9px] font-bold uppercase tracking-wider whitespace-nowrap">Sistema Activo</span>
            </div>
          </div>
        </div>
      </header>

      {showImport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowImport(false)}>
          <div className="bg-slate-950 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-800 text-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-100">📥 Importar Mapa</h3>
              <button onClick={() => setShowImport(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Desde archivo JSON:</label>
                <input ref={fileRef} type="file" accept=".json" onChange={handleImportFile} className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-800 file:text-slate-100 hover:file:bg-slate-700" />
              </div>
              <div className="flex items-center gap-3"><div className="flex-1 h-px bg-slate-800" /><span className="text-xs text-slate-500">o</span><div className="flex-1 h-px bg-slate-800" /></div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Pegar JSON:</label>
                <textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder='{"categories":[...],"nodes":[...],"edges":[...]}' className="w-full h-32 text-xs border border-slate-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono bg-slate-900 text-slate-100 placeholder-slate-500" />
                <button onClick={handleImportText} disabled={!importText.trim()} className="mt-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed">Importar JSON</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

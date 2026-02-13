import { useState } from "react";
import { useConceptStore } from "../store/useConceptStore";
import type { ConceptNodeData } from "../types";

export function SidebarCategories() {
  const {
    nodes,
    categories,
    highlightCategory,
    filterCategory,
    setHighlightCategory,
    setFilterCategory,
    sidebarOpen,
    setSidebarOpen,
    editMode,
    setEditMode,
    addNode,
    collapsedCategories,
    toggleCategoryCollapse,
    expandAllCategories,
    collapseAllCategories,
    setSelectedNodeId,
    selectedNodeId,
    searchTerm,
    theme,
    isAuthenticatedForEdit,
    setIsPasswordModalOpen,
  } = useConceptStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSummary, setNewSummary] = useState("");
  const [newCategory, setNewCategory] = useState(categories[0]?.id || "");

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

  const catCounts = categories.map((cat) => ({
    ...cat,
    count: nodes.filter((n) => (n.data as ConceptNodeData).categoryId === cat.id).length,
    nodes: nodes.filter((n) => (n.data as ConceptNodeData).categoryId === cat.id),
  }));

  const handleAddNode = () => {
    if (!newTitle.trim()) return;
    addNode({ title: newTitle.trim(), summary: newSummary.trim() || "Sin descripción", categoryId: newCategory });
    setNewTitle(""); setNewSummary(""); setNewCategory(categories[0]?.id || ""); setShowAddForm(false);
  };

  const filteredNodes = (catNodes: typeof nodes) => {
    if (!searchTerm) return catNodes;
    const t = searchTerm.toLowerCase();
    return catNodes.filter((n) => {
      const d = n.data as ConceptNodeData;
      return d.title.toLowerCase().includes(t) || d.summary.toLowerCase().includes(t);
    });
  };

  return (
    <>
      {sidebarOpen && <div className={`fixed inset-0 z-30 lg:hidden backdrop-blur-sm ${theme === 'dark' ? 'bg-slate-900/60' : 'bg-slate-200/40'}`} onClick={() => setSidebarOpen(false)} />}
      <aside 
        translate="no"
        className={`fixed top-0 left-0 h-full w-64 border-r transition-all duration-500 lg:relative lg:translate-x-0 lg:z-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } flex flex-col ${
          theme === 'dark' 
            ? "bg-[#020617] border-slate-800/50" 
            : "bg-white border-gray-200 shadow-xl"
        }`}
      >
        <div className={`p-3 border-b flex items-center justify-between ${theme === 'dark' ? 'border-slate-800' : 'border-gray-100'}`}>
          <h2 className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            <span>📂</span> CATEGORÍAS
          </h2>
          <div className="flex items-center gap-1">
            <button onClick={expandAllCategories} className={`p-1 rounded text-[10px] transition-colors ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-500 hover:text-slate-300' : 'hover:bg-gray-100 text-gray-400'}`} title="Expandir todo">▼</button>
            <button onClick={collapseAllCategories} className={`p-1 rounded text-[10px] transition-colors ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-500 hover:text-slate-300' : 'hover:bg-gray-100 text-gray-400'}`} title="Colapsar todo">▲</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
          <button
            onClick={() => { setFilterCategory(null); setHighlightCategory(null); }}
            className={`w-full text-left px-3 py-2.5 rounded-lg border text-[11px] font-bold transition-all ${
              !filterCategory && !highlightCategory 
                ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-900/20" 
                : theme === 'dark'
                  ? "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-indigo-500/50 hover:text-indigo-300"
                  : "bg-gray-50 border-gray-100 text-gray-500 hover:border-indigo-400 hover:text-indigo-600"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">🌍 Todos los Conceptos</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                !filterCategory && !highlightCategory ? "bg-white/20" : theme === 'dark' ? "bg-slate-800 text-slate-500" : "bg-gray-200 text-gray-500"
              }`}>{nodes.length}</span>
            </div>
          </button>

          <div className={`h-px w-full my-2 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-gray-100'}`} />

          {catCounts.map((cat) => {
            const isCollapsed = collapsedCategories.has(cat.id);
            const catNodesList = filteredNodes(cat.nodes);
            const isSelected = filterCategory === cat.id;
            const isHighlighted = highlightCategory === cat.id;
            return (
              <div key={cat.id} className={`rounded-lg border transition-all overflow-hidden ${isSelected || isHighlighted ? "border-indigo-500/50 bg-indigo-500/5" : theme === 'dark' ? "border-slate-800/50" : "border-gray-100"}`}>
                <button onClick={() => toggleCategoryCollapse(cat.id)} className={`w-full px-2.5 py-2 flex items-center gap-2 transition-colors ${theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50'}`}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className={`text-[11px] font-semibold flex-1 text-left truncate ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{cat.icon} {cat.name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>{cat.count}</span>
                  <svg className={`w-3 h-3 text-slate-500 transition-transform ${isCollapsed ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                
                <div className={`flex gap-1 px-2 pb-2 ${theme === 'dark' ? 'bg-slate-900/30' : 'bg-gray-50/50'}`}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setFilterCategory(isSelected ? null : cat.id); }} 
                    className={`flex-1 text-[9px] py-1 rounded font-black transition-all ${
                      isSelected 
                        ? "bg-slate-800 text-white" 
                        : theme === 'dark' ? "bg-slate-800/50 text-slate-500 hover:bg-slate-800 hover:text-slate-300" : "bg-white text-gray-400 hover:bg-gray-200 hover:text-gray-600 shadow-sm"
                    }`}
                  >
                    {isSelected ? "FILTRADO" : "FILTRAR"}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setHighlightCategory(isHighlighted ? null : cat.id); if (filterCategory) setFilterCategory(null); }} 
                    className={`flex-1 text-[9px] py-1 rounded font-black transition-all ${
                      isHighlighted 
                        ? "text-white" 
                        : theme === 'dark' ? "bg-slate-800/50 text-slate-500 hover:bg-slate-800 hover:text-slate-300" : "bg-white text-gray-400 hover:bg-gray-200 hover:text-gray-600 shadow-sm"
                    }`} 
                    style={{ backgroundColor: isHighlighted ? cat.color : undefined }}
                  >
                    {isHighlighted ? "RESALTADO" : "RESALTAR"}
                  </button>
                </div>

                {!isCollapsed && (
                  <div className={`border-t max-h-48 overflow-y-auto custom-scrollbar ${
                    theme === 'dark' ? 'border-slate-800/50 bg-slate-950/20' : 'border-gray-50 bg-gray-50/20'
                  }`}>
                    {catNodesList.length === 0 && searchTerm && (
                      <p className="text-[9px] text-slate-500 p-2 text-center italic">Sin resultados</p>
                    )}
                    {catNodesList.map((node) => {
                      const nd = node.data as ConceptNodeData;
                      const isActive = selectedNodeId === node.id;
                      return (
                        <button 
                          key={node.id} 
                          onClick={(e) => { e.stopPropagation(); setSelectedNodeId(isActive ? null : node.id); }} 
                          className={`w-full text-left px-3 py-1.5 text-[10px] transition-all flex items-center gap-2 border-l-2 ${
                            isActive 
                              ? theme === 'dark' 
                                ? "bg-indigo-500/10 text-indigo-300 border-indigo-500 font-bold" 
                                : "bg-indigo-50 text-indigo-700 border-indigo-500 font-bold"
                              : theme === 'dark'
                                ? "text-slate-500 hover:bg-slate-800/50 border-transparent hover:text-slate-300"
                                : "text-gray-500 hover:bg-gray-100 border-transparent hover:text-gray-700"
                          }`}
                        >
                          <span className="truncate">{nd.title}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {editMode && (
          <div className={`p-4 border-t transition-colors ${
            theme === 'dark' ? 'border-orange-500/30 bg-orange-950/20' : 'border-orange-200 bg-orange-50/50'
          }`}>
            {showAddForm ? (
              <div className={`space-y-3 p-3 rounded-xl border-2 transition-all ${
                theme === 'dark' 
                  ? 'border-orange-500/30 bg-slate-900/50' 
                  : 'border-orange-200 bg-white shadow-lg'
              }`}>
                <h4 className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-2 ${
                  theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
                }`}>
                  <span>➕</span> Nuevo concepto
                </h4>
                <input 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)} 
                  placeholder="Título del concepto" 
                  className={`w-full text-xs px-3 py-2 border-2 rounded-lg focus:outline-none transition-all ${
                    theme === 'dark'
                      ? 'border-slate-700 bg-slate-950 text-white focus:border-orange-500/60 placeholder-slate-600'
                      : 'border-gray-100 bg-gray-50 text-slate-900 focus:border-orange-400 placeholder-gray-400'
                  }`} 
                  autoFocus 
                />
                <input 
                  value={newSummary} 
                  onChange={(e) => setNewSummary(e.target.value)} 
                  placeholder="Descripción breve..." 
                  className={`w-full text-xs px-3 py-2 border-2 rounded-lg focus:outline-none transition-all ${
                    theme === 'dark'
                      ? 'border-slate-700 bg-slate-950 text-white focus:border-orange-500/60 placeholder-slate-600'
                      : 'border-gray-100 bg-gray-50 text-slate-900 focus:border-orange-400 placeholder-gray-400'
                  }`} 
                />
                <select 
                  value={newCategory} 
                  onChange={(e) => setNewCategory(e.target.value)} 
                  className={`w-full text-xs px-3 py-2 border-2 rounded-lg focus:outline-none transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'border-slate-700 bg-slate-950 text-white focus:border-orange-500/60'
                      : 'border-gray-100 bg-gray-50 text-slate-900 focus:border-orange-400'
                  }`}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <div className="flex gap-2 pt-1">
                  <button 
                    onClick={handleAddNode} 
                    disabled={!newTitle.trim()} 
                    className={`flex-1 py-2 text-xs text-white rounded-lg font-black transition-all disabled:opacity-40 ${
                      theme === 'dark'
                        ? 'bg-orange-600 hover:bg-orange-500 shadow-lg shadow-orange-900/40'
                        : 'bg-orange-500 hover:bg-orange-400 shadow-md shadow-orange-200'
                    }`}
                  >
                    AGREGAR
                  </button>
                  <button 
                    onClick={() => setShowAddForm(false)} 
                    className={`px-3 py-2 text-xs rounded-lg font-bold transition-all ${
                      theme === 'dark'
                        ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setShowAddForm(true)} 
                className="w-full py-3 text-xs bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl hover:from-orange-500 hover:to-amber-500 transition-all font-black flex items-center justify-center gap-2 shadow-xl shadow-orange-900/30"
              >
                <span>➕</span> AGREGAR CONCEPTO
              </button>
            )}
          </div>
        )}

      </aside>
    </>
  );
}

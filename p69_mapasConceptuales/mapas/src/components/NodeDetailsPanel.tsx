import { useState, useEffect } from "react";
import { useConceptStore } from "../store/useConceptStore";
import type { ConceptNodeData } from "../types";

export function NodeDetailsPanel() {
  const selectedNodeId = useConceptStore((s) => s.selectedNodeId);
  const nodes = useConceptStore((s) => s.nodes);
  const edges = useConceptStore((s) => s.edges);
  const categories = useConceptStore((s) => s.categories);
  const editMode = useConceptStore((s) => s.editMode);
  const setEditMode = useConceptStore((s) => s.setEditMode);
  const setSelectedNodeId = useConceptStore((s) => s.setSelectedNodeId);
  const updateNode = useConceptStore((s) => s.updateNode);
  const deleteNode = useConceptStore((s) => s.deleteNode);
  const updateEdgeLabel = useConceptStore((s) => s.updateEdgeLabel);
  const deleteEdge = useConceptStore((s) => s.deleteEdge);
  const focusedNodeId = useConceptStore((s) => s.focusedNodeId);
  const setFocusedNodeId = useConceptStore((s) => s.setFocusedNodeId);
  const theme = useConceptStore((s) => s.theme);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const [editEdgeLabel, setEditEdgeLabel] = useState("");

  const node = nodes.find((n) => n.id === selectedNodeId);

  useEffect(() => {
    if (node) {
      const nd = node.data as ConceptNodeData;
      setEditTitle(nd.title);
      setEditSummary(nd.summary);
      setEditCategory(nd.categoryId);
    }
    setIsEditing(false);
    setEditingEdgeId(null);
  }, [selectedNodeId, node]);

  if (!node || !selectedNodeId) return null;

  const nd = node.data as ConceptNodeData;
  const cat = categories.find((c) => c.id === nd.categoryId);
  const outEdges = edges.filter((e) => e.source === selectedNodeId);
  const inEdges = edges.filter((e) => e.target === selectedNodeId);

  const getTitle = (id: string) => {
    const n = nodes.find((x) => x.id === id);
    return n ? (n.data as ConceptNodeData).title : id;
  };

  const getEdgeLabel = (e: typeof edges[0]): string => {
    if (typeof e.label === "string") return e.label;
    if (e.data && typeof e.data === "object" && "label" in e.data && typeof e.data.label === "string") return e.data.label;
    return "";
  };

  const handleSave = () => {
    updateNode(selectedNodeId, { title: editTitle, summary: editSummary, categoryId: editCategory });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm(`¿Eliminar "${nd.title}"? Se eliminarán también sus conexiones.`)) deleteNode(selectedNodeId);
  };

  const handleSaveEdge = () => {
    if (editingEdgeId) { updateEdgeLabel(editingEdgeId, editEdgeLabel); setEditingEdgeId(null); }
  };

  const handleDeleteEdge = (edgeId: string) => {
    if (confirm("¿Eliminar esta conexión?")) deleteEdge(edgeId);
  };

  const isFocused = focusedNodeId === selectedNodeId;

  const renderEdgeItem = (edge: typeof edges[0], direction: "out" | "in") => {
    const targetId = direction === "out" ? edge.target : edge.source;
    const label = getEdgeLabel(edge);
    return (
      <div key={edge.id} className={`group rounded-lg border border-transparent transition-colors ${
        theme === 'dark' ? 'hover:bg-slate-800 hover:border-slate-700' : 'hover:bg-gray-50 hover:border-gray-200'
      }`}>
        <div className="flex items-center gap-1.5 px-2 py-2">
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedNodeId(targetId)}>
            <span className={`text-[11px] font-medium block truncate ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
              {direction === "out" ? "→" : "←"} {getTitle(targetId)}
            </span>
            {editingEdgeId === edge.id ? (
              <div className="flex gap-1 mt-1">
                <input value={editEdgeLabel} onChange={(e) => setEditEdgeLabel(e.target.value)} className={`text-[10px] border rounded px-2 py-1 flex-1 focus:outline-none focus:ring-1 ${
                  theme === 'dark' ? 'bg-slate-800 border-slate-600 text-slate-200 focus:ring-indigo-400' : 'bg-white border-indigo-300 text-gray-800 focus:ring-indigo-500'
                }`} autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdge(); if (e.key === "Escape") setEditingEdgeId(null); }} />
                <button onClick={handleSaveEdge} className="text-[10px] px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium">✓</button>
                <button onClick={() => setEditingEdgeId(null)} className={`text-[10px] px-2 py-1 rounded font-medium ${
                  theme === 'dark' ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}>✕</button>
              </div>
            ) : (
              <span className={`text-[9px] italic ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'}`}>"{label}"</span>
            )}
          </div>
          {editMode && editingEdgeId !== edge.id && (
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={(e) => { e.stopPropagation(); setEditingEdgeId(edge.id); setEditEdgeLabel(label); }} className={`p-1.5 rounded-lg text-xs border transition-colors ${
                theme === 'dark' ? 'bg-indigo-950/30 text-indigo-400 border-indigo-900/50 hover:bg-indigo-900/40' : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'
              }`} title="Editar etiqueta">✏️</button>
              <button onClick={(e) => { e.stopPropagation(); handleDeleteEdge(edge.id); }} className={`p-1.5 rounded-lg text-xs border transition-colors ${
                theme === 'dark' ? 'bg-red-950/30 text-red-400 border-red-900/50 hover:bg-red-900/40' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
              }`} title="Eliminar conexión">🗑️</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`fixed bottom-0 right-0 left-0 lg:relative lg:bottom-auto lg:w-80 border-t lg:border-t-0 lg:border-l z-30 max-h-[50vh] lg:max-h-full overflow-y-auto shadow-lg lg:shadow-none transition-colors duration-500 ${
      theme === 'dark' ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-gray-200'
    }`}>
      <div className={`p-3 border-b sticky top-0 z-10 transition-colors duration-500 ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-white'}`} style={{ borderTopColor: cat?.color || "#6b7280", borderTopWidth: 3, borderBottomColor: theme === 'dark' ? '#1e293b' : '#e5e7eb' }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-sm">{cat?.icon || "📄"}</span>
            <h3 className={`text-sm font-bold truncate ${theme === 'dark' ? 'text-slate-100' : 'text-gray-800'}`}>{nd.title}</h3>
          </div>
          <button onClick={() => setSelectedNodeId(null)} className={`p-1 rounded flex-shrink-0 ml-1 transition-colors ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-gray-100 text-gray-400'}`}>✕</button>
        </div>
        <p className={`text-[11px] leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>{nd.summary}</p>
        <span className="text-[9px] px-2 py-0.5 rounded-full font-medium mt-1.5 inline-block" style={{ backgroundColor: `${cat?.color}15`, color: cat?.color }}>{cat?.name}</span>
      </div>

      <div className={`px-3 py-3 border-b space-y-2 ${theme === 'dark' ? 'border-slate-800' : 'border-gray-200'}`}>
        {editMode ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setIsEditing(true)} className="px-3 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold flex items-center justify-center gap-2 shadow-md active:scale-95">✏️ Editar</button>
              <button onClick={handleDelete} className="px-3 py-2.5 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold flex items-center justify-center gap-2 shadow-md active:scale-95">🗑️ Eliminar</button>
            </div>
            <button onClick={() => setFocusedNodeId(isFocused ? null : selectedNodeId)} className={`w-full px-3 py-2 text-xs rounded-xl border font-medium flex items-center justify-center gap-1 transition-all ${
              isFocused 
                ? (theme === 'dark' ? "bg-purple-950/40 text-purple-300 border-purple-800" : "bg-purple-100 text-purple-700 border-purple-300")
                : (theme === 'dark' ? "bg-purple-950/20 text-purple-400 border-purple-900/50 hover:bg-purple-900/40" : "bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100")
            }`}>🎯 {isFocused ? "Quitar enfoque" : "Enfocar este nodo"}</button>
          </>
        ) : (
          <>
            <button onClick={() => setEditMode(true)} className="w-full px-3 py-3 text-sm bg-orange-500 text-white rounded-xl hover:bg-orange-600 font-bold flex items-center justify-center gap-2 shadow-md active:scale-95">✏️ Activar Edición para modificar</button>
            <button onClick={() => setFocusedNodeId(isFocused ? null : selectedNodeId)} className={`w-full px-3 py-2 text-xs rounded-xl border font-medium flex items-center justify-center gap-1 transition-all ${
              isFocused 
                ? (theme === 'dark' ? "bg-purple-950/40 text-purple-300 border-purple-800" : "bg-purple-100 text-purple-700 border-purple-300")
                : (theme === 'dark' ? "bg-purple-950/20 text-purple-400 border-purple-900/50 hover:bg-purple-900/40" : "bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100")
            }`}>🎯 {isFocused ? "Quitar enfoque" : "Enfocar este nodo"}</button>
          </>
        )}
      </div>

      {isEditing && editMode && (
        <div className={`px-3 py-3 border-b space-y-3 ${theme === 'dark' ? 'border-orange-900/30 bg-orange-950/20' : 'border-orange-200 bg-orange-50/50'}`}>
          <h4 className={`text-xs font-bold ${theme === 'dark' ? 'text-orange-400' : 'text-orange-800'}`}>✏️ Editando nodo</h4>
          <div>
            <label className={`text-[10px] font-medium block mb-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>Título</label>
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={`w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 font-medium ${
              theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-indigo-500' : 'bg-white border-indigo-300 text-gray-800 focus:ring-indigo-500'
            }`} autoFocus />
          </div>
          <div>
            <label className={`text-[10px] font-medium block mb-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>Resumen</label>
            <textarea value={editSummary} onChange={(e) => setEditSummary(e.target.value)} className={`w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-none ${
              theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-indigo-500' : 'bg-white border-indigo-300 text-gray-800 focus:ring-indigo-500'
            }`} rows={3} />
          </div>
          <div>
            <label className={`text-[10px] font-medium block mb-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>Categoría</label>
            <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className={`w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-indigo-500' : 'bg-white border-indigo-300 text-gray-800 focus:ring-indigo-500'
            }`}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="flex-1 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold">✓ Guardar</button>
            <button onClick={() => { setIsEditing(false); setEditTitle(nd.title); setEditSummary(nd.summary); setEditCategory(nd.categoryId); }} className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              theme === 'dark' ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="p-3 space-y-4">
        {outEdges.length > 0 && (
          <div>
            <h4 className={`text-[11px] font-bold mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-700'}`}><span className="text-green-500">→</span> Salientes ({outEdges.length})</h4>
            <div className="space-y-1">{outEdges.map((e) => renderEdgeItem(e, "out"))}</div>
          </div>
        )}
        {inEdges.length > 0 && (
          <div>
            <h4 className={`text-[11px] font-bold mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-700'}`}><span className="text-blue-500">←</span> Entrantes ({inEdges.length})</h4>
            <div className="space-y-1">{inEdges.map((e) => renderEdgeItem(e, "in"))}</div>
          </div>
        )}
        {outEdges.length === 0 && inEdges.length === 0 && (
          <div className="text-center py-4 text-gray-400">
            <p className="text-xs">Sin conexiones</p>
            {editMode && <p className="text-[10px] mt-1">Arrastra desde <span className="text-green-500 font-bold">●</span> → <span className="text-blue-500 font-bold">●</span></p>}
          </div>
        )}
        {!editMode && (outEdges.length > 0 || inEdges.length > 0) && (
          <div className={`pt-2 border-t ${theme === 'dark' ? 'border-slate-800' : 'border-gray-100'}`}>
            <button onClick={() => setEditMode(true)} className={`w-full text-center text-xs py-2 rounded-lg border font-medium transition-colors ${
              theme === 'dark' ? 'text-orange-400 bg-orange-950/20 border-orange-900/30 hover:bg-orange-900/30' : 'text-orange-500 bg-orange-50 border-orange-200 hover:bg-orange-100'
            }`}>✏️ Activar edición para modificar conexiones</button>
          </div>
        )}
      </div>
    </div>
  );
}

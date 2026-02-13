import { useConceptStore } from "../store/useConceptStore";
import type { ConceptNodeData } from "../types";

export function CategoryCards() {
  const nodes = useConceptStore((s) => s.nodes);
  const categories = useConceptStore((s) => s.categories);
  const toggleCategoryCollapse = useConceptStore((s) => s.toggleCategoryCollapse);
  const expandAllCategories = useConceptStore((s) => s.expandAllCategories);
  const theme = useConceptStore((s) => s.theme);

  const catCounts = categories.map((cat) => ({
    ...cat,
    count: nodes.filter((n) => (n.data as ConceptNodeData).categoryId === cat.id).length,
  }));

  return (
    <div className={`flex-1 h-full flex flex-col items-center justify-center p-8 overflow-y-auto transition-colors duration-500 ${
      theme === 'dark' ? 'bg-gradient-to-br from-[#0f172a] to-[#1e293b]' : 'bg-gradient-to-br from-gray-50 to-gray-100'
    }`}>
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-slate-100' : 'text-gray-800'}`}>🧬 Mapa Conceptual — Biología Celular</h2>
          <p className={`text-sm max-w-lg mx-auto ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>Haz clic en una categoría para explorar sus conceptos en el grafo.</p>
          <button onClick={expandAllCategories} className="mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-medium shadow-md hover:shadow-lg transition-all active:scale-95">🗺️ Ver mapa completo</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {catCounts.map((cat) => (
            <button key={cat.id} onClick={() => toggleCategoryCollapse(cat.id)} className={`group rounded-xl border-2 p-5 text-left transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800 hover:border-current' : 'bg-white border-gray-200 hover:border-current'
            }`} style={{ color: cat.color } as React.CSSProperties}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: `${cat.color}15` }}>{cat.icon}</div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: cat.color }}>{cat.count}</div>
              </div>
              <h3 className={`text-sm font-bold group-hover:text-current transition-colors ${theme === 'dark' ? 'text-slate-100' : 'text-gray-800'}`}>{cat.name}</h3>
              <p className={`text-[10px] mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`}>Clic para explorar →</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

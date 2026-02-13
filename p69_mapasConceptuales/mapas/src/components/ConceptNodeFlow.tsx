import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useConceptStore } from "../store/useConceptStore";
import type { ConceptNodeData } from "../types";

function ConceptNodeFlowInner({ id, data, selected }: NodeProps) {
  const nd = data as ConceptNodeData;
  const categories = useConceptStore((s) => s.categories);
  const editMode = useConceptStore((s) => s.editMode);
  const selectedNodeId = useConceptStore((s) => s.selectedNodeId);
  const focusedNodeId = useConceptStore((s) => s.focusedNodeId);
  const searchTerm = useConceptStore((s) => s.searchTerm);
  const highlightCategory = useConceptStore((s) => s.highlightCategory);
  const filterCategory = useConceptStore((s) => s.filterCategory);
  const setSelectedNodeId = useConceptStore((s) => s.setSelectedNodeId);
  const setFocusedNodeId = useConceptStore((s) => s.setFocusedNodeId);
  const getNeighborIds = useConceptStore((s) => s.getNeighborIds);
  const isAuthenticatedForEdit = useConceptStore((s) => s.isAuthenticatedForEdit);
  const theme = useConceptStore((s) => s.theme);

  if (!nd || !nd.title) return null;

  const cat = categories.find((c) => c.id === nd.categoryId);
  const color = cat?.color || "#6b7280";
  const icon = cat?.icon || "📄";

  const isSelected = selectedNodeId === id;
  const isSearchMatch = searchTerm && (
    nd.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nd.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const isHighlighted = highlightCategory === nd.categoryId;
  const isFiltered = filterCategory && filterCategory !== nd.categoryId;
  const isFocused = focusedNodeId === id;
  const isNeighborOfFocused = focusedNodeId ? getNeighborIds(focusedNodeId).has(id) : false;
  const isFocusDimmed = focusedNodeId !== null && !isFocused && !isNeighborOfFocused;
  const isDimmed = (isFiltered && !isSearchMatch) || isFocusDimmed;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeId(isSelected ? null : id);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFocusedNodeId(focusedNodeId === id ? null : id);
  };

  const handleStyle = (isSource: boolean) =>
    `!border-2 !border-white !rounded-full transition-all duration-200 ${
      editMode && isAuthenticatedForEdit
        ? `!w-4 !h-4 !opacity-100 ${isSource ? "!bg-green-500 hover:!bg-green-400" : "!bg-blue-500 hover:!bg-blue-400"} hover:!scale-150 !cursor-crosshair !z-50`
        : "!w-1 !h-1 !opacity-0"
    }`;

  return (
    <div
      translate="no"
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`
        relative group transition-all duration-300
        ${editMode && isAuthenticatedForEdit ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}
        ${isDimmed ? "opacity-20 scale-95" : "opacity-100"}
        ${isSelected || selected ? "scale-105 z-10" : ""}
        ${isFocused ? "scale-110 z-20" : ""}
        ${isNeighborOfFocused ? "scale-105 z-10" : ""}
        ${isSearchMatch ? "ring-3 ring-yellow-400 ring-offset-2 z-20" : ""}
        ${isHighlighted && !isDimmed ? "ring-2 ring-offset-1" : ""}
      `}
    >
      <Handle type="target" position={Position.Top} className={handleStyle(false)} style={{ top: -8 }} isConnectable={editMode && isAuthenticatedForEdit} />
      <Handle type="target" position={Position.Left} className={handleStyle(false)} style={{ left: -8 }} isConnectable={editMode && isAuthenticatedForEdit} />

      <div
        className={`
          rounded-xl border-2 min-w-[170px] max-w-[210px] transition-all duration-300
          ${theme === 'dark' ? "bg-slate-900" : "bg-white"}
          ${isSelected || isFocused ? (theme === 'dark' ? "shadow-xl shadow-black/40" : "shadow-xl shadow-black/10") : (theme === 'dark' ? "shadow-none hover:shadow-lg hover:shadow-black/20" : "shadow-sm hover:shadow-md")}
          ${editMode && isAuthenticatedForEdit ? (theme === 'dark' ? "ring-1 ring-orange-900/50" : "ring-1 ring-orange-200") : ""}
          ${editMode && isAuthenticatedForEdit && (isSelected || selected) ? "ring-2 ring-orange-400 ring-offset-1" : ""}
        `}
        style={{ borderColor: isSelected || isFocused ? color : (theme === 'dark' ? `${color}30` : `${color}50`) }}
      >
        <div className="h-1.5 rounded-t-[10px] relative" style={{ backgroundColor: color }}>
          {editMode && isAuthenticatedForEdit && (
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow-md z-10">
              <span className="text-[8px] text-white font-bold">✎</span>
            </div>
          )}
        </div>
        <div className="px-3 py-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs flex-shrink-0">{icon}</span>
            <h3 className={`text-[11px] font-bold leading-tight truncate ${theme === 'dark' ? 'text-slate-100' : 'text-gray-800'}`} title={nd.title}>{nd.title}</h3>
          </div>
          {(isSelected || isFocused) && (
            <p className={`text-[9px] leading-snug mt-1.5 line-clamp-2 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>{nd.summary}</p>
          )}
          {editMode && isAuthenticatedForEdit && isSelected && (
            <div className={`mt-1.5 pt-1.5 border-t -mx-3 -mb-2 px-3 pb-2 rounded-b-xl ${theme === 'dark' ? 'border-orange-900/30 bg-orange-950/20' : 'border-orange-100 bg-orange-50/50'}`}>
              <p className="text-[9px] text-orange-600 font-semibold flex items-center gap-1">✏️ Editar en panel derecho →</p>
            </div>
          )}
          {editMode && !isSelected && (
            <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className={`text-[8px] ${theme === 'dark' ? 'text-orange-400/80' : 'text-orange-400'}`}>🖱️ Arrastrar · Clic = editar</p>
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className={handleStyle(true)} style={{ bottom: -8 }} isConnectable={editMode} />
      <Handle type="source" position={Position.Right} className={handleStyle(true)} style={{ right: -8 }} isConnectable={editMode} />
    </div>
  );
}

export const ConceptNodeFlow = memo(ConceptNodeFlowInner);

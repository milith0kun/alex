import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ConnectionLineType,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useConceptStore } from "../store/useConceptStore";
import { ConceptNodeFlow } from "./ConceptNodeFlow";
import { CategoryCards } from "./CategoryCards";
import CustomBezierEdge from "./CustomBezierEdge";
import type { ConceptFlowNode, ConceptFlowEdge, ConceptNodeData } from "../types";

const edgeTypes = { custom: CustomBezierEdge };

export function ConceptGraph() {
  const allNodes = useConceptStore((s) => s.nodes);
  const allEdges = useConceptStore((s) => s.edges);
  const editMode = useConceptStore((s) => s.editMode);
  const setEditMode = useConceptStore((s) => s.setEditMode);
  const onNodesChange = useConceptStore((s) => s.onNodesChange);
  const onEdgesChange = useConceptStore((s) => s.onEdgesChange);
  const onConnect = useConceptStore((s) => s.onConnect);
  const setSelectedNodeId = useConceptStore((s) => s.setSelectedNodeId);
  const selectedNodeId = useConceptStore((s) => s.selectedNodeId);
  const focusedNodeId = useConceptStore((s) => s.focusedNodeId);
  const setFocusedNodeId = useConceptStore((s) => s.setFocusedNodeId);
  const setIsPasswordModalOpen = useConceptStore((s) => s.setIsPasswordModalOpen);
  const searchTerm = useConceptStore((s) => s.searchTerm);
  const categories = useConceptStore((s) => s.categories);
  const highlightCategory = useConceptStore((s) => s.highlightCategory);
  const collapsedCategories = useConceptStore((s) => s.collapsedCategories);
  const viewMode = useConceptStore((s) => s.viewMode);
  const isAuthenticatedForEdit = useConceptStore((s) => s.isAuthenticatedForEdit);
  const theme = useConceptStore((s) => s.theme);

  const { fitView, setCenter } = useReactFlow();
  const initialFit = useRef(false);
  const nodeTypes = useMemo(() => ({ concept: ConceptNodeFlow }), []);

  // Filter visible nodes by collapsed categories
  const visibleNodes = useMemo(() => {
    if (collapsedCategories.size === 0) return allNodes;
    return allNodes.filter((n) => !collapsedCategories.has((n.data as ConceptNodeData).categoryId));
  }, [allNodes, collapsedCategories]);

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);

  const visibleEdges = useMemo(() => {
    return allEdges.filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));
  }, [allEdges, visibleNodeIds]);

  // Fit on initial load
  useEffect(() => {
    if (visibleNodes.length > 0 && !initialFit.current) {
      initialFit.current = true;
      setTimeout(() => fitView({ padding: 0.12, duration: 700 }), 300);
    }
  }, [visibleNodes.length, fitView]);

  // Center on search
  useEffect(() => {
    if (!searchTerm) return;
    const match = allNodes.find((n) =>
      (n.data as ConceptNodeData).title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.data as ConceptNodeData).summary.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (match) {
      setCenter(match.position.x + 100, match.position.y + 35, { zoom: 1.8, duration: 600 });
      setSelectedNodeId(match.id);
    }
  }, [searchTerm, allNodes, setCenter, setSelectedNodeId]);

  // Center on selected node
  useEffect(() => {
    if (!selectedNodeId) return;
    const node = allNodes.find((n) => n.id === selectedNodeId);
    if (node && visibleNodeIds.has(node.id)) {
      setCenter(node.position.x + 100, node.position.y + 35, { zoom: 1.5, duration: 500 });
    }
  }, [selectedNodeId, allNodes, setCenter, visibleNodeIds]);

  // Style edges with custom type and visual data
  const styledEdges = useMemo((): ConceptFlowEdge[] => {
    return visibleEdges.map((e) => {
      const isConnSel = selectedNodeId && (e.source === selectedNodeId || e.target === selectedNodeId);
      const isConnFocus = focusedNodeId && (e.source === focusedNodeId || e.target === focusedNodeId);
      const isFocusDimmed = focusedNodeId && !isConnFocus;
      const isHlCat = highlightCategory && allNodes.some((n) =>
        (n.id === e.source || n.id === e.target) && (n.data as ConceptNodeData).categoryId === highlightCategory
      );

      const srcNode = allNodes.find((n) => n.id === e.source);
      const tgtNode = allNodes.find((n) => n.id === e.target);
      const srcCat = srcNode ? (srcNode.data as ConceptNodeData).categoryId : "";
      const tgtCat = tgtNode ? (tgtNode.data as ConceptNodeData).categoryId : "";
      const isCross = srcCat !== tgtCat;
      const isHl = !!(isConnSel || isConnFocus || isHlCat);

      // Get label safely
      const labelStr = typeof e.label === "string" ? e.label
        : (e.data && typeof e.data === "object" && "label" in e.data && typeof e.data.label === "string" ? e.data.label : "");

      return {
        ...e,
        type: "custom" as const,
        label: undefined, // label handled by custom edge via data
        data: {
          label: labelStr,
          sourceCategory: srcCat,
          isCrossCategory: isCross,
          highlighted: isHl,
          dimmed: !!isFocusDimmed,
          animated: isHl,
        },
      };
    });
  }, [visibleEdges, selectedNodeId, focusedNodeId, highlightCategory, allNodes]);

  const onNodeClick: NodeMouseHandler<ConceptFlowNode> = useCallback(
    (_ev, node) => setSelectedNodeId(node.id === selectedNodeId ? null : node.id),
    [selectedNodeId, setSelectedNodeId]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setFocusedNodeId(null);
  }, [setSelectedNodeId, setFocusedNodeId]);

  const miniMapNodeColor = useCallback(
    (node: ConceptFlowNode) => {
      const catId = (node.data as ConceptNodeData).categoryId;
      return categories.find((c) => c.id === catId)?.color || "#6b7280";
    },
    [categories]
  );

  const allCollapsed = viewMode === "categories" && collapsedCategories.size >= categories.length;

  return (
    <div className="flex-1 h-full relative">
      {allCollapsed ? (
        <CategoryCards />
      ) : (
        <ReactFlow
          nodes={visibleNodes}
          edges={styledEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={editMode && isAuthenticatedForEdit ? onConnect : undefined}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodesDraggable={editMode && isAuthenticatedForEdit}
          nodesConnectable={editMode && isAuthenticatedForEdit}
          edgesFocusable={editMode && isAuthenticatedForEdit}
          elementsSelectable={true}
          deleteKeyCode={editMode && isAuthenticatedForEdit ? "Delete" : null}
          fitView
          fitViewOptions={{ padding: 0.12 }}
          minZoom={0.03}
          maxZoom={4}
          proOptions={{ hideAttribution: true }}
          className="bg-transparent transition-colors duration-500"
          defaultEdgeOptions={{ type: "custom" }}
          connectionLineType={ConnectionLineType.Bezier}
          connectionLineStyle={{ stroke: theme === 'dark' ? "#818cf8" : "#6366f1", strokeWidth: 2.5, strokeDasharray: "8 4" }}
        >
          <Background 
            color={theme === 'dark' ? '#1e293b' : '#cbd5e1'} 
            variant="dots"
            gap={25} 
            size={0.6} 
            className="opacity-[0.2]"
          />
          <Controls 
            position="bottom-right" 
            showInteractive={false}
            className={theme === 'dark' ? "!bg-slate-800 !border-slate-700 [&_button]:!bg-slate-800 [&_button]:!border-slate-700 [&_svg]:!fill-slate-300 hover:[&_button]:!bg-slate-700" : ""}
          />
          <MiniMap
            nodeColor={miniMapNodeColor}
            maskColor={theme === 'dark' ? "rgba(0, 0, 0, 0.4)" : "rgba(0, 0, 0, 0.06)"}
            position="bottom-left"
            pannable
            zoomable
            style={{ 
              width: 170, 
              height: 110, 
              borderRadius: 12,
              backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
              border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0'
            }}
          />
        </ReactFlow>
      )}

      {/* Floating edit button */}
      {!allCollapsed && !editMode && (
        <button
          onClick={() => {
            if (isAuthenticatedForEdit) {
              setEditMode(true);
            } else {
              setIsPasswordModalOpen(true);
            }
          }}
          className="absolute bottom-6 right-20 px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-bold text-sm shadow-xl hover:shadow-2xl hover:scale-105 transition-all active:scale-95 flex items-center gap-2 z-20"
        >
          ✏️ Activar Edición
        </button>
      )}

      {/* Legend */}
      {!allCollapsed && (
        <div className={`absolute top-3 left-3 backdrop-blur-sm rounded-xl border shadow-sm p-2.5 max-w-[170px] hidden xl:block z-10 transition-colors duration-500 ${
          theme === 'dark' ? 'bg-slate-900/85 border-slate-700' : 'bg-white/85 border-gray-200/60'
        }`}>
          <h4 className={`text-[8px] font-bold uppercase mb-1.5 tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-gray-400'}`}>Categorías</h4>
          {categories.map((cat) => (
            <div key={cat.id} className={`flex items-center gap-1.5 transition-opacity ${!collapsedCategories.has(cat.id) ? "" : "opacity-25"}`}>
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
              <span className={`text-[8px] truncate ${theme === 'dark' ? 'text-slate-300' : 'text-gray-600'}`}>{cat.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

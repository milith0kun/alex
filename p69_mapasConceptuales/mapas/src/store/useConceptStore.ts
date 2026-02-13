import { create } from "zustand";
import {
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from "@xyflow/react";
import dagre from "dagre";
import { initialData } from "../data/initialData";
import type {
  ConceptFlowNode,
  ConceptFlowEdge,
  ConceptCategory,
  ConceptNodeData,
  ConceptMapData,
  LayoutType,
} from "../types";

const STORAGE_KEY = "concept-map-v3";
const POSITIONS_KEY = "concept-map-pos-v3";
const COLLAPSED_KEY = "concept-map-col-v3";

// ─── Layout helpers ─────────────────────────────────
const GRID: Record<string, { col: number; row: number }> = {
  fundamentos: { col: 0, row: 0 },
  "material-genetico": { col: 1, row: 0 },
  "flujo-informacion": { col: 2, row: 0 },
  "traduccion-proteinas": { col: 3, row: 0 },
  tecnicas: { col: 0, row: 1 },
  evolucion: { col: 1, row: 1 },
  bioinformatica: { col: 2, row: 1 },
};

function jitter(base: number, amt = 12): number {
  return base + (Math.random() - 0.5) * amt * 2;
}

function groupByCategory(nodes: ConceptFlowNode[]): Record<string, ConceptFlowNode[]> {
  const groups: Record<string, ConceptFlowNode[]> = {};
  for (const n of nodes) {
    const catId = (n.data as ConceptNodeData).categoryId;
    if (!groups[catId]) groups[catId] = [];
    groups[catId].push(n);
  }
  return groups;
}

function sectionsLayout(
  nodes: ConceptFlowNode[],
  edges: ConceptFlowEdge[],
  categories: ConceptCategory[]
): ConceptFlowNode[] {
  const groups = groupByCategory(nodes);
  const NW = 190, NH = 60, PAD = 40;
  const result: ConceptFlowNode[] = [];
  const catKeys = categories.map((c) => c.id).filter((id) => groups[id]?.length);

  for (const catId of catKeys) {
    const group = groups[catId];
    if (!group) continue;
    const idSet = new Set(group.map((n) => n.id));
    const intra = edges.filter((e) => idSet.has(e.source) && idSet.has(e.target));

    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: "TB", nodesep: 35, ranksep: 55, marginx: PAD, marginy: PAD });
    group.forEach((n) => g.setNode(n.id, { width: NW, height: NH }));
    intra.forEach((e) => g.setEdge(e.source, e.target));
    dagre.layout(g);

    let minX = Infinity, minY = Infinity;
    group.forEach((n) => { const p = g.node(n.id); minX = Math.min(minX, p.x - NW / 2); minY = Math.min(minY, p.y - NH / 2); });

    const gp = GRID[catId] || { col: catKeys.indexOf(catId) % 4, row: Math.floor(catKeys.indexOf(catId) / 4) };
    const ox = gp.col * 500 + jitter(0, 15);
    const oy = gp.row * 520 + jitter(0, 10);

    group.forEach((n) => {
      const p = g.node(n.id);
      result.push({ ...n, position: { x: jitter(p.x - minX + ox, 6), y: jitter(p.y - minY + oy + 30, 4) } });
    });
  }

  const placed = new Set(result.map((n) => n.id));
  nodes.forEach((n) => { if (!placed.has(n.id)) result.push(n); });
  return result;
}

function hierarchicalLayout(nodes: ConceptFlowNode[], edges: ConceptFlowEdge[]): ConceptFlowNode[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 50, ranksep: 70, marginx: 40, marginy: 40 });
  nodes.forEach((n) => g.setNode(n.id, { width: 200, height: 70 }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map((n) => { const p = g.node(n.id); return { ...n, position: { x: jitter(p.x - 95, 8), y: jitter(p.y - 30, 5) } }; });
}

function radialLayout(nodes: ConceptFlowNode[], categories: ConceptCategory[]): ConceptFlowNode[] {
  const center = nodes.find((n) => n.id === "celula") || nodes[0];
  if (!center) return nodes;
  const others = nodes.filter((n) => n.id !== center.id);
  const catGroups: Record<string, ConceptFlowNode[]> = {};
  others.forEach((n) => { const c = (n.data as ConceptNodeData).categoryId; if (!catGroups[c]) catGroups[c] = []; catGroups[c].push(n); });
  const catKeys = categories.map((c) => c.id).filter((id) => catGroups[id]?.length);
  const cx = 2000, cy = 2000;
  const result: ConceptFlowNode[] = [{ ...center, position: { x: cx, y: cy } }];
  const step = (2 * Math.PI) / catKeys.length;

  catKeys.forEach((catId, ci) => {
    const grp = catGroups[catId];
    const angle = ci * step - Math.PI / 2;
    const gcx = cx + Math.cos(angle) * 480;
    const gcy = cy + Math.sin(angle) * 480;
    if (grp.length === 1) {
      result.push({ ...grp[0], position: { x: jitter(gcx - 95, 10), y: jitter(gcy - 30, 8) } });
    } else {
      const subStep = (Math.PI * 0.8) / Math.max(grp.length - 1, 1);
      const start = angle - Math.PI * 0.4;
      const r = Math.min(300, 90 + grp.length * 25);
      grp.forEach((n, ni) => {
        const a = start + ni * subStep;
        result.push({ ...n, position: { x: jitter(gcx + Math.cos(a) * r - 95, 8), y: jitter(gcy + Math.sin(a) * r - 30, 6) } });
      });
    }
  });
  return result;
}

function forceLayout(nodes: ConceptFlowNode[], categories: ConceptCategory[]): ConceptFlowNode[] {
  const catGroups: Record<string, ConceptFlowNode[]> = {};
  nodes.forEach((n) => { const c = (n.data as ConceptNodeData).categoryId; if (!catGroups[c]) catGroups[c] = []; catGroups[c].push(n); });
  const catKeys = categories.map((c) => c.id).filter((id) => catGroups[id]?.length);
  const cols = Math.ceil(Math.sqrt(catKeys.length));
  const result: ConceptFlowNode[] = [];
  catKeys.forEach((catId, ci) => {
    const col = ci % cols, row = Math.floor(ci / cols);
    const bx = col * 650, by = row * 550;
    const grp = catGroups[catId];
    const gc = Math.ceil(Math.sqrt(grp.length));
    grp.forEach((n, ni) => {
      result.push({ ...n, position: { x: jitter(bx + (ni % gc) * 220, 12), y: jitter(by + Math.floor(ni / gc) * 100, 8) } });
    });
  });
  return result;
}

function applyLayoutToNodes(
  nodes: ConceptFlowNode[],
  edges: ConceptFlowEdge[],
  layout: LayoutType,
  categories: ConceptCategory[]
): ConceptFlowNode[] {
  try {
    switch (layout) {
      case "sections": return sectionsLayout(nodes, edges, categories);
      case "hierarchical": return hierarchicalLayout(nodes, edges);
      case "radial": return radialLayout(nodes, categories);
      case "force": return forceLayout(nodes, categories);
      default: return sectionsLayout(nodes, edges, categories);
    }
  } catch {
    return nodes;
  }
}

// ─── Convert raw data → React Flow ────────────────
function dataToFlow(
  data: ConceptMapData,
  positions?: Record<string, { x: number; y: number }>
): { nodes: ConceptFlowNode[]; edges: ConceptFlowEdge[] } {
  const nodes: ConceptFlowNode[] = data.nodes.map((n) => ({
    id: n.id,
    type: "concept",
    position: positions?.[n.id] || { x: 0, y: 0 },
    data: { title: n.title, summary: n.summary, categoryId: n.categoryId },
  }));
  const edges: ConceptFlowEdge[] = data.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: "custom",
    label: e.label,
    data: { label: e.label },
  }));
  return { nodes, edges };
}

// ─── Store interface ──────────────────────────────
interface ConceptStore {
  nodes: ConceptFlowNode[];
  edges: ConceptFlowEdge[];
  categories: ConceptCategory[];
  editMode: boolean;
  layoutType: LayoutType;
  selectedNodeId: string | null;
  focusedNodeId: string | null;
  searchTerm: string;
  highlightCategory: string | null;
  filterCategory: string | null;
  sidebarOpen: boolean;
  collapsedCategories: Set<string>;
  viewMode: "categories" | "graph";
  isAuthenticatedForEdit: boolean;
  editPassword: string | null;
  isPasswordModalOpen: boolean;
  isSaveModalOpen: boolean;
  theme: 'light' | 'dark';

  setIsPasswordModalOpen: (v: boolean) => void;
  setIsSaveModalOpen: (v: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setAuthenticatedForEdit: (v: boolean) => void;
  setEditPassword: (password: string | null) => void;
  verifyPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  saveToServer: () => Promise<{ success: boolean; error?: string }>;
  loadFromServer: () => Promise<void>;

  setEditMode: (v: boolean) => void;
  setSearchTerm: (v: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  setFocusedNodeId: (id: string | null) => void;
  setHighlightCategory: (id: string | null) => void;
  setFilterCategory: (id: string | null) => void;
  setSidebarOpen: (v: boolean) => void;
  setLayoutType: (t: LayoutType) => void;
  setViewMode: (m: "categories" | "graph") => void;
  toggleCategoryCollapse: (catId: string) => void;
  expandCategory: (catId: string) => void;
  collapseAllCategories: () => void;
  expandAllCategories: () => void;

  onNodesChange: (changes: NodeChange<ConceptFlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<ConceptFlowEdge>[]) => void;
  onConnect: (connection: Connection) => void;

  applyLayout: (type?: LayoutType) => void;
  updateNode: (id: string, data: Partial<ConceptNodeData>) => void;
  deleteNode: (id: string) => void;
  updateEdgeLabel: (id: string, label: string) => void;
  deleteEdge: (id: string) => void;
  addNode: (node: { title: string; summary: string; categoryId: string }) => void;

  exportData: () => ConceptMapData;
  importData: (data: ConceptMapData) => void;
  resetToInitial: () => void;
  saveToStorage: () => void;
  loadFromStorage: () => boolean;

  getNeighborIds: (nodeId: string) => Set<string>;
}

export type { LayoutType, ConceptFlowNode, ConceptFlowEdge };

export const useConceptStore = create<ConceptStore>((set, get) => ({
  nodes: [],
  edges: [],
  categories: initialData.categories,
  editMode: false,
  layoutType: "hierarchical",
  selectedNodeId: null,
  focusedNodeId: null,
  searchTerm: "",
  highlightCategory: null,
  filterCategory: null,
  sidebarOpen: true,
  collapsedCategories: new Set(initialData.categories.map((c) => c.id)),
  viewMode: "categories",
  isAuthenticatedForEdit: false,
  editPassword: null,
  isPasswordModalOpen: false,
  isSaveModalOpen: false,
  theme: 'dark',

  setIsPasswordModalOpen: (v) => set({ isPasswordModalOpen: v }),
  setIsSaveModalOpen: (v) => set({ isSaveModalOpen: v }),
  setTheme: (t) => set({ theme: t }),
  setAuthenticatedForEdit: (v) => set({ isAuthenticatedForEdit: v }),
  setEditPassword: (p) => set({ editPassword: p }),

  verifyPassword: async (password) => {
    try {
      const response = await fetch('/api/mapa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await response.json();
      if (data.success) {
        set({ 
          isAuthenticatedForEdit: true, 
          editPassword: password, 
          isPasswordModalOpen: false, 
          editMode: true 
        });
        return { success: true };
      }
      return { success: false, error: data.error || 'Contraseña incorrecta' };
    } catch (err) {
      return { success: false, error: 'Error de conexión con el servidor' };
    }
  },

  saveToServer: async () => {
    try {
      const s = get();
      if (!s.editPassword) {
        return { success: false, error: 'No autenticado' };
      }
      
      const exportData = s.exportData();
      
      // Guardar posiciones actuales en el export
      const nodesWithPos = s.nodes.map(n => ({
        id: n.id,
        title: (n.data as ConceptNodeData).title,
        summary: (n.data as ConceptNodeData).summary,
        categoryId: (n.data as ConceptNodeData).categoryId,
        position: n.position // Incluimos la posición para persistencia total
      }));

      const response = await fetch('/api/mapa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          password: s.editPassword, 
          data: { 
            ...exportData,
            nodes: nodesWithPos 
          } 
        })
      });
      
      if (response.ok) {
        return { success: true };
      }
      const data = await response.json();
      return { success: false, error: data.error || 'Error al guardar' };
    } catch (err) {
      return { success: false, error: 'Error de conexión con el servidor' };
    }
  },

  loadFromServer: async () => {
    try {
      console.log("Cargando datos desde el servidor...");
      const response = await fetch('/api/mapa');
      if (response.ok) {
        const data = await response.json();
        console.log("Datos recibidos del servidor:", data);
        
        if (data && data.nodes && data.nodes.length > 0) {
          const nodes: ConceptFlowNode[] = data.nodes.map((n: any) => ({
            id: n.id,
            type: "concept",
            position: n.position || { x: 0, y: 0 },
            data: { title: n.title, summary: n.summary, categoryId: n.categoryId },
          }));
          const edges: ConceptFlowEdge[] = data.edges.map((e: any) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            type: "custom",
            label: e.label,
            data: { label: e.label },
          }));
          
          set({ 
            nodes, 
            edges, 
            categories: data.categories || initialData.categories,
            layoutType: data.layout || "hierarchical"
          });
          console.log("Nodos cargados:", nodes.length);
          return;
        }
      }
      
      console.log("No hay datos en el servidor, usando initialData");
      set({ 
        nodes: initialData.nodes.map(n => ({
          id: n.id,
          type: "concept",
          position: { x: 0, y: 0 }, // Layout se aplicará después
          data: { title: n.title, summary: n.summary, categoryId: n.categoryId }
        })),
        edges: initialData.edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          type: "custom",
          data: { label: e.label }
        })),
        categories: initialData.categories,
        layoutType: "hierarchical"
      });
      get().applyLayout("hierarchical");
    } catch (err) {
      console.error("Error loading from server:", err);
      // Fallback a initialData
      set({ 
        nodes: initialData.nodes.map(n => ({
          id: n.id,
          type: "concept",
          position: { x: 0, y: 0 },
          data: { title: n.title, summary: n.summary, categoryId: n.categoryId }
        })),
        edges: initialData.edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          type: "custom",
          data: { label: e.label }
        }))
      });
      get().applyLayout("hierarchical");
    }
  },

  setEditMode: (v) => set({ editMode: v }),
  setSearchTerm: (v) => set({ searchTerm: v }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setFocusedNodeId: (id) => set({ focusedNodeId: id }),
  setHighlightCategory: (id) => set({ highlightCategory: id }),
  setFilterCategory: (id) => {
    const s = get();
    set({ filterCategory: id === s.filterCategory ? null : id, highlightCategory: null });
  },
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  setLayoutType: (t) => { set({ layoutType: t }); get().applyLayout(t); },
  setViewMode: (m) => {
    set({ viewMode: m });
    if (m === "graph") set({ collapsedCategories: new Set() });
  },

  toggleCategoryCollapse: (catId) => {
    set((s) => {
      const ns = new Set(s.collapsedCategories);
      if (ns.has(catId)) ns.delete(catId); else ns.add(catId);
      return { collapsedCategories: ns, viewMode: "graph" };
    });
    try { localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...get().collapsedCategories])); } catch { /* */ }
  },
  expandCategory: (catId) => {
    set((s) => { const ns = new Set(s.collapsedCategories); ns.delete(catId); return { collapsedCategories: ns, viewMode: "graph" }; });
  },
  collapseAllCategories: () => { set({ collapsedCategories: new Set(get().categories.map((c) => c.id)) }); },
  expandAllCategories: () => { set({ collapsedCategories: new Set(), viewMode: "graph" }); },

  onNodesChange: (changes) => {
    set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) as ConceptFlowNode[] }));
    get().saveToStorage();
  },
  onEdgesChange: (changes) => {
    set((s) => ({ edges: applyEdgeChanges(changes, s.edges) as ConceptFlowEdge[] }));
    get().saveToStorage();
  },
  onConnect: (connection) => {
    const newEdge: ConceptFlowEdge = {
      id: `e-${Date.now()}`,
      source: connection.source,
      target: connection.target,
      type: "custom",
      label: "se relaciona con",
      data: { label: "se relaciona con" },
    };
    set((s) => ({ edges: [...s.edges, newEdge] }));
    get().saveToStorage();
  },

  applyLayout: (type) => {
    const s = get();
    const lt = type || s.layoutType;
    const layoutedNodes = applyLayoutToNodes(s.nodes, s.edges, lt, s.categories);
    set({ nodes: layoutedNodes, layoutType: lt });
    get().saveToStorage();
  },

  updateNode: (id, data) => {
    set((s) => ({ nodes: s.nodes.map((n) => n.id === id ? { ...n, data: { ...n.data, ...data } } : n) }));
    get().saveToStorage();
  },
  deleteNode: (id) => {
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
    }));
    get().saveToStorage();
  },
  updateEdgeLabel: (id, label) => {
    set((s) => ({
      edges: s.edges.map((e) => e.id === id ? { ...e, label, data: { ...e.data, label } } : e),
    }));
    get().saveToStorage();
  },
  deleteEdge: (id) => {
    set((s) => ({ edges: s.edges.filter((e) => e.id !== id) }));
    get().saveToStorage();
  },
  addNode: ({ title, summary, categoryId }) => {
    const n: ConceptFlowNode = {
      id: `node-${Date.now()}`,
      type: "concept",
      position: { x: Math.random() * 600 + 200, y: Math.random() * 400 + 200 },
      data: { title, summary, categoryId },
    };
    set((s) => ({ nodes: [...s.nodes, n] }));
    get().saveToStorage();
  },

  exportData: () => {
    const s = get();
    return {
      categories: s.categories,
      nodes: s.nodes.map((n) => ({
        id: n.id,
        title: (n.data as ConceptNodeData).title,
        summary: (n.data as ConceptNodeData).summary,
        categoryId: (n.data as ConceptNodeData).categoryId,
      })),
      edges: s.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: (typeof e.label === "string" ? e.label : "") || ((e.data as Record<string, unknown>)?.label as string) || "",
      })),
      layout: s.layoutType,
    };
  },

  importData: (data) => {
    try {
      const { nodes, edges } = dataToFlow(data);
      const lt = (["sections", "hierarchical", "radial", "force"].includes(data.layout) ? data.layout : "sections") as LayoutType;
      const layouted = applyLayoutToNodes(nodes, edges, lt, data.categories);
      set({
        nodes: layouted,
        edges,
        categories: data.categories,
        layoutType: lt,
        selectedNodeId: null,
        focusedNodeId: null,
        collapsedCategories: new Set(data.categories.map((c) => c.id)),
        viewMode: "categories",
      });
      get().saveToStorage();
    } catch (err) {
      console.error("Import error:", err);
    }
  },

  resetToInitial: () => {
    try { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(POSITIONS_KEY); localStorage.removeItem(COLLAPSED_KEY); } catch { /* */ }
    const { nodes, edges } = dataToFlow(initialData);
    const layouted = applyLayoutToNodes(nodes, edges, "sections", initialData.categories);
    set({
      nodes: layouted, edges, categories: initialData.categories,
      layoutType: "sections", selectedNodeId: null, focusedNodeId: null,
      searchTerm: "", highlightCategory: null, filterCategory: null,
      collapsedCategories: new Set(initialData.categories.map((c) => c.id)),
      viewMode: "categories",
    });
  },

  saveToStorage: () => {
    try {
      const s = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s.exportData()));
      const pos: Record<string, { x: number; y: number }> = {};
      s.nodes.forEach((n) => { pos[n.id] = n.position; });
      localStorage.setItem(POSITIONS_KEY, JSON.stringify(pos));
    } catch { /* */ }
  },

  loadFromStorage: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const posStr = localStorage.getItem(POSITIONS_KEY);
      const colStr = localStorage.getItem(COLLAPSED_KEY);
      if (!saved) return false;
      const data: ConceptMapData = JSON.parse(saved);
      const posMap = posStr ? JSON.parse(posStr) as Record<string, { x: number; y: number }> : undefined;
      const { nodes, edges } = dataToFlow(data, posMap);
      const lt = (["sections", "hierarchical", "radial", "force"].includes(data.layout) ? data.layout : "sections") as LayoutType;
      const collapsed = colStr ? new Set<string>(JSON.parse(colStr) as string[]) : new Set(data.categories.map((c) => c.id));
      const hasPos = posMap && Object.keys(posMap).length > 0;
      const finalNodes = hasPos ? nodes : applyLayoutToNodes(nodes, edges, lt, data.categories);
      set({
        nodes: finalNodes, edges, categories: data.categories, layoutType: lt,
        collapsedCategories: collapsed,
        viewMode: collapsed.size > 0 ? "categories" : "graph",
      });
      return true;
    } catch {
      return false;
    }
  },

  getNeighborIds: (nodeId) => {
    const s = get();
    const nb = new Set<string>();
    s.edges.forEach((e) => { if (e.source === nodeId) nb.add(e.target); if (e.target === nodeId) nb.add(e.source); });
    return nb;
  },
}));

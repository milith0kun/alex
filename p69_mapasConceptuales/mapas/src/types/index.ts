import type { Node, Edge } from "@xyflow/react";

// ─── Data model types ───
export interface ConceptCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface ConceptNodeData {
  title: string;
  summary: string;
  categoryId: string;
  [key: string]: unknown;
}

export interface ConceptEdgeData {
  label?: string;
  sourceCategory?: string;
  isCrossCategory?: boolean;
  highlighted?: boolean;
  dimmed?: boolean;
  animated?: boolean;
  [key: string]: unknown;
}

export type ConceptFlowNode = Node<ConceptNodeData>;
export type ConceptFlowEdge = Edge<ConceptEdgeData>;

export type LayoutType = "sections" | "hierarchical" | "radial" | "force";

export interface ConceptMapData {
  categories: ConceptCategory[];
  nodes: { id: string; title: string; summary: string; categoryId: string }[];
  edges: { id: string; source: string; target: string; label: string }[];
  layout: string;
}

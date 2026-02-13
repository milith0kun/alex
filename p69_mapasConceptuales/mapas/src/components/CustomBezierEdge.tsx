import React from "react";
import { getBezierPath, EdgeLabelRenderer } from "@xyflow/react";
import type { EdgeProps } from "@xyflow/react";
import { useConceptStore } from "../store/useConceptStore";

const CAT_COLORS: Record<string, string> = {
  fundamentos: "#10b981",
  "material-genetico": "#3b82f6",
  "flujo-informacion": "#8b5cf6",
  "traduccion-proteinas": "#f59e0b",
  tecnicas: "#ef4444",
  evolucion: "#14b8a6",
  bioinformatica: "#6366f1",
};

const CustomBezierEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  style,
}) => {
  const theme = useConceptStore((s) => s.theme);
  // Safe data extraction with defaults
  const label = (data && typeof data === "object" && "label" in data && typeof data.label === "string")
    ? data.label : "";
  const sourceCategory = (data && typeof data === "object" && "sourceCategory" in data && typeof data.sourceCategory === "string")
    ? data.sourceCategory : "fundamentos";
  const isDimmed = !!(data && typeof data === "object" && "dimmed" in data && data.dimmed);
  const isHighlighted = !!(data && typeof data === "object" && "highlighted" in data && data.highlighted) || !!selected;
  const isCross = !!(data && typeof data === "object" && "isCrossCategory" in data && data.isCrossCategory);

  const baseColor = CAT_COLORS[sourceCategory] || "#6b7280";

  // Compute bezier path
  let edgePath: string;
  let labelX: number;
  let labelY: number;

  try {
    const [path, lx, ly] = getBezierPath({
      sourceX, sourceY, targetX, targetY,
      sourcePosition, targetPosition,
      curvature: 0.35,
    });
    edgePath = path;
    labelX = lx;
    labelY = ly;
  } catch {
    // Fallback straight line
    edgePath = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
    labelX = (sourceX + targetX) / 2;
    labelY = (sourceY + targetY) / 2;
  }

  const strokeWidth = isHighlighted ? 2.8 : isCross ? 1.2 : 1.8;
  const opacity = isDimmed ? (theme === 'dark' ? 0.1 : 0.06) : isHighlighted ? 1 : isCross ? (theme === 'dark' ? 0.4 : 0.35) : (theme === 'dark' ? 0.65 : 0.55);
  const strokeColor = isDimmed ? (theme === 'dark' ? "#334155" : "#d1d5db") : baseColor;
  const markerId = `arr-${id.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <>
      <defs>
        <marker
          id={markerId}
          markerWidth="12"
          markerHeight="9"
          refX="10"
          refY="4.5"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M 0 0.5 L 10 4.5 L 0 8.5 L 2.5 4.5 Z"
            fill={strokeColor}
            opacity={Math.min(opacity + 0.2, 1)}
          />
        </marker>
      </defs>

      {/* Invisible fat hitbox */}
      <path d={edgePath} fill="none" stroke="transparent" strokeWidth={24} style={{ cursor: "pointer" }} />

      {/* Main edge */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        opacity={opacity}
        markerEnd={`url(#${markerId})`}
        style={{
          ...style,
          filter: isHighlighted ? `drop-shadow(0 0 6px ${baseColor}50)` : "none",
          transition: "stroke 0.35s, stroke-width 0.3s, opacity 0.4s",
        }}
        className="react-flow__edge-path"
      />

      {/* Animated dashes for highlighted */}
      {isHighlighted && !isDimmed && (
        <path
          d={edgePath}
          fill="none"
          stroke={baseColor}
          strokeWidth={1.2}
          strokeDasharray="8 5"
          opacity={0.5}
          className="edge-flow-animation"
        />
      )}

      {/* Label */}
      {label && !isDimmed && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
              opacity: isHighlighted ? 1 : 0.7,
              transition: "opacity 0.3s",
            }}
          >
            <div
              className={`edge-label-pill ${isHighlighted ? "edge-label-hl" : ""}`}
              style={{
                borderColor: isHighlighted ? baseColor : (theme === 'dark' ? "rgba(51, 65, 85, 0.8)" : "rgba(200,200,200,0.4)"),
                background: isHighlighted 
                  ? `${baseColor}20` 
                  : (theme === 'dark' ? "rgba(15, 23, 42, 0.93)" : "rgba(255,255,255,0.93)"),
                color: isHighlighted ? (theme === 'dark' ? "white" : baseColor) : (theme === 'dark' ? "#94a3b8" : "#6b7280"),
              }}
            >
              {label}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default React.memo(CustomBezierEdge);

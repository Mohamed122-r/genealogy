import { LayoutNode } from "@/types/tree";

interface TreeLeafProps {
  node: LayoutNode;
  isSelected: boolean;
  isHighlighted: boolean;
  isDimmed: boolean;
  onClick: () => void;
  onMouseEnter: (e: React.MouseEvent, node: LayoutNode) => void;
  onMouseLeave: () => void;
}

function getLeafColors(status: string) {
  switch (status) {
    case "ALIVE":
      return { fill: "#4A8B3F", fillLight: "#7BC96F", fillDark: "#2D5A24", stroke: "#1F4218", vein: "#1A3814" };
    case "DECEASED":
      return { fill: "#E5B80B", fillLight: "#F5D547", fillDark: "#A8841D", stroke: "#8B6B0F", vein: "#6B4F0A" };
    case "DISCONNECTED":
      return { fill: "#8B7355", fillLight: "#A89078", fillDark: "#5D4A2E", stroke: "#4A3A22", vein: "#3A2E1A" };
    default:
      return { fill: "#A8A8A8", fillLight: "#C0C0C0", fillDark: "#808080", stroke: "#707070", vein: "#505050" };
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "ALIVE": return "حي";
    case "DECEASED": return "متوفى";
    case "DISCONNECTED": return "منقطع";
    default: return "؟";
  }
}

function truncateName(name: string, max: number = 14) {
  if (name.length <= max) return name;
  return name.substring(0, max - 2) + "..";
}

export function TreeLeaf({
  node,
  isSelected,
  isHighlighted,
  isDimmed,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: TreeLeafProps) {
  const colors = getLeafColors(node.status);
  const LEAF_WIDTH = 90;
  const LEAF_HEIGHT = 55;

  let filter = "drop-shadow(0 4px 8px rgba(0,0,0,0.35))";
  let opacity = 1;
  let strokeColor = colors.stroke;
  let strokeWidth = 1.5;

  if (isSelected) {
    filter = "drop-shadow(0 0 25px #FFD700) drop-shadow(0 0 10px #C9A227)";
    strokeColor = "#FFD700";
    strokeWidth = 3;
  } else if (isHighlighted) {
    filter = "drop-shadow(0 0 15px #FFD700) drop-shadow(0 0 5px #C9A227)";
    strokeColor = "#FFD700";
    strokeWidth = 2.5;
  } else if (isDimmed) {
    opacity = 0.35;
    filter = "drop-shadow(0 2px 4px rgba(0,0,0,0.15))";
  }

  return (
    <g>
      <line
        x1={node.x}
        y1={node.y + LEAF_HEIGHT / 2 + 5}
        x2={node.x}
        y2={node.y + LEAF_HEIGHT / 2 + 15}
        stroke="#5D3A1A"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity={opacity}
      />

      <g
        transform={`translate(${node.x - LEAF_WIDTH / 2}, ${node.y - LEAF_HEIGHT / 2})`}
        className="cursor-pointer"
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onMouseEnter={(e) => onMouseEnter(e, node)}
        onMouseLeave={onMouseLeave}
        style={{ filter, opacity, transition: "all 0.3s ease" }}
      >
        <path
          d={`M ${LEAF_WIDTH / 2} 0 
             C ${LEAF_WIDTH * 0.7} ${LEAF_HEIGHT * 0.1}, 
               ${LEAF_WIDTH} ${LEAF_HEIGHT * 0.35}, 
               ${LEAF_WIDTH * 0.95} ${LEAF_HEIGHT * 0.5} 
             C ${LEAF_WIDTH} ${LEAF_HEIGHT * 0.65}, 
               ${LEAF_WIDTH * 0.7} ${LEAF_HEIGHT * 0.9}, 
               ${LEAF_WIDTH / 2} ${LEAF_HEIGHT} 
             C ${LEAF_WIDTH * 0.3} ${LEAF_HEIGHT * 0.9}, 
               0 ${LEAF_HEIGHT * 0.65}, 
               ${LEAF_WIDTH * 0.05} ${LEAF_HEIGHT * 0.5} 
             C 0 ${LEAF_HEIGHT * 0.35}, 
               ${LEAF_WIDTH * 0.3} ${LEAF_HEIGHT * 0.1}, 
               ${LEAF_WIDTH / 2} 0 Z`}
          fill={colors.fill}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
        <path
          d={`M ${LEAF_WIDTH / 2} 6 
             C ${LEAF_WIDTH * 0.65} ${LEAF_HEIGHT * 0.25}, 
               ${LEAF_WIDTH * 0.75} ${LEAF_HEIGHT * 0.4}, 
               ${LEAF_WIDTH / 2} ${LEAF_HEIGHT * 0.45} 
             C ${LEAF_WIDTH * 0.35} ${LEAF_HEIGHT * 0.4}, 
               ${LEAF_WIDTH * 0.3} ${LEAF_HEIGHT * 0.25}, 
               ${LEAF_WIDTH / 2} 6 Z`}
          fill={colors.fillLight}
          opacity="0.5"
        />
        <path
          d={`M ${LEAF_WIDTH / 2} ${LEAF_HEIGHT - 6} 
             C ${LEAF_WIDTH * 0.65} ${LEAF_HEIGHT * 0.75}, 
               ${LEAF_WIDTH * 0.75} ${LEAF_HEIGHT * 0.6}, 
               ${LEAF_WIDTH / 2} ${LEAF_HEIGHT * 0.55} 
             C ${LEAF_WIDTH * 0.35} ${LEAF_HEIGHT * 0.6}, 
               ${LEAF_WIDTH * 0.3} ${LEAF_HEIGHT * 0.75}, 
               ${LEAF_WIDTH / 2} ${LEAF_HEIGHT - 6} Z`}
          fill={colors.fillDark}
          opacity="0.4"
        />
        <path
          d={`M ${LEAF_WIDTH / 2} 4 L ${LEAF_WIDTH / 2} ${LEAF_HEIGHT - 4}`}
          stroke={colors.vein}
          strokeWidth="1"
          opacity="0.6"
        />
        <text
          x={LEAF_WIDTH / 2}
          y={LEAF_HEIGHT / 2 - 2}
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="10.5"
          fontWeight="bold"
          style={{ fontFamily: "Amiri, serif", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
          className="select-none pointer-events-none"
        >
          {truncateName(node.fullName, 14)}
        </text>
        <text
          x={LEAF_WIDTH / 2}
          y={LEAF_HEIGHT / 2 + 11}
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="7.5"
          opacity="0.9"
          style={{ fontFamily: "Cairo, sans-serif", textShadow: "0 1px 2px rgba(0,0,0,0.7)" }}
          className="select-none pointer-events-none"
        >
          {getStatusLabel(node.status)}
        </text>
      </g>
    </g>
  );
}

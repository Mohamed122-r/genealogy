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
      return { fill: "#4A8B3F", fillLight: "#7BC96F", fillDark: "#2D5A24", stroke: "#1F4218" };
    case "DECEASED":
      return { fill: "#E5B80B", fillLight: "#F5D547", fillDark: "#A8841D", stroke: "#8B6B0F" };
    case "DISCONNECTED":
      return { fill: "#8B7355", fillLight: "#A89078", fillDark: "#5D4A2E", stroke: "#4A3A22" };
    default:
      return { fill: "#A8A8A8", fillLight: "#C0C0C0", fillDark: "#808080", stroke: "#707070" };
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "ALIVE": return "(حي)";
    case "DECEASED": return "(متوفى)";
    case "DISCONNECTED": return "(منقطع)";
    default: return "(غير معروف)";
  }
}

function truncateName(name: string, max: number = 12) {
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

  const LEAF_WIDTH = 70;
  const LEAF_HEIGHT = 75;

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

  const leafPath = `
    M ${LEAF_WIDTH / 2} 0
    C ${LEAF_WIDTH * 0.78} ${LEAF_HEIGHT * 0.12},
      ${LEAF_WIDTH * 0.98} ${LEAF_HEIGHT * 0.3},
      ${LEAF_WIDTH * 0.98} ${LEAF_HEIGHT * 0.5}
    C ${LEAF_WIDTH * 0.98} ${LEAF_HEIGHT * 0.7},
      ${LEAF_WIDTH * 0.78} ${LEAF_HEIGHT * 0.88},
      ${LEAF_WIDTH / 2} ${LEAF_HEIGHT}
    C ${LEAF_WIDTH * 0.22} ${LEAF_HEIGHT * 0.88},
      ${LEAF_WIDTH * 0.02} ${LEAF_HEIGHT * 0.7},
      ${LEAF_WIDTH * 0.02} ${LEAF_HEIGHT * 0.5}
    C ${LEAF_WIDTH * 0.02} ${LEAF_HEIGHT * 0.3},
      ${LEAF_WIDTH * 0.22} ${LEAF_HEIGHT * 0.12},
      ${LEAF_WIDTH / 2} 0 Z
  `;

  return (
    <g>
      <line
        x1={node.x}
        y1={node.y + LEAF_HEIGHT / 2 + 3}
        x2={node.x}
        y2={node.y + LEAF_HEIGHT / 2 + 18}
        stroke="#5D3A1A"
        strokeWidth="3"
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
        {/* جسم الورقة */}
        <path
          d={leafPath}
          fill={colors.fill}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />

        {/* لمعة علوية (بدون عروق جانبية) */}
        <path
          d={`M ${LEAF_WIDTH / 2} 6
             C ${LEAF_WIDTH * 0.72} ${LEAF_HEIGHT * 0.18},
               ${LEAF_WIDTH * 0.88} ${LEAF_HEIGHT * 0.32},
               ${LEAF_WIDTH * 0.88} ${LEAF_HEIGHT * 0.45}
             C ${LEAF_WIDTH * 0.72} ${LEAF_HEIGHT * 0.35},
               ${LEAF_WIDTH * 0.5} ${LEAF_HEIGHT * 0.3},
               ${LEAF_WIDTH / 2} ${LEAF_HEIGHT * 0.3}
             C ${LEAF_WIDTH * 0.5} ${LEAF_HEIGHT * 0.3},
               ${LEAF_WIDTH * 0.28} ${LEAF_HEIGHT * 0.35},
               ${LEAF_WIDTH * 0.12} ${LEAF_HEIGHT * 0.45}
             C ${LEAF_WIDTH * 0.12} ${LEAF_HEIGHT * 0.32},
               ${LEAF_WIDTH * 0.28} ${LEAF_HEIGHT * 0.18},
               ${LEAF_WIDTH / 2} 6 Z`}
          fill={colors.fillLight}
          opacity="0.5"
        />

        {/* ظل سفلي */}
        <path
          d={`M ${LEAF_WIDTH / 2} ${LEAF_HEIGHT - 8}
             C ${LEAF_WIDTH * 0.7} ${LEAF_HEIGHT * 0.82},
               ${LEAF_WIDTH * 0.85} ${LEAF_HEIGHT * 0.68},
               ${LEAF_WIDTH * 0.85} ${LEAF_HEIGHT * 0.55}
             C ${LEAF_WIDTH * 0.65} ${LEAF_HEIGHT * 0.65},
               ${LEAF_WIDTH / 2} ${LEAF_HEIGHT * 0.7},
               ${LEAF_WIDTH / 2} ${LEAF_HEIGHT * 0.7}
             C ${LEAF_WIDTH / 2} ${LEAF_HEIGHT * 0.7},
               ${LEAF_WIDTH * 0.35} ${LEAF_HEIGHT * 0.65},
               ${LEAF_WIDTH * 0.15} ${LEAF_HEIGHT * 0.55}
             C ${LEAF_WIDTH * 0.15} ${LEAF_HEIGHT * 0.68},
               ${LEAF_WIDTH * 0.3} ${LEAF_HEIGHT * 0.82},
               ${LEAF_WIDTH / 2} ${LEAF_HEIGHT - 8} Z`}
          fill={colors.fillDark}
          opacity="0.4"
        />

        {/* الاسم (بدون عروق) */}
        <text
          x={LEAF_WIDTH / 2}
          y={LEAF_HEIGHT / 2 - 4}
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="10"
          fontWeight="bold"
          style={{
            fontFamily: "Amiri, serif",
            textShadow: "0 1px 3px rgba(0,0,0,0.9)",
          }}
          className="select-none pointer-events-none"
        >
          {truncateName(node.fullName, 12)}
        </text>

        {/* الحالة بين قوسين */}
        <text
          x={LEAF_WIDTH / 2}
          y={LEAF_HEIGHT / 2 + 14}
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="8"
          opacity="0.95"
          style={{
            fontFamily: "Cairo, sans-serif",
            textShadow: "0 1px 2px rgba(0,0,0,0.8)",
          }}
          className="select-none pointer-events-none"
        >
          {getStatusLabel(node.status)}
        </text>
      </g>
    </g>
  );
}

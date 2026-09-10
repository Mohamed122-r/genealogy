import { LayoutNode } from "@/types/tree";

interface TreeLeafProps {
  node: LayoutNode;
  isSelected: boolean;
  onClick: () => void;
}

// ألوان الحالات
function getStatusColor(status: string): string {
  switch (status) {
    case "ALIVE":
      return "#228B22";
    case "DECEASED":
      return "#8B4513";
    case "DISCONNECTED":
      return "#696969";
    default:
      return "#D3D3D3";
  }
}

// ترجمة الحالة
function getStatusLabel(status: string): string {
  switch (status) {
    case "ALIVE":
      return "حي";
    case "DECEASED":
      return "متوفى";
    case "DISCONNECTED":
      return "منقطع";
    default:
      return "غير معروف";
  }
}

// اختصار الاسم
function truncateName(name: string, maxLength: number = 14): string {
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength - 3) + "...";
}

export function TreeLeaf({ node, isSelected, onClick }: TreeLeafProps) {
  const statusColor = getStatusColor(node.status);

  return (
    <g
      transform={`translate(${node.x - node.width / 2}, ${
        node.y - node.height / 2
      })`}
      className="cursor-pointer transition-transform duration-200 hover:opacity-90"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{ filter: isSelected ? "drop-shadow(0 0 10px #FFD700)" : "drop-shadow(0 4px 6px rgba(0,0,0,0.15))" }}
    >
      {/* شكل الورقة */}
      <path
        d={`M ${node.width / 2} 0 
           C ${node.width * 0.9} ${node.height * 0.2}, 
             ${node.width} ${node.height * 0.5}, 
             ${node.width / 2} ${node.height} 
           C 0 ${node.height * 0.5}, 
             ${node.width * 0.1} ${node.height * 0.2}, 
             ${node.width / 2} 0 Z`}
        fill={statusColor}
        fillOpacity={isSelected ? 1 : 0.9}
        stroke={isSelected ? "#FFD700" : "#5D3A1A"}
        strokeWidth={isSelected ? 3 : 1.5}
      />

      {/* عرق الورقة (خط أبيض في المنتصف) */}
      <path
        d={`M ${node.width / 2} ${node.height * 0.1} 
           L ${node.width / 2} ${node.height * 0.9}`}
        stroke="#FFFFFF"
        strokeWidth="1"
        opacity="0.5"
      />

      {/* ساق الورقة */}
      <path
        d={`M ${node.width / 2} ${node.height * 0.9} 
           L ${node.width / 2} ${node.height * 1.1}`}
        stroke="#5D3A1A"
        strokeWidth="2"
      />

      {/* الاسم الكامل */}
      <text
        x={node.width / 2}
        y={node.height / 2 - 4}
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="10"
        fontWeight="bold"
        style={{ fontFamily: "Amiri, serif" }}
        className="select-none"
      >
        {truncateName(node.fullName, 14)}
      </text>

      {/* الحالة (حي / متوفى / إلخ) */}
      <text
        x={node.width / 2}
        y={node.height / 2 + 8}
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="8"
        opacity="0.9"
        style={{ fontFamily: "Cairo, sans-serif" }}
      >
        {getStatusLabel(node.status)}
      </text>
    </g>
  );
}
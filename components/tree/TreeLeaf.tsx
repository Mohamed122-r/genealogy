import { LayoutNode } from "@/types/tree";

interface TreeLeafProps {
  node: LayoutNode;
  isSelected: boolean;
  onClick: () => void;
}

// ألوان الحالات - أوراق خضراء للأحياء، صفراء للمتوفين
function getLeafColor(status: string): { fill: string; stroke: string } {
  switch (status) {
    case "ALIVE":
      return { fill: "#4A8B3F", stroke: "#2D5A24" }; // أخضر
    case "DECEASED":
      return { fill: "#D4A017", stroke: "#8B6B0F" }; // أصفر ذهبي
    case "DISCONNECTED":
      return { fill: "#8B7355", stroke: "#5D4A2E" }; // بني فاتح
    default:
      return { fill: "#A8A8A8", stroke: "#707070" }; // رمادي
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "ALIVE": return "حي";
    case "DECEASED": return "متوفى";
    case "DISCONNECTED": return "منقطع";
    default: return "غير معروف";
  }
}

function truncateName(name: string, maxLength: number = 12): string {
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength - 2) + "..";
}

export function TreeLeaf({ node, isSelected, onClick }: TreeLeafProps) {
  const colors = getLeafColor(node.status);
  const leafWidth = 75;
  const leafHeight = 42;

  return (
    <g
      transform={`translate(${node.x - leafWidth / 2}, ${node.y - leafHeight / 2})`}
      className="cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        filter: isSelected
          ? "drop-shadow(0 0 12px #FFD700) drop-shadow(0 0 4px #C9A227)"
          : "drop-shadow(0 3px 5px rgba(0,0,0,0.25))",
      }}
    >
      {/* شكل الورقة (بيضاوي مدبب من الطرفين) */}
      <path
        d={`M ${leafWidth / 2} 2
           C ${leafWidth * 0.85} ${leafHeight * 0.15}, 
             ${leafWidth - 2} ${leafHeight * 0.5}, 
             ${leafWidth / 2} ${leafHeight - 2}
           C 2 ${leafHeight * 0.5}, 
             ${leafWidth * 0.15} ${leafHeight * 0.15}, 
             ${leafWidth / 2} 2 Z`}
        fill={colors.fill}
        stroke={isSelected ? "#FFD700" : colors.stroke}
        strokeWidth={isSelected ? 3 : 1.5}
      />

      {/* عرق الورقة المركزي */}
      <path
        d={`M ${leafWidth / 2} 6 L ${leafWidth / 2} ${leafHeight - 6}`}
        stroke={colors.stroke}
        strokeWidth="1.2"
        opacity="0.7"
      />

      {/* عروق جانبية */}
      <path
        d={`M ${leafWidth / 2} ${leafHeight * 0.4} L ${leafWidth * 0.75} ${leafHeight * 0.35}`}
        stroke={colors.stroke}
        strokeWidth="0.8"
        opacity="0.5"
      />
      <path
        d={`M ${leafWidth / 2} ${leafHeight * 0.4} L ${leafWidth * 0.25} ${leafHeight * 0.35}`}
        stroke={colors.stroke}
        strokeWidth="0.8"
        opacity="0.5"
      />

      {/* الاسم الكامل */}
      <text
        x={leafWidth / 2}
        y={leafHeight / 2 - 2}
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="9"
        fontWeight="bold"
        style={{
          fontFamily: "Amiri, serif",
          textShadow: "0 1px 2px rgba(0,0,0,0.5)",
        }}
        className="select-none pointer-events-none"
      >
        {truncateName(node.fullName, 12)}
      </text>

      {/* الحالة */}
      <text
        x={leafWidth / 2}
        y={leafHeight / 2 + 10}
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="7"
        opacity="0.9"
        style={{
          fontFamily: "Cairo, sans-serif",
          textShadow: "0 1px 1px rgba(0,0,0,0.4)",
        }}
        className="select-none pointer-events-none"
      >
        {getStatusLabel(node.status)}
      </text>
    </g>
  );
}

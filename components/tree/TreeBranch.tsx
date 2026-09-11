import { LayoutNode } from "@/types/tree";

interface TreeBranchProps {
  parent: LayoutNode;
  child: LayoutNode;
}

export function TreeBranch({ parent, child }: TreeBranchProps) {
  const startX = parent.x;
  const startY = parent.y + 20;
  const endX = child.x;
  const endY = child.y - 20;

  const midY = (startY + endY) / 2;

  // منحنى بيزير بشكل فرع طبيعي
  const path = `M ${startX} ${startY} 
                C ${startX} ${midY}, 
                  ${endX} ${midY}, 
                  ${endX} ${endY}`;

  return (
    <g>
      {/* الظل */}
      <path
        d={path}
        fill="none"
        stroke="#3D1F0A"
        strokeWidth={4}
        strokeLinecap="round"
        opacity={0.2}
        transform="translate(2, 2)"
      />
      {/* الفرع الرئيسي */}
      <path
        d={path}
        fill="none"
        stroke="#6B3E1E"
        strokeWidth={3}
        strokeLinecap="round"
      />
      {/* التدرج الضوئي على الفرع */}
      <path
        d={path}
        fill="none"
        stroke="#8B5A2B"
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.6}
      />
    </g>
  );
}

import { LayoutNode } from "@/types/tree";

interface TreeBranchProps {
  parent: LayoutNode;
  child: LayoutNode;
}

export function TreeBranch({ parent, child }: TreeBranchProps) {
  // نقطة البداية (أسفل الأب)
  const startX = parent.x;
  const startY = parent.y + parent.height / 2;

  // نقطة النهاية (أعلى الابن)
  const endX = child.x;
  const endY = child.y - child.height / 2;

  // منحنى بيزير ليعطي شكل فرع طبيعي
  const midY = (startY + endY) / 2;
  const path = `M ${startX} ${startY} 
                C ${startX} ${midY}, 
                  ${endX} ${midY}, 
                  ${endX} ${endY}`;

  return (
    <g>
      {/* الفرع الرئيسي */}
      <path
        d={path}
        fill="none"
        stroke="#8B5A2B"
        strokeWidth={2.5}
        strokeLinecap="round"
        opacity={0.85}
      />
      {/* ظل الفرع */}
      <path
        d={path}
        fill="none"
        stroke="#5D3A1A"
        strokeWidth={1}
        strokeLinecap="round"
        opacity={0.3}
        transform="translate(1, 1)"
      />
    </g>
  );
}
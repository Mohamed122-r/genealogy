import { PersonNode, LayoutNode, TreeLayoutOptions } from "@/types/tree";

const HORIZONTAL_SPACING = 160;
const VERTICAL_SPACING = 200;
const LEAF_WIDTH = 90;
const LEAF_HEIGHT = 55;

export function calculateTreeLayout(
  nodes: PersonNode[],
  options: TreeLayoutOptions = {}
): LayoutNode[] {
  if (nodes.length === 0) return [];

  const roots = nodes.filter((node) => !node.fatherId);
  if (roots.length === 0) return [];

  const layoutNodes: LayoutNode[] = [];

  function getMaxDepth(person: PersonNode, d: number = 0): number {
    const children = nodes.filter((n) => n.fatherId === person.id);
    if (children.length === 0) return d;
    return Math.max(...children.map((c) => getMaxDepth(c, d + 1)));
  }

  const maxDepth = Math.max(...roots.map((r) => getMaxDepth(r)));

  // دالة التخطيط: توزع الأبناء يمين ويسار
  function layoutSubtree(
    person: PersonNode,
    depth: number,
    centerX: number
  ): number {
    const children = nodes.filter((n) => n.fatherId === person.id);

    const node: LayoutNode = {
      ...person,
      depth,
      x: centerX,
      y: (maxDepth - depth) * VERTICAL_SPACING,
      width: LEAF_WIDTH,
      height: LEAF_HEIGHT,
    };

    if (children.length === 0) {
      layoutNodes.push(node);
      return centerX;
    }

    // توزيع الأبناء: النصف يمين، النصف يسار
    const totalWidth = (children.length - 1) * HORIZONTAL_SPACING;
    const startX = centerX - totalWidth / 2;

    children.forEach((child, index) => {
      const childX = startX + index * HORIZONTAL_SPACING;
      layoutSubtree(child, depth + 1, childX);
    });

    layoutNodes.push(node);
    return centerX;
  }

  let globalLeft = 0;
  roots.forEach((root) => {
    // نحسب عرض الشجرة الفرعية أولاً
    const maxDepthForRoot = getMaxDepth(root);
    const totalLeaves = nodes.filter(
      (n) => !nodes.some((c) => c.fatherId === n.id)
    ).length;

    const subtreeWidth = Math.max(
      (maxDepthForRoot + 1) * HORIZONTAL_SPACING,
      totalLeaves * HORIZONTAL_SPACING
    );

    const rootX = globalLeft + subtreeWidth / 2;
    layoutSubtree(root, 0, rootX);
    globalLeft += subtreeWidth + HORIZONTAL_SPACING;
  });

  return layoutNodes;
}

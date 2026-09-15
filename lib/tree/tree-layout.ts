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

  function layoutSubtree(
    person: PersonNode,
    depth: number,
    leftBoundary: number
  ): number {
    const children = nodes.filter((n) => n.fatherId === person.id);

    const node: LayoutNode = {
      ...person,
      depth,
      x: 0,
      y: (maxDepth - depth) * VERTICAL_SPACING,
      width: LEAF_WIDTH,
      height: LEAF_HEIGHT,
    };

    if (children.length === 0) {
      node.x = leftBoundary + HORIZONTAL_SPACING / 2;
      layoutNodes.push(node);
      return node.x;
    }

    let currentLeft = leftBoundary;
    const childLayouts: number[] = [];

    children.forEach((child) => {
      const childX = layoutSubtree(child, depth + 1, currentLeft);
      childLayouts.push(childX);
      currentLeft = childX + HORIZONTAL_SPACING / 2;
    });

    const firstChildX = childLayouts[0];
    const lastChildX = childLayouts[childLayouts.length - 1];
    node.x = (firstChildX + lastChildX) / 2;

    layoutNodes.push(node);
    return node.x;
  }

  let globalLeft = 0;
  roots.forEach((root) => {
    const rootX = layoutSubtree(root, 0, globalLeft);
    globalLeft = rootX + HORIZONTAL_SPACING;
  });

  if (layoutNodes.length > 0) {
    const minX = Math.min(...layoutNodes.map((n) => n.x));
    layoutNodes.forEach((node) => {
      node.x = node.x - minX + LEAF_WIDTH;
    });
  }

  return layoutNodes;
}

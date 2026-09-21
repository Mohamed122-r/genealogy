import { PersonNode, LayoutNode, TreeLayoutOptions } from "@/types/tree";

// =====================================================
// الإعدادات الافتراضية
// =====================================================
const DEFAULT_LEAF_WIDTH = 75;
const DEFAULT_LEAF_HEIGHT = 70;
const DEFAULT_HORIZONTAL_GAP = 30; // المسافة الأفقية بين الأوراق
const DEFAULT_VERTICAL_GAP = 170;  // المسافة العمودية بين الأجيال

// =====================================================
// Extended Layout Node (Internal Use)
// =====================================================
interface ExtendedLayoutNode extends LayoutNode {
  subtreeWidth: number;   // عرض الشجرة الفرعية كاملاً
  leftBoundary: number;   // الحد الأيسر للشجرة الفرعية
  rightBoundary: number;  // الحد الأيمن للشجرة الفرعية
  centerOffset: number;   // إزاحة مركز الأب عن مركز الأبناء
}

// =====================================================
// الدالة الرئيسية: calculateTreeLayout
// =====================================================
export function calculateTreeLayout(
  nodes: PersonNode[],
  options: TreeLayoutOptions = {}
): LayoutNode[] {
  if (nodes.length === 0) return [];

  const leafWidth = options.leafWidth ?? DEFAULT_LEAF_WIDTH;
  const leafHeight = options.leafHeight ?? DEFAULT_LEAF_HEIGHT;
  const horizontalGap = options.horizontalGap ?? DEFAULT_HORIZONTAL_GAP;
  const verticalGap = options.verticalGap ?? DEFAULT_VERTICAL_GAP;

  // =====================================================
  // 1. بناء childrenMap للوصول السريع O(1)
  // =====================================================
  const childrenMap = new Map<string, PersonNode[]>();
  const nodeMap = new Map<string, PersonNode>();

  nodes.forEach((node) => {
    nodeMap.set(node.id, node);
  });

  nodes.forEach((node) => {
    if (node.fatherId) {
      if (!childrenMap.has(node.fatherId)) {
        childrenMap.set(node.fatherId, []);
      }
      childrenMap.get(node.fatherId)!.push(node);
    }
  });

  // =====================================================
  // 2. إيجاد الجذور
  // =====================================================
  const roots = nodes.filter((node) => !node.fatherId);
  if (roots.length === 0) return [];

  // =====================================================
  // 3. حساب العمق الأقصى لكل شجرة
  // =====================================================
  function getMaxDepth(person: PersonNode, d: number = 0): number {
    const children = childrenMap.get(person.id) || [];
    if (children.length === 0) return d;
    return Math.max(...children.map((c) => getMaxDepth(c, d + 1)));
  }

  // =====================================================
  // 4. حساب عرض كل Subtree (Post-order)
  // =====================================================
  const subtreeWidths = new Map<string, number>();

  function computeSubtreeWidth(person: PersonNode): number {
    const children = childrenMap.get(person.id) || [];

    if (children.length === 0) {
      // ورقة: عرضها = عرض الورقة
      const width = leafWidth + horizontalGap;
      subtreeWidths.set(person.id, width);
      return width;
    }

    // عقدة داخلية: عرضها = مجموع عروض أبنائها
    let totalWidth = 0;
    children.forEach((child) => {
      totalWidth += computeSubtreeWidth(child);
    });

    // إذا كان مجموع الأبناء أصغر من عرض الأب، نأخذ عرض الأب
    const minWidth = leafWidth + horizontalGap;
    const finalWidth = Math.max(totalWidth, minWidth);

    subtreeWidths.set(person.id, finalWidth);
    return finalWidth;
  }

  // حساب العرض لكل جذر
  roots.forEach((root) => computeSubtreeWidth(root));

  // =====================================================
  // 5. توزيع المواقع (Pre-order)
  // =====================================================
  const extendedNodes = new Map<string, ExtendedLayoutNode>();

  function layoutSubtree(
    person: PersonNode,
    depth: number,
    leftBoundary: number
  ): ExtendedLayoutNode {
    const children = childrenMap.get(person.id) || [];
    const subtreeWidth = subtreeWidths.get(person.id) || (leafWidth + horizontalGap);

    // إنشاء العقدة
    const node: ExtendedLayoutNode = {
      ...person,
      depth,
      x: 0,
      y: depth * verticalGap,
      width: leafWidth,
      height: leafHeight,
      subtreeWidth,
      leftBoundary,
      rightBoundary: leftBoundary + subtreeWidth,
      centerOffset: 0,
    };

    if (children.length === 0) {
      // ورقة: توضع في منتصف المساحة المتاحة
      node.x = leftBoundary + subtreeWidth / 2;
      extendedNodes.set(person.id, node);
      return node;
    }

    // عقدة داخلية: توزيع الأبناء
    let currentLeft = leftBoundary;
    const childNodes: ExtendedLayoutNode[] = [];

    // حساب المجموع الكلي لعرض الأبناء
    let totalChildrenWidth = 0;
    children.forEach((child) => {
      totalChildrenWidth += subtreeWidths.get(child.id) || (leafWidth + horizontalGap);
    });

    // إذا كان الأب لديه مساحة أكبر من أبنائه، نوسّط الأبناء
    let childStartLeft = leftBoundary;
    if (subtreeWidth > totalChildrenWidth) {
      childStartLeft = leftBoundary + (subtreeWidth - totalChildrenWidth) / 2;
    }

    currentLeft = childStartLeft;

    children.forEach((child) => {
      const childNode = layoutSubtree(child, depth + 1, currentLeft);
      childNodes.push(childNode);
      currentLeft += childNode.subtreeWidth;
    });

    // مركز الأب = منتصف المساحة بين أول وآخر ابن
    const firstChildCenter = childNodes[0].x;
    const lastChildCenter = childNodes[childNodes.length - 1].x;
    node.x = (firstChildCenter + lastChildCenter) / 2;

    // حساب Center Offset (لرسم الفروع)
    node.centerOffset = node.x - (leftBoundary + subtreeWidth / 2);

    extendedNodes.set(person.id, node);
    return node;
  }

  // توزيع كل الجذور
  let globalLeft = 0;
  roots.forEach((root) => {
    const rootWidth = subtreeWidths.get(root.id) || (leafWidth + horizontalGap);
    layoutSubtree(root, 0, globalLeft);
    globalLeft += rootWidth;
  });

  // =====================================================
  // 6. قلب Y (الجذر في الأسفل)
  // =====================================================
  const maxDepth = Math.max(...roots.map((r) => getMaxDepth(r)));

  const result: LayoutNode[] = [];
  extendedNodes.forEach((extNode) => {
    // قلب Y
    const flippedY = (maxDepth - extNode.depth) * verticalGap;

    result.push({
      ...extNode,
      y: flippedY,
    });
  });

  return result;
}

// =====================================================
// دالة مساعدة: validateTreeLayout
// تتحقق من عدم وجود تداخل بين الأوراق
// =====================================================
export function validateTreeLayout(nodes: LayoutNode[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // التحقق من عدم تداخل الأوراق في نفس المستوى
  const nodesByLevel = new Map<number, LayoutNode[]>();

  nodes.forEach((node) => {
    if (!nodesByLevel.has(node.depth)) {
      nodesByLevel.set(node.depth, []);
    }
    nodesByLevel.get(node.depth)!.push(node);
  });

  nodesByLevel.forEach((levelNodes, depth) => {
    // ترتيب حسب X
    const sorted = [...levelNodes].sort((a, b) => a.x - b.x);

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];

      const currentRight = current.x + current.width / 2;
      const nextLeft = next.x - next.width / 2;

      if (currentRight > nextLeft) {
        errors.push(
          `Overlap at depth ${depth}: ${current.fullName} & ${next.fullName}`
        );
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

// =====================================================
// دالة مساعدة: getTreeBounds
// =====================================================
export function getTreeBounds(nodes: LayoutNode[]) {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  const minX = Math.min(...nodes.map((n) => n.x - n.width / 2));
  const maxX = Math.max(...nodes.map((n) => n.x + n.width / 2));
  const minY = Math.min(...nodes.map((n) => n.y - n.height / 2));
  const maxY = Math.max(...nodes.map((n) => n.y + n.height / 2));

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

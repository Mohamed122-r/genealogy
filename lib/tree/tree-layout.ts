import { PersonNode, LayoutNode, TreeLayoutOptions } from "@/types/tree";

// =====================================================
// ثوابت التخطيط (Layout Constants)
// =====================================================
const HORIZONTAL_SPACING = 180; // المسافة الأفقية بين الأخوة
const VERTICAL_SPACING = 220;   // المسافة العمودية بين الأجيال
const LEAF_WIDTH = 110;          // عرض الورقة
const LEAF_HEIGHT = 55;          // ارتفاع الورقة

// =====================================================
// الدالة الرئيسية: حساب تخطيط الشجرة
// =====================================================
export function calculateTreeLayout(
  nodes: PersonNode[],
  options: TreeLayoutOptions = {}
): LayoutNode[] {
  // إذا لم تكن هناك بيانات، نرجع مصفوفة فارغة
  if (nodes.length === 0) return [];

  // 1. تحديد الجذور (الأشخاص الذين ليس لهم أب)
  const roots = nodes.filter((node) => !node.fatherId);

  // إذا لم يوجد جذر، نرجع مصفوفة فارغة
  if (roots.length === 0) return [];

  // 2. مصفوفة العقد الموزعة
  const layoutNodes: LayoutNode[] = [];

  // 3. دالة توزيع العقد الفرعية (Recursive)
  function layoutSubtree(
    person: PersonNode,
    depth: number,
    leftBoundary: number
  ): number {
    // إيجاد الأبناء
    const children = nodes.filter((n) => n.fatherId === person.id);

    // إنشاء عقدة التخطيط
    const node: LayoutNode = {
      ...person,
      depth,
      x: 0,
      y: depth * VERTICAL_SPACING,
      width: LEAF_WIDTH,
      height: LEAF_HEIGHT,
    };

    // الحالة 1: عقدة ورقية (ليس لها أبناء)
    if (children.length === 0) {
      node.x = leftBoundary + HORIZONTAL_SPACING / 2;
      layoutNodes.push(node);
      return node.x;
    }

    // الحالة 2: عقدة داخلية (لها أبناء)
    let currentLeft = leftBoundary;
    const childLayouts: number[] = [];

    children.forEach((child) => {
      const childX = layoutSubtree(child, depth + 1, currentLeft);
      childLayouts.push(childX);
      currentLeft = childX + HORIZONTAL_SPACING / 2;
    });

    // مركز الأب يقع بين أقصى الطفل الأيسر وأقصى الطفل الأيمن
    const firstChildX = childLayouts[0];
    const lastChildX = childLayouts[childLayouts.length - 1];
    node.x = (firstChildX + lastChildX) / 2;

    layoutNodes.push(node);
    return node.x;
  }

  // 4. توزيع كل الجذور
  let globalLeft = 0;
  roots.forEach((root) => {
    const rootX = layoutSubtree(root, 0, globalLeft);
    globalLeft = rootX + HORIZONTAL_SPACING / 2;
  });

  // 5. إعادة ضبط الإحداثيات لتصبح جميع القيم موجبة
  if (layoutNodes.length > 0) {
    const minX = Math.min(...layoutNodes.map((n) => n.x));
    layoutNodes.forEach((node) => {
      node.x = node.x - minX + LEAF_WIDTH;
    });
  }

  return layoutNodes;
}
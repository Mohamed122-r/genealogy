import { db } from "@/lib/db";

export interface TreeStatistics {
  totalPeople: number;
  totalGenerations: number;
  aliveCount: number;
  deceasedCount: number;
  maleCount: number;
  femaleCount: number;
  rootCount: number;
  latestAddition: Date | null;
  statusBreakdown: {
    alive: number;
    deceased: number;
    disconnected: number;
    unknown: number;
  };
}

export async function getTreeStatistics(): Promise<TreeStatistics> {
  // جلب جميع الأشخاص النشطين
  const people = await db.person.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      fatherId: true,
      gender: true,
      status: true,
      createdAt: true,
    },
  });

  // إجمالي الأشخاص
  const totalPeople = people.length;

  // عدد الجذور
  const rootCount = people.filter((p) => !p.fatherId).length;

  // حساب عدد الأجيال (أقصى عمق)
  const childrenMap = new Map<string, string[]>();
  people.forEach((p) => {
    if (p.fatherId) {
      if (!childrenMap.has(p.fatherId)) {
        childrenMap.set(p.fatherId, []);
      }
      childrenMap.get(p.fatherId)!.push(p.id);
    }
  });

  const roots = people.filter((p) => !p.fatherId);

  function getMaxDepth(personId: string, depth: number = 0): number {
    const children = childrenMap.get(personId) || [];
    if (children.length === 0) return depth;
    return Math.max(...children.map((c) => getMaxDepth(c, depth + 1)));
  }

  const totalGenerations =
    roots.length > 0 ? Math.max(...roots.map((r) => getMaxDepth(r.id))) + 1 : 0;

  // إحصائيات الحالة
  const statusBreakdown = {
    alive: people.filter((p) => p.status === "ALIVE").length,
    deceased: people.filter((p) => p.status === "DECEASED").length,
    disconnected: people.filter((p) => p.status === "DISCONNECTED").length,
    unknown: people.filter((p) => p.status === "UNKNOWN").length,
  };

  // إحصائيات الجنس
  const maleCount = people.filter((p) => p.gender === "MALE").length;
  const femaleCount = people.filter((p) => p.gender === "FEMALE").length;

  // آخر إضافة
  const latestAddition =
    people.length > 0
      ? people.reduce((latest, p) =>
          p.createdAt > latest.createdAt ? p : latest
        ).createdAt
      : null;

  return {
    totalPeople,
    totalGenerations,
    aliveCount: statusBreakdown.alive,
    deceasedCount: statusBreakdown.deceased,
    maleCount,
    femaleCount,
    rootCount,
    latestAddition,
    statusBreakdown,
  };
}

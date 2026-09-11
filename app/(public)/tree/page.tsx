import { db } from "@/lib/db";
import { PersonNode } from "@/types/tree";
import { TreeClient } from "./TreeClient";

// منع التوليد الثابت لهذه الصفحة
export const dynamic = "force-dynamic";

async function getTreeData(): Promise<PersonNode[]> {
  const people = await db.person.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      fullName: true,
      gender: true,
      status: true,
      fatherId: true,
      branchId: true,
      birthDate: true,
      deathDate: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return people.map((p) => ({
    ...p,
    birthDate: p.birthDate as Date | null,
    deathDate: p.deathDate as Date | null,
  }));
}

export default async function TreePage() {
  const nodes = await getTreeData();

  return <TreeClient nodes={nodes} />;
}

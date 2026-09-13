import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canManagePeople } from "@/lib/permissions";
import { PeopleManager } from "@/components/admin/PeopleManager";

export default async function AdminPeoplePage() {
  const session = await auth();
  if (!session?.user || !canManagePeople(session.user.role)) {
    redirect("/admin/dashboard");
  }

  // جلب الأشخاص النشطين فقط (بدون المحذوفين)
  const people = await db.person.findMany({
    where: { deletedAt: null },
    include: {
      father: { select: { fullName: true } },
      branch: { select: { name: true } },
      children: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const branches = await db.branch.findMany();

  // ⚠️ الإصلاح: جلب الأشخاص النشطين فقط لقائمة الأب
  const allPeople = await db.person.findMany({
    where: { deletedAt: null }, // ← هذا هو الإصلاح
    select: {
      id: true,
      fullName: true,
      gender: true,
      fatherId: true,
      status: true,
    },
  });

  return (
    <div className="space-y-6">
      <PeopleManager
        initialPeople={JSON.parse(JSON.stringify(people))}
        branches={JSON.parse(JSON.stringify(branches))}
        allPeople={JSON.parse(JSON.stringify(allPeople))}
      />
    </div>
  );
}

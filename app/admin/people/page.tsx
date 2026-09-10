import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canManagePeople } from "@/lib/permissions";
import { PeopleTable } from "@/components/admin/PeopleTable";

export default async function AdminPeoplePage() {
  const session = await auth();
  if (!session?.user || !canManagePeople(session.user.role)) redirect("/admin/dashboard");

  const people = await db.person.findMany({
    where: { deletedAt: null },
    include: { father: { select: { fullName: true } }, branch: { select: { name: true } }, children: { select: { id: true } } },
    orderBy: { createdAt: 'desc' }
  });
  const branches = await db.branch.findMany();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-deep-green">إدارة الأشخاص</h1>
      <PeopleTable people={people} branches={branches} />
    </div>
  );
}
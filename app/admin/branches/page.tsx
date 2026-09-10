import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BranchesManager } from "@/components/admin/BranchesManager";

export default async function AdminBranchesPage() {
  const session = await auth();
  if (!session?.user || !canManageSystem(session.user.role)) {
    redirect("/admin/dashboard");
  }

  const branches = await db.branch.findMany({
    include: { _count: { select: { people: true } } },
    orderBy: { createdAt: 'asc' }
  });

  return <BranchesManager initialBranches={branches} />;
}
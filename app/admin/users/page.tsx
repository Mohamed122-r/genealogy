import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UsersManager } from "@/components/admin/UsersManager";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user || !canManageSystem(session.user.role)) {
    redirect("/admin/dashboard");
  }

  const users = await db.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' }
  });

  return <UsersManager initialUsers={users} />;
}
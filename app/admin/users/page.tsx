import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canManageSystem } from "@/lib/permissions";
import { UsersManager } from "@/components/admin/UsersManager";

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user || !canManageSystem(session.user.role)) {
    redirect("/admin/dashboard");
  }

  return (
    <UsersManager
      currentUserId={session.user.id || ""}
      currentUserRole={session.user.role || "VIEWER"}
    />
  );
}

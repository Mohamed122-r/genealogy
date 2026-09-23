import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canManageSystem } from "@/lib/permissions";
import { PagesManager } from "@/components/admin/PagesManager";

export default async function AdminPagesPage() {
  const session = await auth();
  if (!session?.user || !canManageSystem(session.user.role)) {
    redirect("/admin/dashboard");
  }

  return <PagesManager />;
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canManageSystem } from "@/lib/permissions";
import { ExportSettingsManager } from "@/components/admin/ExportSettingsManager";

export default async function AdminExportSettingsPage() {
  const session = await auth();

  if (!session?.user || !canManageSystem(session.user.role)) {
    redirect("/admin/dashboard");
  }

  return <ExportSettingsManager />;
}

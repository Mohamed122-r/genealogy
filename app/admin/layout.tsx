import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/Sidebar";
import { db } from "@/lib/db";
import { unstable_noStore as noStore } from "next/cache";

// ⬇️ إجبار الصفحة على القراءة الديناميكية من قاعدة البيانات
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  noStore();

  const session = await auth();
  if (!session?.user) redirect("/login");

  // جلب اسم الموقع
  const settings = await db.siteSettings.findUnique({
    where: { id: "default" },
    select: { siteName: true },
  });

  return (
    <div className="flex min-h-screen bg-heritage-bg">
      <AdminSidebar
        userRole={session.user.role || "VIEWER"}
        siteName={settings?.siteName || "شجرة النسب العائلية"}
      />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}

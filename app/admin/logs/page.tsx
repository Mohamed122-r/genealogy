import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canManageSystem } from "@/lib/permissions";

export default async function AdminLogsPage() {
  const session = await auth();
  if (!session?.user || !canManageSystem(session.user.role)) {
    redirect("/admin/dashboard");
  }

  const logs = await db.auditLog.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      CREATE_PERSON: "إضافة شخص",
      UPDATE_PERSON: "تعديل شخص",
      DELETE_PERSON: "حذف شخص",
      IMPORT_PERSON: "استيراد بيانات",
    };
    return labels[action] || action;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-dark-bg">سجل العمليات</h1>

      <div className="bg-white rounded-xl border border-gold-500/20 shadow-lg overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-dark-bg text-white">
            <tr>
              <th className="p-4 text-sm font-bold">العملية</th>
              <th className="p-4 text-sm font-bold">المستخدم</th>
              <th className="p-4 text-sm font-bold">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-12 text-gray-500">
                  لا توجد عمليات مسجلة
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100 hover:bg-heritage-bg">
                  <td className="p-4">
                    <span className="bg-gold-500/20 text-gold-700 px-3 py-1 rounded-full text-xs font-bold">
                      {getActionLabel(log.action)}
                    </span>
                  </td>
                  <td className="p-4 text-gray-700">{log.user?.name || "النظام"}</td>
                  <td className="p-4 text-sm text-gray-500">
                    {new Date(log.createdAt).toLocaleDateString("ar-SA")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

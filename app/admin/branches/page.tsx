import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canManageSystem } from "@/lib/permissions";

export default async function AdminBranchesPage() {
  const session = await auth();
  if (!session?.user || !canManageSystem(session.user.role)) {
    redirect("/admin/dashboard");
  }

  const branches = await db.branch.findMany({
    include: { _count: { select: { people: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-dark-bg">إدارة الفروع</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.length === 0 ? (
          <div className="bg-white rounded-xl p-8 border border-gold-500/20 text-center col-span-full">
            <p className="text-gray-500">لا توجد فروع</p>
          </div>
        ) : (
          branches.map((branch) => (
            <div
              key={branch.id}
              className="bg-white rounded-xl p-6 border border-gold-500/20 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-12 h-12 rounded-full"
                  style={{ backgroundColor: branch.color }}
                />
                <div>
                  <h3 className="text-xl font-bold text-dark-bg">{branch.name}</h3>
                  <p className="text-sm text-gray-500">
                    {branch.description || "بدون وصف"}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-600">عدد الأشخاص</span>
                <span className="bg-gold-500/20 text-gold-700 px-3 py-1 rounded-full text-sm font-bold">
                  {branch._count.people}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

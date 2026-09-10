import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canManageSystem, getRoleLabel } from "@/lib/permissions";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user || !canManageSystem(session.user.role)) {
    redirect("/admin/dashboard");
  }

  const users = await db.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-dark-bg">إدارة المستخدمين</h1>

      <div className="bg-white rounded-xl border border-gold-500/20 shadow-lg overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-dark-bg text-white">
            <tr>
              <th className="p-4 text-sm font-bold">الاسم</th>
              <th className="p-4 text-sm font-bold">البريد الإلكتروني</th>
              <th className="p-4 text-sm font-bold">الدور</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-heritage-bg">
                <td className="p-4 font-bold text-dark-bg">{user.name}</td>
                <td className="p-4 text-gray-700">{user.email}</td>
                <td className="p-4">
                  <span className="bg-gold-500/20 text-gold-700 px-3 py-1 rounded-full text-xs font-bold">
                    {getRoleLabel(user.role)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

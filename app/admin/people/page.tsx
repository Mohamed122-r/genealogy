import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canManagePeople } from "@/lib/permissions";

export default async function AdminPeoplePage() {
  const session = await auth();
  if (!session?.user || !canManagePeople(session.user.role)) {
    redirect("/admin/dashboard");
  }

  const people = await db.person.findMany({
    where: { deletedAt: null },
    include: {
      father: { select: { fullName: true } },
      branch: { select: { name: true } },
      children: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-dark-bg">إدارة الأشخاص</h1>
        <div className="bg-gold-500 text-dark-bg px-4 py-2 rounded-lg font-bold text-sm">
          إجمالي: {people.length}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gold-500/20 shadow-lg overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-dark-bg text-white">
            <tr>
              <th className="p-4 text-sm font-bold">الاسم الكامل</th>
              <th className="p-4 text-sm font-bold">الحالة</th>
              <th className="p-4 text-sm font-bold">الفرع</th>
              <th className="p-4 text-sm font-bold">الأب</th>
              <th className="p-4 text-sm font-bold">الأبناء</th>
            </tr>
          </thead>
          <tbody>
            {people.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-500">
                  لا يوجد أشخاص في قاعدة البيانات
                </td>
              </tr>
            ) : (
              people.map((person) => (
                <tr
                  key={person.id}
                  className="border-b border-gray-100 hover:bg-heritage-bg transition-colors"
                >
                  <td className="p-4 font-bold text-dark-bg">{person.fullName}</td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        person.status === "ALIVE"
                          ? "bg-green-100 text-green-800"
                          : person.status === "DECEASED"
                          ? "bg-red-100 text-red-800"
                          : person.status === "DISCONNECTED"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {person.status === "ALIVE"
                        ? "حي"
                        : person.status === "DECEASED"
                        ? "متوفى"
                        : person.status === "DISCONNECTED"
                        ? "منقطع"
                        : "غير معروف"}
                    </span>
                  </td>
                  <td className="p-4 text-gray-700">
                    {person.branch?.name || "بدون فرع"}
                  </td>
                  <td className="p-4 text-gray-700">
                    {person.father?.fullName || "جذر الشجرة"}
                  </td>
                  <td className="p-4 text-gray-700">
                    <span className="bg-gold-500/20 text-gold-700 px-3 py-1 rounded-full text-xs font-bold">
                      {person.children.length}
                    </span>
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

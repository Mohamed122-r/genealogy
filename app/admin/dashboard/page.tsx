import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, TreePine } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await auth();

  const [totalPeople, alivePeople, deceasedPeople, totalRoots] = await Promise.all([
    db.person.count({ where: { deletedAt: null } }),
    db.person.count({ where: { status: "ALIVE", deletedAt: null } }),
    db.person.count({ where: { status: "DECEASED", deletedAt: null } }),
    db.person.count({ where: { fatherId: null, deletedAt: null } }),
  ]);

  const stats = [
    { title: "إجمالي الأشخاص", value: totalPeople, icon: Users, color: "text-blue-500" },
    { title: "الأحياء", value: alivePeople, icon: UserCheck, color: "text-green-500" },
    { title: "المتوفون", value: deceasedPeople, icon: UserX, color: "text-red-500" },
    { title: "الجذور (الأصل)", value: totalRoots, icon: TreePine, color: "text-gold-500" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-dark-bg mb-8">
        مرحباً بك، {session?.user?.name}
      </h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-gold-500/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-dark-bg">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/" target="_blank" rel="noopener noreferrer">
          <Card className="bg-dark-bg text-white border-gold-500/50 hover:bg-deep-green transition-all shadow-xl h-full cursor-pointer">
            <CardContent className="p-8 flex flex-col items-center text-center">
              <TreePine className="w-16 h-16 text-gold-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">عرض الشجرة التفاعلية</h2>
              <p className="text-gray-300">استكشف الشجرة الكاملة مع إمكانية البحث والتكبير</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/people">
          <Card className="bg-gold-500 text-dark-bg border-gold-500/50 hover:bg-gold-600 transition-all shadow-xl h-full cursor-pointer">
            <CardContent className="p-8 flex flex-col items-center text-center">
              <Users className="w-16 h-16 text-dark-bg mb-4" />
              <h2 className="text-2xl font-bold mb-2">إدارة الأشخاص</h2>
              <p className="text-dark-bg/80">أضف، عدّل، واحذف الأشخاص في قاعدة البيانات</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

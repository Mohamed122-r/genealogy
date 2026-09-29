import Link from "next/link";
import { Users, UserCheck, UserX, TreePine, Calendar, Crown, User } from "lucide-react";
import { getTreeStatistics } from "@/lib/statistics";

export async function StatisticsSection() {
  const stats = await getTreeStatistics();

  // تنسيق التاريخ
  const formatDate = (date: Date | null) => {
    if (!date) return "غير محدد";
    return new Date(date).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <section className="py-16 bg-heritage-bg">
      <div className="container mx-auto px-4">
        {/* العنوان */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gold-500/20 border border-gold-500/50 px-4 py-2 rounded-full mb-4">
            <TreePine className="w-4 h-4 text-gold-500" />
            <span className="text-gold-500 font-semibold">إحصائيات المشجرة</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-heritage font-bold text-dark-bg mb-4">
            لمحة عن المشجرة
          </h2>
          <div className="w-24 h-1 bg-gold-500 mx-auto rounded-full"></div>
        </div>

        {/* الشبكة الرئيسية */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          {/* إجمالي الأشخاص */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gold-500/20 text-center hover:shadow-xl transition-all">
            <div className="w-14 h-14 mx-auto bg-dark-bg rounded-full flex items-center justify-center mb-3">
              <Users className="w-7 h-7 text-gold-500" />
            </div>
            <p className="text-3xl md:text-4xl font-bold text-dark-bg mb-1">
              {stats.totalPeople.toLocaleString("ar-EG")}
            </p>
            <p className="text-sm text-gray-600">إجمالي الأشخاص</p>
          </div>

          {/* عدد الأجيال */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gold-500/20 text-center hover:shadow-xl transition-all">
            <div className="w-14 h-14 mx-auto bg-dark-bg rounded-full flex items-center justify-center mb-3">
              <Crown className="w-7 h-7 text-gold-500" />
            </div>
            <p className="text-3xl md:text-4xl font-bold text-dark-bg mb-1">
              {stats.totalGenerations.toLocaleString("ar-EG")}
            </p>
            <p className="text-sm text-gray-600">عدد الأجيال</p>
          </div>

          {/* الأحياء */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-500/30 text-center hover:shadow-xl transition-all">
            <div className="w-14 h-14 mx-auto bg-green-600 rounded-full flex items-center justify-center mb-3">
              <UserCheck className="w-7 h-7 text-white" />
            </div>
            <p className="text-3xl md:text-4xl font-bold text-green-700 mb-1">
              {stats.aliveCount.toLocaleString("ar-EG")}
            </p>
            <p className="text-sm text-gray-600">الأحياء</p>
          </div>

          {/* المتوفون */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-amber-500/30 text-center hover:shadow-xl transition-all">
            <div className="w-14 h-14 mx-auto bg-amber-500 rounded-full flex items-center justify-center mb-3">
              <UserX className="w-7 h-7 text-white" />
            </div>
            <p className="text-3xl md:text-4xl font-bold text-amber-600 mb-1">
              {stats.deceasedCount.toLocaleString("ar-EG")}
            </p>
            <p className="text-sm text-gray-600">المتوفون</p>
          </div>
        </div>

        {/* الشبكة الثانوية */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {/* الذكور */}
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-5 shadow-md border border-blue-500/20 text-center">
            <User className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-700 mb-1">
              {stats.maleCount.toLocaleString("ar-EG")}
            </p>
            <p className="text-xs text-gray-600">الذكور</p>
          </div>

          {/* الإناث */}
          <div className="bg-gradient-to-br from-pink-50 to-white rounded-2xl p-5 shadow-md border border-pink-500/20 text-center">
            <User className="w-6 h-6 text-pink-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-pink-700 mb-1">
              {stats.femaleCount.toLocaleString("ar-EG")}
            </p>
            <p className="text-xs text-gray-600">الإناث</p>
          </div>

          {/* الجذور */}
          <div className="bg-gradient-to-br from-gold-100 to-white rounded-2xl p-5 shadow-md border border-gold-500/20 text-center">
            <TreePine className="w-6 h-6 text-gold-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gold-700 mb-1">
              {stats.rootCount.toLocaleString("ar-EG")}
            </p>
            <p className="text-xs text-gray-600">الجذور</p>
          </div>

          {/* آخر إضافة */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-5 shadow-md border border-gray-500/20 text-center">
            <Calendar className="w-6 h-6 text-gray-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-gray-700 mb-1">
              {formatDate(stats.latestAddition)}
            </p>
            <p className="text-xs text-gray-600">آخر إضافة</p>
          </div>
        </div>

        {/* زر عرض المشجرة */}
        <div className="text-center mt-12">
          <Link
            href="/tree"
            className="inline-flex items-center gap-2 bg-gold-500 text-dark-bg px-8 py-3 rounded-xl font-bold hover:bg-gold-600 transition-all shadow-lg hover:-translate-y-1"
          >
            <TreePine className="w-5 h-5" />
            استكشف المشجرة الكاملة
          </Link>
        </div>
      </div>
    </section>
  );
}

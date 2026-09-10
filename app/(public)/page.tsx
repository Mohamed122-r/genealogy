import Link from "next/link";
import { TreePine, Users, BookOpen, ScrollText, Feather, Landmark } from "lucide-react";

export default async function HomePage() {
  return (
    <div className="min-h-screen bg-heritage-bg">
      {/* ===== قسم البطل (Hero) ===== */}
      <section className="bg-gradient-to-b from-dark-bg via-deep-green to-dark-bg text-white py-16 md:py-24 relative overflow-hidden">
        {/* زخارف إسلامية */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="islamic-pattern" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M40 0 L80 40 L40 80 L0 40 Z" fill="none" stroke="#C9A227" strokeWidth="1" />
                <circle cx="40" cy="40" r="20" fill="none" stroke="#C9A227" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#islamic-pattern)" />
          </svg>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-gold-500/20 border border-gold-500/50 px-4 py-2 rounded-full mb-6">
            <Feather className="w-4 h-4 text-gold-500" />
            <span className="text-gold-500 font-semibold text-sm">منصة رقمية موثوقة</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-heritage font-bold mb-4">
            شجرة النسب
          </h1>
          <h2 className="text-2xl md:text-4xl text-gold-500 font-heritage mb-8">
            العائلية الكريمة
          </h2>
          <p className="text-base md:text-lg text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            وثّق تاريخ عائلتك، احفظ أنسابك، واربط الأجيال ببعضها البعض عبر منصة حديثة بتصميم تراثي أصيل.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/tree"
              className="bg-gold-500 text-dark-bg px-6 md:px-10 py-3 md:py-4 rounded-xl text-base md:text-lg font-bold hover:bg-gold-600 transition-all duration-300 shadow-2xl hover:-translate-y-1 flex items-center gap-2"
            >
              <TreePine className="w-5 h-5" />
              استكشف الشجرة الآن
            </Link>
            <Link
              href="/introduction"
              className="border-2 border-gold-500/50 text-white px-6 md:px-10 py-3 md:py-4 rounded-xl text-base md:text-lg font-bold hover:bg-gold-500/10 transition-all duration-300 flex items-center gap-2"
            >
              <BookOpen className="w-5 h-5" />
              اقرأ المقدمة
            </Link>
          </div>
        </div>
      </section>

      {/* ===== قسم المزايا (Features) ===== */}
      <section className="py-16 md:py-20 bg-heritage-bg">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-block">
              <Landmark className="w-12 h-12 text-gold-500 mx-auto mb-4" />
            </div>
            <h2 className="text-3xl md:text-4xl font-heritage font-bold text-dark-bg mb-4">
              لماذا منصتنا؟
            </h2>
            <div className="w-24 h-1 bg-gold-500 mx-auto rounded-full"></div>
            <p className="text-gray-600 mt-6 max-w-2xl mx-auto">
              نجمع بين أصالة التراث العربي وأحدث التقنيات الرقمية لتقديم تجربة فريدة.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ميزة 1 */}
            <div className="card-elegant text-center animate-fade-in">
              <div className="w-16 h-16 mx-auto bg-dark-bg rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <Landmark className="w-8 h-8 text-gold-500" />
              </div>
              <h3 className="text-xl font-bold text-dark-bg mb-3">توثيق موثوق</h3>
              <p className="text-gray-600 leading-relaxed">
                بنية بيانات منظمة تضمن حفظ العلاقات بين الأفراد بدقة عالية.
              </p>
            </div>

            {/* ميزة 2 */}
            <div className="card-elegant text-center animate-fade-in">
              <div className="w-16 h-16 mx-auto bg-dark-bg rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <TreePine className="w-8 h-8 text-gold-500" />
              </div>
              <h3 className="text-xl font-bold text-dark-bg mb-3">شجرة تفاعلية</h3>
              <p className="text-gray-600 leading-relaxed">
                استكشف الشجرة بتقنية SVG حديثة، ابحث عن أي اسم، وتنقل بين الأجيال.
              </p>
            </div>

            {/* ميزة 3 */}
            <div className="card-elegant text-center animate-fade-in">
              <div className="w-16 h-16 mx-auto bg-dark-bg rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <Users className="w-8 h-8 text-gold-500" />
              </div>
              <h3 className="text-xl font-bold text-dark-bg mb-3">إدارة متقدمة</h3>
              <p className="text-gray-600 leading-relaxed">
                لوحة تحكم شاملة تتيح إضافة وتعديل البيانات بمرونة تامة.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== قسم دعوة للإجراء (CTA) ===== */}
      <section className="bg-dark-bg text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%">
            <pattern id="cta-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M20 0 L20 40 M0 20 L40 20" stroke="white" strokeWidth="1" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#cta-pattern)" />
          </svg>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <ScrollText className="w-12 h-12 text-gold-500 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-heritage font-bold mb-6">
            ابدأ رحلتك في توثيق تاريخ عائلتك
          </h2>
          <p className="text-base md:text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            انضم إلينا للمساهمة في حفظ الأنساب، أو استكشف الشجرة الحالية.
          </p>
          <Link
            href="/tree"
            className="inline-flex bg-gold-500 text-dark-bg px-8 md:px-10 py-3 md:py-4 rounded-xl text-base md:text-lg font-bold hover:bg-gold-600 transition-all duration-300 shadow-2xl hover:-translate-y-1 items-center gap-2"
          >
            <TreePine className="w-5 h-5" />
            تصفح الشجرة الكريمة
          </Link>
        </div>
      </section>
    </div>
  );
}
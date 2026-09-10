import { ScrollText, BookOpen } from "lucide-react";

const sources = [
  {
    title: "كتاب تاريخ العائلة",
    author: "محمد بن عبدالله",
    type: "كتاب مطبوع",
    year: "1985",
  },
  {
    title: "مخطوطة النسب القديمة",
    author: "غير معروف",
    type: "مخطوطة أصلية",
    year: "القرن الثامن عشر",
  },
  {
    title: "سجلات الأحوال المدنية",
    author: "دائرة الأحوال المدنية",
    type: "سجل رسمي",
    year: "1900 - 2020",
  },
  {
    title: "شهادات الرواة الموثقة",
    author: "مجموعة من الرواة",
    type: "شهادات موثقة",
    year: "2000 - 2020",
  },
];

export default function SourcesPage() {
  return (
    <div className="min-h-screen bg-heritage-bg py-12 md:py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* العنوان */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto bg-dark-bg rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <ScrollText className="w-8 h-8 text-gold-500" />
          </div>
          <h1 className="text-3xl md:text-5xl font-heritage font-bold text-dark-bg mb-4">
            المصادر والمراجع
          </h1>
          <div className="w-24 h-1 bg-gold-500 mx-auto rounded-full"></div>
          <p className="text-gray-600 mt-6 max-w-2xl mx-auto text-base md:text-lg">
            قائمة المصادر والمراجع التي تم الاعتماد عليها في توثيق هذه الشجرة.
          </p>
        </div>

        {/* القائمة */}
        <div className="space-y-4">
          {sources.map((source, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gold-500/20 hover:shadow-2xl hover:border-gold-500/50 transition-all duration-300 flex items-start gap-4"
            >
              <div className="w-14 h-14 bg-dark-bg rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-7 h-7 text-gold-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg md:text-xl font-bold text-dark-bg mb-2">
                  {source.title}
                </h3>
                <p className="text-gray-600 mb-3 text-sm">المؤلف: {source.author}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-gold-500/20 text-gold-700 px-3 py-1 rounded-full text-xs font-bold">
                    {source.type}
                  </span>
                  <span className="bg-dark-bg/10 text-dark-bg px-3 py-1 rounded-full text-xs font-bold">
                    {source.year}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
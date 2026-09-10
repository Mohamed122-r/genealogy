import { Users } from "lucide-react";

const narrators = [
  {
    name: "الشيخ / محمد بن عبدالله",
    role: "راوٍ رئيسي",
    bio: "من كبار الرواة، قام بتوثيق الجيل الأول والثاني من العائلة عبر مقابلات ميدانية.",
  },
  {
    name: "الأستاذ / أحمد بن خالد",
    role: "مؤرخ",
    bio: "باحث في الأنساب، ساهم في مراجعة المصادر التاريخية وتوثيق الفروع.",
  },
  {
    name: "الحاج / عمر بن سعيد",
    role: "راوٍ مساعد",
    bio: "قدم معلومات قيمة عن فروع العائلة التي استقرت خارج المنطقة الأصلية.",
  },
];

export default function NarratorsPage() {
  return (
    <div className="min-h-screen bg-heritage-bg py-12 md:py-20">
      <div className="container mx-auto px-4">
        {/* العنوان */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto bg-dark-bg rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Users className="w-8 h-8 text-gold-500" />
          </div>
          <h1 className="text-3xl md:text-5xl font-heritage font-bold text-dark-bg mb-4">
            الرواة والمحدثون
          </h1>
          <div className="w-24 h-1 bg-gold-500 mx-auto rounded-full"></div>
          <p className="text-gray-600 mt-6 max-w-2xl mx-auto text-base md:text-lg">
            نبذة عن الأشخاص الذين ساهموا في توثيق وتاريخ هذه الشجرة المباركة.
          </p>
        </div>

        {/* البطاقات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {narrators.map((narrator, index) => (
            <div
              key={index}
              className="card-elegant text-center animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-20 h-20 mx-auto bg-dark-bg rounded-full flex items-center justify-center mb-4 shadow-lg">
                <Users className="w-10 h-10 text-gold-500" />
              </div>
              <h3 className="text-xl font-bold text-dark-bg mb-2">{narrator.name}</h3>
              <p className="text-gold-600 font-bold mb-3 text-sm">{narrator.role}</p>
              <div className="w-12 h-0.5 bg-gold-500 mx-auto mb-4 rounded-full"></div>
              <p className="text-gray-600 leading-relaxed text-sm">{narrator.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
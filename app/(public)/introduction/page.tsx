import { BookOpen } from "lucide-react";

export default function IntroductionPage() {
  return (
    <div className="min-h-screen bg-heritage-bg py-12 md:py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* العنوان */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto bg-dark-bg rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <BookOpen className="w-8 h-8 text-gold-500" />
          </div>
          <h1 className="text-3xl md:text-5xl font-heritage font-bold text-dark-bg mb-4">
            المقدمة
          </h1>
          <div className="w-24 h-1 bg-gold-500 mx-auto rounded-full"></div>
        </div>

        {/* المحتوى */}
        <div className="bg-white rounded-2xl p-6 md:p-10 shadow-2xl border border-gold-500/20">
          <p className="text-lg md:text-2xl font-bold text-dark-bg mb-6 leading-relaxed">
            الحمد لله رب العالمين، والصلاة والسلام على أشرف الأنبياء والمرسلين.
          </p>

          <p className="text-base md:text-lg leading-loose text-gray-700 mb-6">
            تعد الشجرة العائلية وثيقة حية تحمل بين أوراقها ذاكرة الأجيال وهويتهم الثقافية والاجتماعية. 
            من هنا انطلقت فكرة إنشاء هذه المنصة الرقمية، التي تهدف إلى جمع شتات الأنساب وتوثيقها 
            بطريقة علمية دقيقة وميسورة للجميع.
          </p>

          <p className="text-base md:text-lg leading-loose text-gray-700 mb-6">
            تهدف هذه المنصة إلى الحفاظ على تاريخ العائلة وتسليط الضوء على الرواة والشخصيات البارزة 
            الذين ساهموا في صناعة المجد لهذه القبيلة. كما نحرص على توفير مصادر موثقة لجميع المعلومات 
            المقدمة، لضمان دقة النسب وصحته.
          </p>

          <div className="bg-heritage-bg border-r-4 border-gold-500 p-6 rounded-l-xl my-8">
            <p className="italic text-dark-bg text-lg leading-relaxed">
              "العائلة التي تحفظ تاريخها هي عائلة تصنع مستقبلها بثقة وإرادة."
            </p>
          </div>

          <p className="text-base md:text-lg leading-loose text-gray-700">
            ندعوكم لاستكشاف الشجرة التفاعلية، والبحث في أسماء أجدادكم، والمساهمة معنا في إثراء هذا 
            الكنز التاريخي.
          </p>
        </div>
      </div>
    </div>
  );
}
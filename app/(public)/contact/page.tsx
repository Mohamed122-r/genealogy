import { Mail, MapPin, Phone, Send } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-heritage-bg py-12 md:py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* العنوان */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto bg-dark-bg rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Mail className="w-8 h-8 text-gold-500" />
          </div>
          <h1 className="text-3xl md:text-5xl font-heritage font-bold text-dark-bg mb-4">
            تواصل معنا
          </h1>
          <div className="w-24 h-1 bg-gold-500 mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* معلومات التواصل */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-2xl border border-gold-500/20">
            <h2 className="text-2xl font-bold text-dark-bg mb-6">معلومات التواصل</h2>
            <p className="text-gray-600 leading-relaxed mb-8">
              يسعدنا استقبال استفساراتكم واقتراحاتكم للعمل على إثراء الشجرة وتوثيقها بشكل أفضل.
            </p>

            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-dark-bg rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-gold-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">البريد الإلكتروني</p>
                  <p className="text-dark-bg font-bold text-sm">info@example.com</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-dark-bg rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-gold-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">الهاتف</p>
                  <p className="text-dark-bg font-bold text-sm" dir="ltr">+966 555 555 555</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-dark-bg rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-gold-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">العنوان</p>
                  <p className="text-dark-bg font-bold text-sm">المملكة العربية السعودية</p>
                </div>
              </div>
            </div>
          </div>

          {/* نموذج التواصل */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-2xl border border-gold-500/20">
            <h2 className="text-2xl font-bold text-dark-bg mb-6">أرسل رسالتك</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-dark-bg mb-2">الاسم الكامل</label>
                <input
                  type="text"
                  placeholder="اكتب اسمك"
                  className="w-full p-3 border border-gold-500/30 rounded-xl focus:outline-none focus:border-gold-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-dark-bg mb-2">البريد الإلكتروني</label>
                <input
                  type="email"
                  placeholder="example@email.com"
                  className="w-full p-3 border border-gold-500/30 rounded-xl focus:outline-none focus:border-gold-500 transition-colors"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-dark-bg mb-2">رسالتك</label>
                <textarea
                  rows={5}
                  placeholder="اكتب رسالتك هنا..."
                  className="w-full p-3 border border-gold-500/30 rounded-xl focus:outline-none focus:border-gold-500 transition-colors resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-gold-500 text-dark-bg px-6 py-3 rounded-xl font-bold hover:bg-gold-600 transition-all duration-300 shadow-lg hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                إرسال الرسالة
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
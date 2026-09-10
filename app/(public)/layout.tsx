import Link from "next/link";
import { TreePine, Shield } from "lucide-react";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-heritage-bg">
      {/* ===== الهيدر ===== */}
      <header className="bg-dark-bg text-white sticky top-0 z-50 shadow-2xl border-b border-gold-500/30">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          {/* الشعار */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-full bg-gold-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <TreePine className="w-6 h-6 text-dark-bg" />
            </div>
            <div>
              <span className="font-heritage text-xl md:text-2xl font-bold block leading-tight">
                شجرة النسب العائلية
              </span>
              <span className="text-xs text-gold-500">Mohamed Abdalwhab</span>
            </div>
          </Link>

          {/* القائمة الرئيسية */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/" className="hover:text-gold-500 transition-colors duration-200">
              الرئيسية
            </Link>
            <Link href="/introduction" className="hover:text-gold-500 transition-colors duration-200">
              المقدمة
            </Link>
            <Link href="/narrators" className="hover:text-gold-500 transition-colors duration-200">
              الرواة
            </Link>
            <Link href="/tree" className="hover:text-gold-500 transition-colors duration-200">
              المشجرة
            </Link>
            <Link href="/sources" className="hover:text-gold-500 transition-colors duration-200">
              المصادر
            </Link>
            <Link href="/contact" className="hover:text-gold-500 transition-colors duration-200">
              تواصل معنا
            </Link>
          </nav>

          {/* زر لوحة التحكم */}
          <Link
            href="/login"
            className="bg-gold-500 text-dark-bg px-3 md:px-4 py-2 rounded-lg font-bold text-xs md:text-sm flex items-center gap-2 hover:bg-gold-600 transition-all duration-300 shadow-lg"
          >
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">لوحة التحكم</span>
          </Link>
        </div>
      </header>

      {/* ===== المحتوى ===== */}
      <main className="flex-1">{children}</main>

      {/* ===== الفوتر ===== */}
      <footer className="bg-dark-bg text-white py-8 border-t border-gold-500/30">
        <div className="container mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-gold-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <TreePine className="w-8 h-8 text-dark-bg" />
          </div>
          <p className="text-gold-500 text-sm mb-2">Designed &amp; Developed by</p>
          <p className="text-white text-2xl md:text-3xl font-heritage font-bold">
            Mohamed Abdalwhab
          </p>
          <p className="text-xs text-gray-500 mt-4">
            © {new Date().getFullYear()} جميع الحقوق محفوظة
          </p>
        </div>
      </footer>
    </div>
  );
}
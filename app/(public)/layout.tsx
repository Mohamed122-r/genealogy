import Link from "next/link";
import { TreePine } from "lucide-react";
import { db } from "@/lib/db";
import { unstable_noStore as noStore } from "next/cache";

// ⬇️ إجبار الصفحة على القراءة الديناميكية من قاعدة البيانات
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  noStore();

  // جلب الصفحات النشطة
  const pages = await db.page.findMany({
    where: {
      isPublished: true,
      showInNav: true,
    },
    orderBy: { order: "asc" },
    select: { id: true, slug: true, title: true },
  });

  // جلب الإعدادات
  const settings = await db.siteSettings.findUnique({
    where: { id: "default" },
  });

  const siteName = settings?.siteName || "شجرة النسب العائلية";
  const developerName = settings?.developerName || "Mohamed Abdalwhab";

  return (
    <div className="min-h-screen flex flex-col bg-heritage-bg">
      {/* الهيدر */}
      <header className="bg-dark-bg text-white sticky top-0 z-50 shadow-2xl border-b border-gold-500/30">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-full bg-gold-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <TreePine className="w-6 h-6 text-dark-bg" />
            </div>
            <div>
              <span className="font-heritage text-xl md:text-2xl font-bold block leading-tight">
                {siteName}
              </span>
              <span className="text-xs text-gold-500">{developerName}</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/" className="hover:text-gold-500 transition-colors duration-200">
              الرئيسية
            </Link>
            <Link href="/tree" className="hover:text-gold-500 transition-colors duration-200">
              المشجرة
            </Link>
            {pages.map((page) => (
              <Link
                key={page.id}
                href={`/${page.slug}`}
                className="hover:text-gold-500 transition-colors duration-200"
              >
                {page.title}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* الفوتر */}
      <footer className="bg-dark-bg text-white py-8 border-t border-gold-500/30">
        <div className="container mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-gold-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <TreePine className="w-8 h-8 text-dark-bg" />
          </div>
          <p className="text-gold-500 text-sm mb-2">Designed &amp; Developed by</p>
          <p className="text-white text-2xl md:text-3xl font-heritage font-bold">
            {developerName}
          </p>
          <p className="text-xs text-gray-500 mt-4">
            © {new Date().getFullYear()} جميع الحقوق محفوظة
          </p>
        </div>
      </footer>
    </div>
  );
}

import { db } from "@/lib/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;

  const page = await db.page.findUnique({
    where: { slug, isPublished: true },
  });

  if (!page) return { title: "الصفحة غير موجودة" };

  return {
    title: page.title,
    description: `صفحة ${page.title} - شجرة النسب العائلية`,
  };
}

export default async function DynamicPage({ params }: PageProps) {
  const { slug } = await params;

  const page = await db.page.findUnique({
    where: { slug, isPublished: true },
  });

  if (!page) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-heritage-bg py-12 md:py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-2xl p-6 md:p-10 shadow-2xl border border-gold-500/20">
          <h1 className="text-3xl md:text-5xl font-heritage font-bold text-dark-bg text-center mb-8">
            {page.title}
          </h1>
          <div className="w-24 h-1 bg-gold-500 mx-auto rounded-full mb-8"></div>

          <div
            className="prose prose-lg max-w-none text-gray-700 leading-loose tiptap-content"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </div>
      </div>
    </div>
  );
}

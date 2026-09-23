import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET: جلب كل الصفحات
export async function GET() {
  try {
    const pages = await db.page.findMany({
      orderBy: { order: "asc" },
    });
    return NextResponse.json(pages);
  } catch (error) {
    return NextResponse.json({ error: "خطأ في السيرفر" }, { status: 500 });
  }
}

// POST: إضافة صفحة جديدة
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const data = await request.json();

    if (!data.title || !data.slug || !data.content) {
      return NextResponse.json({ error: "العنوان، الرابط، والمحتوى مطلوبة" }, { status: 400 });
    }

    // تنظيف الـ slug
    const cleanSlug = data.slug
      .toLowerCase()
      .trim()
      .replace(/[^\w\u0600-\u06FF-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!cleanSlug) {
      return NextResponse.json({ error: "الرابط غير صالح" }, { status: 400 });
    }

    // التحقق من عدم التكرار
    const existing = await db.page.findUnique({ where: { slug: cleanSlug } });
    if (existing) {
      return NextResponse.json({ error: "الرابط مستخدم بالفعل" }, { status: 400 });
    }

    const page = await db.page.create({
      data: {
        slug: cleanSlug,
        title: data.title,
        content: data.content,
        order: data.order ?? 100,
        isPublished: data.isPublished ?? true,
        showInNav: data.showInNav ?? true,
        iconName: data.iconName || null,
      },
    });

    return NextResponse.json({ success: true, page });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء الحفظ" }, { status: 500 });
  }
}

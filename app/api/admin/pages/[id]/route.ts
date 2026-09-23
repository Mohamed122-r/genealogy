import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const data = await request.json();
    const { id } = params;

    // إذا تم تغيير الـ slug، تحقق من عدم التكرار
    if (data.slug) {
      const cleanSlug = data.slug
        .toLowerCase()
        .trim()
        .replace(/[^\w\u0600-\u06FF-]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const existing = await db.page.findFirst({
        where: { slug: cleanSlug, NOT: { id } },
      });

      if (existing) {
        return NextResponse.json({ error: "الرابط مستخدم بالفعل" }, { status: 400 });
      }

      data.slug = cleanSlug;
    }

    const page = await db.page.update({
      where: { id },
      data: {
        slug: data.slug,
        title: data.title,
        content: data.content,
        order: data.order,
        isPublished: data.isPublished,
        showInNav: data.showInNav,
        iconName: data.iconName || null,
      },
    });

    return NextResponse.json({ success: true, page });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء التعديل" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    await db.page.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء الحذف" }, { status: 500 });
  }
}

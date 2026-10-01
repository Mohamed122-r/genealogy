import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET: جلب إعدادات التصدير
export async function GET() {
  try {
    const settings = await db.siteSettings.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" },
    });

    return NextResponse.json({
      treeTitle: settings.heroTitle || "شجرة النسب العائلية الكريمة",
      treeSubtitle: settings.heroSubtitle || "",
      treeDescription: settings.siteDescription || "",
      footerLines: [
        `تم إعداد هذه الشجرة بواسطة ${settings.developerName || "Mohamed Abdalwhab"}`,
      ],
    });
  } catch (error) {
    return NextResponse.json({ error: "خطأ في السيرفر" }, { status: 500 });
  }
}

// PUT: تحديث إعدادات التصدير
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const data = await request.json();

    const settings = await db.siteSettings.upsert({
      where: { id: "default" },
      update: {
        heroTitle: data.treeTitle,
        heroSubtitle: data.treeSubtitle,
        siteDescription: data.treeDescription,
      },
      create: {
        id: "default",
        heroTitle: data.treeTitle,
        heroSubtitle: data.treeSubtitle,
        siteDescription: data.treeDescription,
      },
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json({ error: "خطأ في السيرفر" }, { status: 500 });
  }
}

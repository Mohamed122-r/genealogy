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

    // جلب الأسطر السفلية من قاعدة البيانات (سنستخدم حقل introductionText مؤقتاً)
    let footerLines: string[] = [];
    if (settings.introductionText) {
      try {
        const parsed = JSON.parse(settings.introductionText);
        if (Array.isArray(parsed)) footerLines = parsed;
      } catch {
        // إذا لم يكن JSON، نستخدم نصاً واحداً
        footerLines = [settings.introductionText];
      }
    }

    return NextResponse.json({
      treeTitle: settings.heroTitle || "شجرة النسب العائلية الكريمة",
      treeSubtitle: settings.heroSubtitle || "",
      treeDescription: settings.siteDescription || "",
      footerLines:
        footerLines.length > 0
          ? footerLines
          : [`تم إعداد هذه الشجرة بواسطة ${settings.developerName || "Mohamed Abdalwhab"}`],
    });
  } catch (error) {
    console.error("GET Export Settings Error:", error);
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
        // نخزّن الأسطر السفلية كـ JSON في حقل introductionText
        introductionText: JSON.stringify(data.footerLines || []),
      },
      create: {
        id: "default",
        heroTitle: data.treeTitle,
        heroSubtitle: data.treeSubtitle,
        siteDescription: data.treeDescription,
        introductionText: JSON.stringify(data.footerLines || []),
      },
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("PUT Export Settings Error:", error);
    return NextResponse.json({ error: "خطأ في السيرفر" }, { status: 500 });
  }
}

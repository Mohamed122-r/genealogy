import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const settings = await db.siteSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      return NextResponse.json({
        treeTitle: "شجرة النسب العائلية الكريمة",
        treeSubtitle: "",
        treeDescription: "",
        footerLines: ["تم إعداد هذه الشجرة بواسطة Mohamed Abdalwhab"],
      });
    }

    let footerLines: string[] = [];
    if (settings.introductionText) {
      try {
        const parsed = JSON.parse(settings.introductionText);
        if (Array.isArray(parsed)) {
          footerLines = parsed.filter((l) => typeof l === "string" && l.trim());
        }
      } catch {
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
          : ["تم إعداد هذه الشجرة بواسطة Mohamed Abdalwhab"],
    });
  } catch (error) {
    console.error("GET Export Settings Error:", error);
    return NextResponse.json({
      treeTitle: "شجرة النسب العائلية الكريمة",
      treeSubtitle: "",
      treeDescription: "",
      footerLines: ["تم إعداد هذه الشجرة بواسطة Mohamed Abdalwhab"],
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // 1. التحقق من الجلسة
    const session = await auth();
    console.log("[Export Settings] Session:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userRole: session?.user?.role,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح - لم يتم تسجيل الدخول" }, { status: 401 });
    }

    // 2. قراءة البيانات
    const data = await request.json();
    console.log("[Export Settings] Received data:", data);

    // 3. التحقق من البيانات
    if (!data.treeTitle || typeof data.treeTitle !== "string") {
      return NextResponse.json({ error: "العنوان الرئيسي مطلوب" }, { status: 400 });
    }

    // 4. تجهيز البيانات
    const updateData = {
      heroTitle: String(data.treeTitle).trim(),
      heroSubtitle: String(data.treeSubtitle || "").trim(),
      siteDescription: String(data.treeDescription || "").trim(),
      introductionText: JSON.stringify(
        Array.isArray(data.footerLines)
          ? data.footerLines.filter((l: any) => typeof l === "string" && l.trim())
          : []
      ),
    };

    console.log("[Export Settings] Update data:", updateData);

    // 5. الحفظ
    const existingSettings = await db.siteSettings.findUnique({
      where: { id: "default" },
    });

    let settings;

    if (existingSettings) {
      settings = await db.siteSettings.update({
        where: { id: "default" },
        data: updateData,
      });
    } else {
      settings = await db.siteSettings.create({
        data: {
          id: "default",
          ...updateData,
        },
      });
    }

    console.log("[Export Settings] Saved successfully");

    return NextResponse.json({ 
      success: true, 
      settings,
      message: "تم الحفظ بنجاح" 
    });
  } catch (error) {
    console.error("[Export Settings] PUT Error:", error);
    return NextResponse.json(
      {
        error: "حدث خطأ أثناء الحفظ",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

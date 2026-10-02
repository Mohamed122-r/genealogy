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
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const data = await request.json();

    const settings = await db.siteSettings.upsert({
      where: { id: "default" },
      update: {
        heroTitle: data.treeTitle || "",
        heroSubtitle: data.treeSubtitle || "",
        siteDescription: data.treeDescription || "",
        introductionText: JSON.stringify(data.footerLines || []),
      },
      create: {
        id: "default",
        heroTitle: data.treeTitle || "",
        heroSubtitle: data.treeSubtitle || "",
        siteDescription: data.treeDescription || "",
        introductionText: JSON.stringify(data.footerLines || []),
      },
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("PUT Export Settings Error:", error);
    return NextResponse.json(
      {
        error: "حدث خطأ أثناء الحفظ",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

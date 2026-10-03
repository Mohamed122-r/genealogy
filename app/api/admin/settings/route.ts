import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const settings = await db.siteSettings.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" },
    });
    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET Settings Error:", error);
    return NextResponse.json({ error: "خطأ في السيرفر" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const data = await request.json();
    console.log("[Settings] Received:", data);

    const settings = await db.siteSettings.upsert({
      where: { id: "default" },
      update: {
        siteName: data.siteName || "",
        siteDescription: data.siteDescription || "",
        developerName: data.developerName || "",
        heroTitle: data.heroTitle || "",
        heroSubtitle: data.heroSubtitle || "",
        heroDescription: data.heroDescription || "",
        introductionText: data.introductionText || null,
        contactEmail: data.contactEmail || "",
        contactPhone: data.contactPhone || "",
        contactAddress: data.contactAddress || "",
      },
      create: {
        id: "default",
        siteName: data.siteName || "",
        siteDescription: data.siteDescription || "",
        developerName: data.developerName || "",
        heroTitle: data.heroTitle || "",
        heroSubtitle: data.heroSubtitle || "",
        heroDescription: data.heroDescription || "",
        introductionText: data.introductionText || null,
        contactEmail: data.contactEmail || "",
        contactPhone: data.contactPhone || "",
        contactAddress: data.contactAddress || "",
      },
    });

    console.log("[Settings] Saved successfully");

    // ⬇️⬇️⬇️ إبطال الكاش حتى تظهر التعديلات فوراً في كل الصفحات
    revalidatePath("/", "layout");
    revalidatePath("/admin", "layout");
    revalidatePath("/admin/settings");
    revalidatePath("/admin/dashboard");
    // ⬆️⬆️⬆️

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("PUT Settings Error:", error);
    return NextResponse.json(
      {
        error: "حدث خطأ أثناء الحفظ",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const people = await db.person.findMany({
      where: { deletedAt: null },
      include: {
        father: { select: { fullName: true } },
        branch: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const headers = [
      "الاسم الأول",
      "اسم العائلة",
      "الجنس",
      "الحالة",
      "اسم الأب",
      "الفرع",
      "تاريخ الميلاد",
      "تاريخ الوفاة",
      "ملاحظات",
    ];

    const rows = people.map((p) => [
      p.firstName,
      p.lastName,
      p.gender,
      p.status,
      p.father?.fullName || "",
      p.branch?.name || "",
      p.birthDate ? new Date(p.birthDate).toISOString().split("T")[0] : "",
      p.deathDate ? new Date(p.deathDate).toISOString().split("T")[0] : "",
      p.notes || "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    // إضافة BOM لدعم العربية في Excel
    const csvWithBOM = "\uFEFF" + csv;

    return new NextResponse(csvWithBOM, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="genealogy-export-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "خطأ في السيرفر" }, { status: 500 });
  }
}

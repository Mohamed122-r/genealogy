import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const data = await request.json();

    if (!data.firstName || data.firstName.trim().length < 2) {
      return NextResponse.json({ error: "الاسم مطلوب (حرفان على الأقل)" }, { status: 400 });
    }

    const firstName = data.firstName.trim();
    const lastName = (data.lastName || "").trim();

    // بناء الاسم الكامل: إذا كان هناك اسم عائلة، نضيفه، وإلا نستخدم الاسم الأول فقط
    // سيتم تحديث الاسم الكامل لاحقاً من سلسلة الآباء
    const fullName = lastName ? `${firstName} ${lastName}` : firstName;

    const newPerson = await db.person.create({
      data: {
        firstName,
        lastName: lastName || " ",
        fullName,
        gender: data.gender || "MALE",
        status: data.status || "ALIVE",
        fatherId: data.fatherId || null,
        branchId: null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        deathDate: data.deathDate ? new Date(data.deathDate) : null,
        notes: data.notes || null,
      },
    });

    return NextResponse.json({ success: true, person: newPerson });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء الحفظ" }, { status: 500 });
  }
}

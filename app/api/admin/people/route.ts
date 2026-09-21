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

    if (!data.firstName) {
      return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 });
    }

    // اسم العائلة الاختياري (افتراضي: "")
    const lastName = data.lastName || "";

    const newPerson = await db.person.create({
      data: {
        firstName: data.firstName,
        lastName: lastName,
        fullName: data.firstName, // سيُحدّث لاحقاً في الـ API
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

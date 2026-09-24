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
    const fullName = firstName;

    // ⚠️ إنشاء الشخص أولاً
    const newPerson = await db.person.create({
      data: {
        firstName,
        lastName: " ",
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

    // ⚠️ إذا كان هناك linkedSonId، نربط الابن بالشخص الجديد
    if (data.linkedSonId) {
      // التحقق من وجود الابن
      const son = await db.person.findUnique({
        where: { id: data.linkedSonId },
        select: { id: true, fatherId: true },
      });

      if (!son) {
        // إلغاء إنشاء الجذر بسبب خطأ في الابن
        await db.person.delete({ where: { id: newPerson.id } });
        return NextResponse.json({ error: "الابن المحدد غير موجود" }, { status: 400 });
      }

      // تحديث الابن ليشير إلى الجذر الجديد كأب
      await db.person.update({
        where: { id: data.linkedSonId },
        data: { fatherId: newPerson.id },
      });
    }

    return NextResponse.json({ success: true, person: newPerson });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء الحفظ" }, { status: 500 });
  }
}

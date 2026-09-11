import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { people } = await request.json();

    if (!Array.isArray(people) || people.length === 0) {
      return NextResponse.json({ error: "لا توجد بيانات" }, { status: 400 });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // خريطة الأسماء للربط
    const existing = await db.person.findMany({
      select: { id: true, fullName: true },
    });
    const nameToId = new Map(existing.map((p) => [p.fullName, p.id]));

    for (const person of people) {
      try {
        if (!person.firstName || !person.lastName) {
          errorCount++;
          errors.push(`صف بدون اسم`);
          continue;
        }

        const fullName = `${person.firstName} ${person.lastName}`;

        // البحث عن الأب بالاسم
        let fatherId = null;
        if (person.fatherFullName) {
          fatherId = nameToId.get(person.fatherFullName) || null;
        }

        const newPerson = await db.person.create({
          data: {
            firstName: person.firstName,
            lastName: person.lastName,
            fullName,
            gender: person.gender || "MALE",
            status: person.status || "ALIVE",
            fatherId,
            birthDate: person.birthDate ? new Date(person.birthDate) : null,
            deathDate: person.deathDate ? new Date(person.deathDate) : null,
            notes: person.notes || null,
          },
        });

        nameToId.set(fullName, newPerson.id);
        successCount++;
      } catch (err) {
        errorCount++;
        errors.push(`فشل: ${person.firstName} ${person.lastName}`);
      }
    }

    return NextResponse.json({
      success: true,
      successCount,
      errorCount,
      errors: errors.slice(0, 10),
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "خطأ في السيرفر" }, { status: 500 });
  }
}

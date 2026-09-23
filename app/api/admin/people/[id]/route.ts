import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const data = await request.json();
    const { id } = params;

    if (data.fatherId === id) {
      return NextResponse.json({ error: "لا يمكن أن يكون أباً لنفسه" }, { status: 400 });
    }

    const firstName = (data.firstName || "").trim();
    const lastName = (data.lastName || "").trim();

    if (firstName.length < 2) {
      return NextResponse.json({ error: "الاسم مطلوب (حرفان على الأقل)" }, { status: 400 });
    }

    const fullName = lastName ? `${firstName} ${lastName}` : firstName;

    const updated = await db.person.update({
      where: { id },
      data: {
        firstName,
        lastName: lastName || " ",
        fullName,
        gender: data.gender,
        status: data.status,
        fatherId: data.fatherId || null,
        branchId: null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        deathDate: data.deathDate ? new Date(data.deathDate) : null,
        notes: data.notes || null,
      },
    });

    return NextResponse.json({ success: true, person: updated });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء التعديل" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = params;

    const childrenCount = await db.person.count({
      where: { fatherId: id, deletedAt: null },
    });

    if (childrenCount > 0) {
      return NextResponse.json(
        { error: `لا يمكن الحذف، لديه ${childrenCount} من الأبناء` },
        { status: 400 }
      );
    }

    await db.person.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء الحذف" }, { status: 500 });
  }
}

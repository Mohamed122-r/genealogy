import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { hash, compare } from "bcryptjs";
import { z } from "zod";

const updateAccountSchema = z.object({
  currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
  newName: z.string().min(2, "الاسم قصير جداً").optional(),
  newEmail: z.string().email("البريد الإلكتروني غير صالح").optional(),
  newPassword: z
    .string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .optional()
    .or(z.literal("")),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateAccountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { currentPassword, newName, newEmail, newPassword } = parsed.data;

    // 1. جلب المستخدم الحالي
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    // 2. التحقق من كلمة المرور الحالية
    const isValid = await compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "كلمة المرور الحالية غير صحيحة" },
        { status: 400 }
      );
    }

    // 3. التحقق من عدم تكرار البريد الإلكتروني
    if (newEmail && newEmail !== user.email) {
      const emailExists = await db.user.findUnique({
        where: { email: newEmail },
      });
      if (emailExists) {
        return NextResponse.json(
          { error: "البريد الإلكتروني مستخدم بالفعل" },
          { status: 400 }
        );
      }
    }

    // 4. تجهيز البيانات للتحديث
    const updateData: any = {};

    if (newName && newName !== user.name) {
      updateData.name = newName;
    }

    if (newEmail && newEmail !== user.email) {
      updateData.email = newEmail;
    }

    if (newPassword && newPassword.trim().length >= 8) {
      updateData.password = await hash(newPassword, 12);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "لا توجد تغييرات للحفظ" },
        { status: 400 }
      );
    }

    // 5. تحديث بيانات المستخدم
    await db.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    // 6. تسجيل العملية في Audit Log
    await db.auditLog.create({
      data: {
        action: "UPDATE_ACCOUNT",
        entityType: "User",
        entityId: session.user.id,
        userId: session.user.id,
        oldValues: {
          name: user.name,
          email: user.email,
        },
        newValues: {
          name: updateData.name || user.name,
          email: updateData.email || user.email,
          passwordChanged: !!updateData.password,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "تم تحديث البيانات بنجاح",
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء التحديث" },
      { status: 500 }
    );
  }
}

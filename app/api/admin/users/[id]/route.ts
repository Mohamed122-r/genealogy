import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canManageSystem } from "@/lib/permissions";
import { hash } from "bcryptjs";
import { z } from "zod";
import { Role } from "@prisma/client";

const updateUserSchema = z.object({
  name: z.string().min(2, "الاسم قصير جداً").optional(),
  email: z.string().email("البريد الإلكتروني غير صالح").optional(),
  password: z.string().min(8, "كلمة المرور 8 أحرف على الأقل").optional().or(z.literal("")),
  role: z.nativeEnum(Role).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user || !canManageSystem(session.user.role)) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    // جلب المستخدم الحالي
    const targetUser = await db.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    const { name, email, password, role } = parsed.data;

    // التحقق من البريد
    if (email && email !== targetUser.email) {
      const existing = await db.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json(
          { error: "البريد الإلكتروني مستخدم بالفعل" },
          { status: 400 }
        );
      }
    }

    // منع تعديل حساب SUPER_ADMIN بواسطة ADMIN
    if (
      targetUser.role === "SUPER_ADMIN" &&
      session.user.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        { error: "لا يمكنك تعديل حساب مدير النظام" },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (password && password.length >= 8) {
      updateData.password = await hash(password, 12);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "لا توجد تغييرات" }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    await db.auditLog.create({
      data: {
        action: "UPDATE_USER",
        entityType: "User",
        entityId: id,
        userId: session.user.id,
        oldValues: {
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role,
        },
        newValues: {
          name: updated.name,
          email: updated.email,
          role: updated.role,
          passwordChanged: !!updateData.password,
        },
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء التعديل" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user || !canManageSystem(session.user.role)) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    // منع حذف النفس
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "لا يمكنك حذف حسابك الحالي" },
        { status: 400 }
      );
    }

    const targetUser = await db.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    // منع حذف SUPER_ADMIN إلا من SUPER_ADMIN آخر
    if (
      targetUser.role === "SUPER_ADMIN" &&
      session.user.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        { error: "لا يمكنك حذف حساب مدير النظام" },
        { status: 403 }
      );
    }

    await db.user.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        action: "DELETE_USER",
        entityType: "User",
        entityId: id,
        userId: session.user.id,
        oldValues: {
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء الحذف" }, { status: 500 });
  }
}

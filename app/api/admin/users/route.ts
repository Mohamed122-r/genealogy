import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canManageSystem } from "@/lib/permissions";
import { hash } from "bcryptjs";
import { z } from "zod";
import { Role } from "@prisma/client";

const createUserSchema = z.object({
  name: z.string().min(2, "الاسم قصير جداً"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(8, "كلمة المرور 8 أحرف على الأقل"),
  role: z.nativeEnum(Role),
});

// GET: جلب جميع المستخدمين
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || !canManageSystem(session.user.role)) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "خطأ في السيرفر" }, { status: 500 });
  }
}

// POST: إضافة مستخدم جديد
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !canManageSystem(session.user.role)) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, role } = parsed.data;

    // التحقق من عدم تكرار البريد
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "البريد الإلكتروني مستخدم بالفعل" },
        { status: 400 }
      );
    }

    // تشفير كلمة المرور
    const hashedPassword = await hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // تسجيل العملية
    await db.auditLog.create({
      data: {
        action: "CREATE_USER",
        entityType: "User",
        entityId: user.id,
        userId: session.user.id,
        newValues: { name, email, role },
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء الحفظ" }, { status: 500 });
  }
}

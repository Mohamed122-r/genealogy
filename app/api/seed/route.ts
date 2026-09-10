import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";

export async function GET() {
  try {
    // 1. إنشاء المستخدم الأدمن
    const password = await hash("Admin@123456", 12);
    await db.user.upsert({
      where: { email: "admin@example.com" },
      update: {},
      create: {
        email: "admin@example.com",
        name: "Mohamed Abdalwhab",
        password,
        role: "SUPER_ADMIN",
      },
    });

    // 2. إنشاء الفروع
    const branchA = await db.branch.upsert({
      where: { name: "الفرع الرئيسي" },
      update: {},
      create: {
        name: "الفرع الرئيسي",
        description: "الجذر الرئيسي للعائلة",
        color: "#0F3D2E",
      },
    });

    const branchB = await db.branch.upsert({
      where: { name: "فرع الأشراف" },
      update: {},
      create: {
        name: "فرع الأشراف",
        description: "إحدى الشعب التاريخية",
        color: "#C9A227",
      },
    });

    // 3. التحقق من عدم وجود أشخاص
    const existingPeople = await db.person.count();
    if (existingPeople > 0) {
      return NextResponse.json({
        success: true,
        message: "Data already seeded",
        count: existingPeople,
      });
    }

    // 4. إنشاء الجد الأول
    const root = await db.person.create({
      data: {
        firstName: "عبدالله",
        lastName: "القحطاني",
        fullName: "عبدالله القحطاني",
        gender: "MALE",
        status: "DECEASED",
        branchId: branchA.id,
      },
    });

    // 5. الجيل الثاني
    const child1 = await db.person.create({
      data: {
        firstName: "محمد",
        lastName: "عبدالله القحطاني",
        fullName: "محمد عبدالله القحطاني",
        gender: "MALE",
        status: "DECEASED",
        fatherId: root.id,
        branchId: branchA.id,
      },
    });

    const child2 = await db.person.create({
      data: {
        firstName: "أحمد",
        lastName: "عبدالله القحطاني",
        fullName: "أحمد عبدالله القحطاني",
        gender: "MALE",
        status: "ALIVE",
        fatherId: root.id,
        branchId: branchB.id,
      },
    });

    // 6. الجيل الثالث
    await db.person.create({
      data: {
        firstName: "خالد",
        lastName: "محمد القحطاني",
        fullName: "خالد محمد القحطاني",
        gender: "MALE",
        status: "ALIVE",
        fatherId: child1.id,
        branchId: branchA.id,
      },
    });

    await db.person.create({
      data: {
        firstName: "عمر",
        lastName: "أحمد القحطاني",
        fullName: "عمر أحمد القحطاني",
        gender: "MALE",
        status: "DECEASED",
        fatherId: child2.id,
        branchId: branchB.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Data seeded successfully",
      count: 5,
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error seeding data",
        error: String(error),
      },
      { status: 500 }
    );
  }
}
import { PrismaClient, PersonStatus, Gender } from "@prisma/client";
import { hash } from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 بدء إدخال البيانات التجريبية...");

  // =====================================================
  // 1. إنشاء المستخدم الأدمن
  // =====================================================
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
  console.log("✅ تم إنشاء المستخدم الأدمن");

  // =====================================================
  // 2. إنشاء الفروع
  // =====================================================
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
  console.log("✅ تم إنشاء الفروع");

  // =====================================================
  // 3. إنشاء الجد الأول (Root)
  // =====================================================
  const root = await db.person.create({
    data: {
      firstName: "عبدالله",
      lastName: "القحطاني",
      fullName: "عبدالله القحطاني",
      gender: Gender.MALE,
      status: PersonStatus.DECEASED,
      branchId: branchA.id,
    },
  });
  console.log("✅ تم إنشاء الجد الأول");

  // =====================================================
  // 4. الجيل الثاني
  // =====================================================
  const child1 = await db.person.create({
    data: {
      firstName: "محمد",
      lastName: "عبدالله القحطاني",
      fullName: "محمد عبدالله القحطاني",
      gender: Gender.MALE,
      status: PersonStatus.DECEASED,
      fatherId: root.id,
      branchId: branchA.id,
    },
  });

  const child2 = await db.person.create({
    data: {
      firstName: "أحمد",
      lastName: "عبدالله القحطاني",
      fullName: "أحمد عبدالله القحطاني",
      gender: Gender.MALE,
      status: PersonStatus.ALIVE,
      fatherId: root.id,
      branchId: branchB.id,
    },
  });
  console.log("✅ تم إنشاء الجيل الثاني");

  // =====================================================
  // 5. الجيل الثالث (الأحفاد)
  // =====================================================
  await db.person.create({
    data: {
      firstName: "خالد",
      lastName: "محمد القحطاني",
      fullName: "خالد محمد القحطاني",
      gender: Gender.MALE,
      status: PersonStatus.ALIVE,
      fatherId: child1.id,
      branchId: branchA.id,
    },
  });

  await db.person.create({
    data: {
      firstName: "عمر",
      lastName: "أحمد القحطاني",
      fullName: "عمر أحمد القحطاني",
      gender: Gender.MALE,
      status: PersonStatus.DECEASED,
      fatherId: child2.id,
      branchId: branchB.id,
    },
  });
  console.log("✅ تم إنشاء الجيل الثالث");

  // =====================================================
  // 6. الجيل الرابع (أسماء متشابهة لاختبار البحث)
  // =====================================================
  await db.person.create({
    data: {
      firstName: "محمد",
      lastName: "خالد القحطاني",
      fullName: "محمد خالد القحطاني",
      gender: Gender.MALE,
      status: PersonStatus.ALIVE,
      fatherId: (await db.person.findFirst({ where: { fullName: "خالد محمد القحطاني" } }))!.id,
      branchId: branchA.id,
    },
  });

  await db.person.create({
    data: {
      firstName: "محمد",
      lastName: "عمر القحطاني",
      fullName: "محمد عمر القحطاني",
      gender: Gender.MALE,
      status: PersonStatus.ALIVE,
      fatherId: (await db.person.findFirst({ where: { fullName: "عمر أحمد القحطاني" } }))!.id,
      branchId: branchB.id,
    },
  });
  console.log("✅ تم إنشاء الجيل الرابع");

  console.log("🎉 تم إدخال البيانات التجريبية بنجاح!");
}

main()
  .catch((e) => {
    console.error("❌ خطأ أثناء إدخال البيانات:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
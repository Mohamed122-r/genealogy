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

  // =====================================================
  // 7. الصفحات الافتراضية
  // =====================================================
  const defaultPages = [
    {
      slug: "introduction",
      title: "المقدمة",
      content: `<p style="font-size: 1.25rem; font-weight: bold; color: #0A1711; margin-bottom: 1.5rem;">الحمد لله رب العالمين، والصلاة والسلام على أشرف الأنبياء والمرسلين.</p><p>تعد الشجرة العائلية وثيقة حية تحمل بين أوراقها ذاكرة الأجيال وهويتهم الثقافية والاجتماعية.</p><div style="background-color: #FDFBF3; border-right: 4px solid #C9A227; padding: 1.5rem; border-radius: 0.5rem; margin: 2rem 0;"><p style="font-style: italic; color: #0A1711; font-size: 1.125rem;">"العائلة التي تحفظ تاريخها هي عائلة تصنع مستقبلها بثقة وإرادة."</p></div><p>ندعوكم لاستكشاف الشجرة التفاعلية.</p>`,
      order: 1,
      isPublished: true,
      showInNav: true,
      iconName: "BookOpen",
    },
    {
      slug: "narrators",
      title: "الرواة",
      content: `<p style="margin-bottom: 1.5rem;">نبذة عن الأشخاص الذين ساهموا في توثيق هذه الشجرة المباركة.</p><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;"><div style="background-color: #FDFBF3; padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(201, 162, 39, 0.2); text-align: center;"><h3 style="color: #0A1711; font-weight: bold; font-size: 1.25rem; margin-bottom: 0.5rem;">الشيخ / محمد بن عبدالله</h3><p style="color: #C9A227; font-weight: bold; margin-bottom: 1rem;">راوٍ رئيسي</p><p style="color: #666;">من كبار الرواة، قام بتوثيق الجيل الأول والثاني.</p></div><div style="background-color: #FDFBF3; padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(201, 162, 39, 0.2); text-align: center;"><h3 style="color: #0A1711; font-weight: bold; font-size: 1.25rem; margin-bottom: 0.5rem;">الأستاذ / أحمد بن خالد</h3><p style="color: #C9A227; font-weight: bold; margin-bottom: 1rem;">مؤرخ</p><p style="color: #666;">باحث في الأنساب، ساهم في مراجعة المصادر.</p></div></div>`,
      order: 2,
      isPublished: true,
      showInNav: true,
      iconName: "Users",
    },
    {
      slug: "sources",
      title: "المصادر",
      content: `<p style="margin-bottom: 1.5rem;">قائمة المصادر والمراجع المعتمدة في توثيق هذه الشجرة.</p><div style="background-color: #FDFBF3; padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(201, 162, 39, 0.2); margin-bottom: 1rem;"><h3 style="color: #0A1711; font-weight: bold; font-size: 1.25rem; margin-bottom: 0.5rem;">كتاب تاريخ العائلة</h3><p style="color: #666;">المؤلف: محمد بن عبدالله | 1985</p></div><div style="background-color: #FDFBF3; padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(201, 162, 39, 0.2); margin-bottom: 1rem;"><h3 style="color: #0A1711; font-weight: bold; font-size: 1.25rem; margin-bottom: 0.5rem;">مخطوطة النسب القديمة</h3><p style="color: #666;">مخطوطة أصلية | القرن الثامن عشر</p></div><div style="background-color: #FDFBF3; padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(201, 162, 39, 0.2);"><h3 style="color: #0A1711; font-weight: bold; font-size: 1.25rem; margin-bottom: 0.5rem;">سجلات الأحوال المدنية</h3><p style="color: #666;">سجل رسمي | 1900 - 2020</p></div>`,
      order: 3,
      isPublished: true,
      showInNav: true,
      iconName: "ScrollText",
    },
    {
      slug: "contact",
      title: "تواصل معنا",
      content: `<p style="margin-bottom: 1.5rem;">يسعدنا استقبال استفساراتكم واقتراحاتكم.</p><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;"><div style="background-color: #FDFBF3; padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(201, 162, 39, 0.2);"><h3 style="color: #0A1711; font-weight: bold; margin-bottom: 0.5rem;">📧 البريد الإلكتروني</h3><p style="color: #666;">info@example.com</p></div><div style="background-color: #FDFBF3; padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(201, 162, 39, 0.2);"><h3 style="color: #0A1711; font-weight: bold; margin-bottom: 0.5rem;">📱 الهاتف</h3><p style="color: #666;">+966 555 555 555</p></div><div style="background-color: #FDFBF3; padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(201, 162, 39, 0.2);"><h3 style="color: #0A1711; font-weight: bold; margin-bottom: 0.5rem;">📍 العنوان</h3><p style="color: #666;">المملكة العربية السعودية</p></div></div>`,
      order: 4,
      isPublished: true,
      showInNav: true,
      iconName: "Mail",
    },
  ];

  for (const pageData of defaultPages) {
    await db.page.upsert({
      where: { slug: pageData.slug },
      update: {},
      create: pageData,
    });
  }
  console.log("✅ تم إضافة الصفحات الافتراضية");

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

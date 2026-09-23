import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const defaultPages = [
      {
        slug: "introduction",
        title: "المقدمة",
        content: `
          <p style="font-size: 1.25rem; font-weight: bold; color: #0A1711; margin-bottom: 1.5rem;">الحمد لله رب العالمين، والصلاة والسلام على أشرف الأنبياء والمرسلين.</p>
          <p>تعد الشجرة العائلية وثيقة حية تحمل بين أوراقها ذاكرة الأجيال وهويتهم الثقافية والاجتماعية.</p>
          <div style="background-color: #FDFBF3; border-right: 4px solid #C9A227; padding: 1.5rem; border-radius: 0.5rem; margin: 2rem 0;">
            <p style="font-style: italic; color: #0A1711; font-size: 1.125rem;">"العائلة التي تحفظ تاريخها هي عائلة تصنع مستقبلها بثقة وإرادة."</p>
          </div>
          <p>ندعوكم لاستكشاف الشجرة التفاعلية، والبحث في أسماء أجدادكم.</p>
        `,
        order: 1,
        isPublished: true,
        showInNav: true,
        iconName: "BookOpen",
      },
      {
        slug: "narrators",
        title: "الرواة",
        content: `
          <p style="margin-bottom: 1.5rem;">نبذة عن الأشخاص الذين ساهموا في توثيق وتاريخ هذه الشجرة المباركة.</p>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
            <div style="background-color: #FDFBF3; padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(201, 162, 39, 0.2); text-align: center;">
              <h3 style="color: #0A1711; font-weight: bold; font-size: 1.25rem; margin-bottom: 0.5rem;">الشيخ / محمد بن عبدالله</h3>
              <p style="color: #C9A227; font-weight: bold; margin-bottom: 1rem;">راوٍ رئيسي</p>
              <p style="color: #666;">من كبار الرواة، قام بتوثيق الجيل الأول والثاني.</p>
            </div>
            <div style="background-color: #FDFBF3; padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(201, 162, 39, 0.2); text-align: center;">
              <h3 style="color: #0A1711; font-weight: bold; font-size: 1.25rem; margin-bottom: 0.5rem;">الأستاذ / أحمد بن خالد</h3>
              <p style="color: #C9A227; font-weight: bold; margin-bottom: 1rem;">مؤرخ</p>
              <p style="color: #666;">باحث في الأنساب، ساهم في مراجعة المصادر التاريخية.</p>
            </div>
          </div>
        `,
        order: 2,
        isPublished: true,
        showInNav: true,
        iconName: "Users",
      },
      {
        slug: "sources",
        title: "المصادر",
        content: `
          <p style="margin-bottom: 1.5rem;">قائمة المصادر والمراجع المعتمدة في توثيق هذه الشجرة.</p>
          <div style="background-color: #FDFBF3; padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(201, 162, 39, 0.2); margin-bottom: 1rem;">
            <h3 style="color: #0A1711; font-weight: bold; font-size: 1.25rem; margin-bottom: 0.5rem;">كتاب تاريخ العائلة</h3>
            <p style="color: #666;">المؤلف: محمد بن عبدالله | 1985</p>
          </div>
          <div style="background-color: #FDFBF3; padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(201, 162, 39, 0.2); margin-bottom: 1rem;">
            <h3 style="color: #0A1711; font-weight: bold; font-size: 1.25rem; margin-bottom: 0.5rem;">مخطوطة النسب القديمة</h3>
            <p style="color: #666;">مخطوطة أصلية | القرن الثامن عشر</p>
          </div>
          <div style="background-color: #FDFBF3; padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(201, 162, 39, 0.2);">
            <h3 style="color: #0A1711; font-weight: bold; font-size: 1.25rem; margin-bottom: 0.5rem;">سجلات الأحوال المدنية</h3>
            <p style="color: #666;">سجل رسمي | 1900 - 2020</p>
          </div>
        `,
        order: 3,
        isPublished: true,
        showInNav: true,
        iconName: "ScrollText",
      },
      {
        slug: "contact",
        title: "تواصل معنا",
        content: `
          <p style="margin-bottom: 1.5rem;">يسعدنا استقبال استفساراتكم واقتراحاتكم.</p>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
            <div style="background-color: #FDFBF3; padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(201, 162, 39, 0.2);">
              <h3 style="color: #0A1711; font-weight: bold; margin-bottom: 0.5rem;">📧 البريد الإلكتروني</h3>
              <p style="color: #666;">info@example.com</p>
            </div>
            <div style="background-color: #FDFBF3; padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(201, 162, 39, 0.2);">
              <h3 style="color: #0A1711; font-weight: bold; margin-bottom: 0.5rem;">📱 الهاتف</h3>
              <p style="color: #666;">+966 555 555 555</p>
            </div>
            <div style="background-color: #FDFBF3; padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(201, 162, 39, 0.2);">
              <h3 style="color: #0A1711; font-weight: bold; margin-bottom: 0.5rem;">📍 العنوان</h3>
              <p style="color: #666;">المملكة العربية السعودية</p>
            </div>
          </div>
        `,
        order: 4,
        isPublished: true,
        showInNav: true,
        iconName: "Mail",
      },
    ];

    let created = 0;
    let updated = 0;

    for (const pageData of defaultPages) {
      const existing = await db.page.findUnique({ where: { slug: pageData.slug } });
      if (existing) {
        updated++;
      } else {
        await db.page.create({ data: pageData });
        created++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `تم إنشاء ${created} صفحة، وتحديث ${updated} صفحة`,
      created,
      updated,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

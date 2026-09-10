"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManagePeople } from "@/lib/permissions";
import { importPersonSchema, ImportPerson } from "@/lib/validations/import";
import { AuditLogService } from "@/server/services/audit.service";

export async function importPeople(data: ImportPerson[]) {
  const session = await auth();
  if (!session?.user || !canManagePeople(session.user.role)) {
    throw new Error("غير مصرح لك بهذه العملية");
  }

  // تحقق جماعي من البيانات
  const parsedData = z.array(importPersonSchema).safeParse(data);
  if (!parsedData.success) {
    throw new Error("يوجد أخطاء في البيانات المرفقة");
  }

  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  // تجهيز خريطة للأسماء للربط السريع
  const existingPeople = await db.person.findMany({
    select: { id: true, fullName: true, branchId: true },
  });
  const nameToId = new Map(existingPeople.map(p => [p.fullName, p.id]));

  const branches = await db.branch.findMany({ select: { id: true, name: true } });
  const branchNameToId = new Map(branches.map(b => [b.name, b.id]));

  for (const person of parsedData.data) {
    try {
      const fatherId = person.fatherFullName ? nameToId.get(person.fatherFullName) : null;
      const branchId = person.branchName ? branchNameToId.get(person.branchName) : null;

      const newPerson = await db.person.create({
        data: {
          firstName: person.firstName,
          lastName: person.lastName,
          fullName: `${person.firstName} ${person.lastName}`,
          gender: person.gender,
          status: person.status,
          fatherId,
          branchId,
          birthDate: person.birthDate ? new Date(person.birthDate) : null,
          deathDate: person.deathDate ? new Date(person.deathDate) : null,
          notes: person.notes,
        },
      });

      // تحديث خريطة الأسماء للسماح بإضافة أبناء لهم في نفس الدفعة
      nameToId.set(newPerson.fullName, newPerson.id);

      await AuditLogService.log({
        action: "IMPORT_PERSON",
        entityType: "Person",
        entityId: newPerson.id,
        userId: session.user.id,
      });

      successCount++;
    } catch (error) {
      errorCount++;
      errors.push(`فشل إضافة: ${person.firstName} ${person.lastName}`);
    }
  }

  revalidatePath("/admin/people");
  revalidatePath("/tree");

  return {
    success: successCount > 0,
    successCount,
    errorCount,
    errors,
  };
}

// تصدير البيانات CSV
export async function exportPeopleCSV() {
  const session = await auth();
  if (!session?.user || !canManagePeople(session.user.role)) {
    throw new Error("غير مصرح لك بهذه العملية");
  }

  const people = await db.person.findMany({
    where: { deletedAt: null },
    include: { father: { select: { fullName: true } }, branch: { select: { name: true } } },
  });

  // تحويل البيانات إلى صيغة CSV
  const headers = ["الاسم الأول", "اسم العائلة", "الاسم الكامل", "الجنس", "الحالة", "اسم الأب", "الفرع", "تاريخ الميلاد", "تاريخ الوفاة"];
  const rows = people.map(p => [
    p.firstName,
    p.lastName,
    p.fullName,
    p.gender,
    p.status,
    p.father?.fullName || "",
    p.branch?.name || "",
    p.birthDate?.toISOString() || "",
    p.deathDate?.toISOString() || "",
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return csvContent;
}
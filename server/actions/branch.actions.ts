"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManageSystem } from "@/lib/permissions";
import { z } from "zod";

const branchSchema = z.object({
  name: z.string().min(2, "اسم الفرع قصير جداً").max(100),
  description: z.string().optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "لون غير صالح"),
});

export async function createBranch(data: z.infer<typeof branchSchema>) {
  const session = await auth();
  if (!session?.user || !canManageSystem(session.user.role)) {
    throw new Error("غير مصرح لك بهذه العملية");
  }

  const parsed = branchSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0].message);
  }

  try {
    const branch = await db.branch.create({
      data: parsed.data,
    });

    revalidatePath("/admin/branches");
    return { success: true, id: branch.id };
  } catch (error) {
    throw new Error("حدث خطأ أثناء إضافة الفرع (ربما الاسم مكرر)");
  }
}

export async function updateBranch(id: string, data: z.infer<typeof branchSchema>) {
  const session = await auth();
  if (!session?.user || !canManageSystem(session.user.role)) {
    throw new Error("غير مصرح لك بهذه العملية");
  }

  const parsed = branchSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0].message);
  }

  try {
    const branch = await db.branch.update({
      where: { id },
      data: parsed.data,
    });

    revalidatePath("/admin/branches");
    return { success: true, id: branch.id };
  } catch (error) {
    throw new Error("حدث خطأ أثناء تعديل الفرع");
  }
}

export async function deleteBranch(id: string) {
  const session = await auth();
  if (!session?.user || !canManageSystem(session.user.role)) {
    throw new Error("غير مصرح لك بهذه العملية");
  }

  // التحقق من عدم وجود أشخاص مرتبطين بالفرع
  const linkedPeople = await db.person.count({ where: { branchId: id, deletedAt: null } });
  if (linkedPeople > 0) {
    throw new Error(`لا يمكن حذف الفرع، يوجد ${linkedPeople} شخص مرتبط به`);
  }

  try {
    await db.branch.delete({ where: { id } });
    revalidatePath("/admin/branches");
    return { success: true };
  } catch (error) {
    throw new Error("حدث خطأ أثناء حذف الفرع");
  }
}
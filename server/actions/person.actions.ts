"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManagePeople } from "@/lib/permissions";
import { personSchema, PersonFormData } from "@/lib/validations/person";

async function validateFather(fatherId: string | null | undefined, personId?: string) {
  if (!fatherId) return null;
  if (personId && fatherId === personId) throw new Error("لا يمكن أن يكون الشخص أباً لنفسه");

  let currentId: string | null = fatherId;
  const visited = new Set<string>();
  while (currentId) {
    if (personId && currentId === personId) throw new Error("توجد علاقة دائرية");
    if (visited.has(currentId)) throw new Error("يوجد خطأ في بنية الشجرة");
    visited.add(currentId);

    const person = await db.person.findUnique({ where: { id: currentId }, select: { fatherId: true } });
    currentId = person?.fatherId || null;
  }
  return fatherId;
}

export async function createPerson(data: PersonFormData) {
  const session = await auth();
  if (!session?.user || !canManagePeople(session.user.role)) throw new Error("غير مصرح لك");
  const parsed = personSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const { firstName, lastName, gender, status, birthDate, deathDate, notes, branchId } = parsed.data;
  const validatedFatherId = await validateFather(parsed.data.fatherId);

  const newPerson = await db.person.create({
    data: {
      firstName, lastName, fullName: `${firstName} ${lastName}`, gender, status,
      fatherId: validatedFatherId, branchId: branchId || null,
      birthDate: birthDate ? new Date(birthDate) : null,
      deathDate: deathDate ? new Date(deathDate) : null, notes: notes || null,
    },
  });

  await db.auditLog.create({ data: { action: "CREATE_PERSON", entityType: "Person", entityId: newPerson.id, userId: session.user.id } });
  revalidatePath("/admin/people"); revalidatePath("/tree");
  return { success: true, id: newPerson.id };
}

export async function updatePerson(id: string, data: PersonFormData) {
  const session = await auth();
  if (!session?.user || !canManagePeople(session.user.role)) throw new Error("غير مصرح لك");
  const parsed = personSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const oldPerson = await db.person.findUnique({ where: { id } });
  const validatedFatherId = await validateFather(parsed.data.fatherId, id);
  const { firstName, lastName, gender, status, birthDate, deathDate, notes, branchId } = parsed.data;

  await db.person.update({
    where: { id },
    data: {
      firstName, lastName, fullName: `${firstName} ${lastName}`, gender, status,
      fatherId: validatedFatherId, branchId: branchId || null,
      birthDate: birthDate ? new Date(birthDate) : null,
      deathDate: deathDate ? new Date(deathDate) : null, notes: notes || null,
    },
  });

  await db.auditLog.create({ data: { action: "UPDATE_PERSON", entityType: "Person", entityId: id, userId: session.user.id, oldValues: oldPerson as any, newValues: parsed.data as any } });
  revalidatePath("/admin/people"); revalidatePath("/tree");
  return { success: true, id };
}

export async function deletePerson(id: string) {
  const session = await auth();
  if (!session?.user || !canManagePeople(session.user.role)) throw new Error("غير مصرح لك");
  const childrenCount = await db.person.count({ where: { fatherId: id, deletedAt: null } });
  if (childrenCount > 0) throw new Error(`لا يمكن حذف الشخص، لديه ${childrenCount} من الأبناء`);
  await db.person.update({ where: { id }, data: { deletedAt: new Date() } });
  await db.auditLog.create({ data: { action: "DELETE_PERSON", entityType: "Person", entityId: id, userId: session.user.id } });
  revalidatePath("/admin/people"); revalidatePath("/tree");
  return { success: true };
}
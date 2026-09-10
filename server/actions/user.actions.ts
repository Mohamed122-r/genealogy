"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManageSystem } from "@/lib/permissions";
import { z } from "zod";
import { hash } from "bcryptjs";
import { Role } from "@prisma/client";

const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8).optional(),
  role: z.nativeEnum(Role),
});

export async function createUser(data: z.infer<typeof userSchema>) {
  const session = await auth();
  if (!session?.user || !canManageSystem(session.user.role)) {
    throw new Error("غير مصرح لك بهذه العملية");
  }

  const parsed = userSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  try {
    const hashedPassword = await hash(parsed.data.password || "Default@123", 12);
    const user = await db.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        password: hashedPassword,
        role: parsed.data.role,
      },
    });

    revalidatePath("/admin/users");
    return { success: true, id: user.id };
  } catch (error) {
    throw new Error("حدث خطأ (ربما البريد الإلكتروني مستخدم بالفعل)");
  }
}

export async function deleteUser(id: string) {
  const session = await auth();
  if (!session?.user || !canManageSystem(session.user.role)) {
    throw new Error("غير مصرح لك بهذه العملية");
  }

  if (id === session.user.id) {
    throw new Error("لا يمكنك حذف حسابك الحالي");
  }

  try {
    await db.user.delete({ where: { id } });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    throw new Error("حدث خطأ أثناء حذف المستخدم");
  }
}
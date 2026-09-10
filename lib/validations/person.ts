import { z } from "zod";
import { PersonStatus, Gender } from "@prisma/client";

export const personSchema = z.object({
  firstName: z.string().min(2, "الاسم الأول قصير جداً").max(50),
  lastName: z.string().min(2, "اسم العائلة قصير جداً").max(50),
  gender: z.nativeEnum(Gender, { message: "اختر الجنس" }),
  status: z.nativeEnum(PersonStatus, { message: "اختر الحالة" }),
  fatherId: z.string().nullable().optional(),
  branchId: z.string().nullable().optional(),
  birthDate: z.string().optional().nullable(),
  deathDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type PersonFormData = z.infer<typeof personSchema>;
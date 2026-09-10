import { z } from "zod";
import { PersonStatus, Gender } from "@prisma/client";

// مخطط استيراد CSV/JSON (بدون fatherId لأنه سيتم ربطه بالاسم)
export const importPersonSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  gender: z.nativeEnum(Gender),
  status: z.nativeEnum(PersonStatus),
  fatherFullName: z.string().optional().nullable(), // اسم الأب الكامل للربط
  branchName: z.string().optional().nullable(), // اسم الفرع للربط
  birthDate: z.string().optional().nullable(),
  deathDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type ImportPerson = z.infer<typeof importPersonSchema>;
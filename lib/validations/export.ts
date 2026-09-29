import { z } from "zod";

export const exportSettingsSchema = z.object({
  title: z.string().max(200, "العنوان طويل جداً").optional(),
  subtitle: z.string().max(300, "العنوان الفرعي طويل جداً").optional(),
  footerLines: z.array(z.string().max(200)).max(5, "بحد أقصى 5 أسطر").optional(),
});

export type ExportSettings = z.infer<typeof exportSettingsSchema>;

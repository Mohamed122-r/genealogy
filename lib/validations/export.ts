import { z } from "zod";

export const exportSettingsSchema = z.object({
  treeTitle: z.string().max(200, "العنوان طويل جداً").optional(),
  treeSubtitle: z.string().max(300).optional(),
  treeDescription: z.string().max(1000).optional(),
  footerLines: z.array(z.string().max(200)).max(5).optional(),
});

export type ExportSettings = z.infer<typeof exportSettingsSchema>;

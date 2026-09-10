import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * دالة دمج الأصناف (Classes) مع دعم Tailwind
 * تستخدم لدمج الأصناف الشرطية وتجنب التعارض
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * تنسيق التاريخ بالعربية
 */
export function formatDate(date: Date | string | null): string {
  if (!date) return "غير محدد";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * تنسيق الأرقام بالعربية
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("ar-EG");
}

/**
 * اختصار الاسم الطويل
 */
export function truncateName(name: string, maxLength: number = 15): string {
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength - 3) + "...";
}

/**
 * توليد لون عشوائي
 */
export function getRandomColor(): string {
  const colors = ["#C9A227", "#0F3D2E", "#8B4513", "#228B22", "#696969"];
  return colors[Math.floor(Math.random() * colors.length)];
}
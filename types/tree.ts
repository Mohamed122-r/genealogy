// =====================================================
// أنواع بيانات الشجرة (Tree Types)
// =====================================================

// حالة الشخص
export type PersonStatus = "ALIVE" | "DECEASED" | "DISCONNECTED" | "UNKNOWN";

// جنس الشخص
export type Gender = "MALE" | "FEMALE";

// عقدة الشخص (أي شخص في الشجرة)
export interface PersonNode {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  gender: Gender;
  status: PersonStatus;
  fatherId: string | null;
  branchId: string | null;
  birthDate: Date | null;
  deathDate: Date | null;
}

// إحداثيات العقدة
export interface Coordinates {
  x: number;
  y: number;
}

// عقدة التخطيط (بعد حساب المواقع)
export interface LayoutNode extends PersonNode {
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
}

// خيارات تخطيط الشجرة
export interface TreeLayoutOptions {
  width?: number;
  height?: number;
  horizontalSpacing?: number;
  verticalSpacing?: number;
}

// ألوان الحالات
export const STATUS_COLORS: Record<PersonStatus, string> = {
  ALIVE: "#228B22",
  DECEASED: "#8B4513",
  DISCONNECTED: "#696969",
  UNKNOWN: "#D3D3D3",
};

// ترجمة الحالة إلى عربية
export const STATUS_LABELS: Record<PersonStatus, string> = {
  ALIVE: "حي",
  DECEASED: "متوفى",
  DISCONNECTED: "منقطع",
  UNKNOWN: "غير معروف",
};

// ترجمة الجنس إلى عربية
export const GENDER_LABELS: Record<Gender, string> = {
  MALE: "ذكر",
  FEMALE: "أنثى",
};
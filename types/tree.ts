// =====================================================
// أنواع بيانات الشجرة
// =====================================================

export type PersonStatus = "ALIVE" | "DECEASED" | "DISCONNECTED" | "UNKNOWN";
export type Gender = "MALE" | "FEMALE";

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

export interface LayoutNode extends PersonNode {
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
}

export interface TreeLayoutOptions {
  width?: number;
  height?: number;
  leafWidth?: number;
  leafHeight?: number;
  horizontalGap?: number;
  verticalGap?: number;
}

// ألوان الحالات
export const STATUS_COLORS: Record<PersonStatus, string> = {
  ALIVE: "#4A8B3F",
  DECEASED: "#E5B80B",
  DISCONNECTED: "#8B7355",
  UNKNOWN: "#A8A8A8",
};

// ترجمة الحالات
export const STATUS_LABELS: Record<PersonStatus, string> = {
  ALIVE: "حي",
  DECEASED: "متوفى",
  DISCONNECTED: "منقطع",
  UNKNOWN: "غير معروف",
};

export const GENDER_LABELS: Record<Gender, string> = {
  MALE: "ذكر",
  FEMALE: "أنثى",
};

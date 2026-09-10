import { Role } from "@prisma/client";

// =====================================================
// صلاحية إدارة الأشخاص (إضافة، تعديل)
// =====================================================
export const canManagePeople = (role: Role): boolean => {
  return ["SUPER_ADMIN", "ADMIN", "EDITOR"].includes(role);
};

// =====================================================
// صلاحية إدارة النظام (الفروع، المستخدمين، الإعدادات)
// =====================================================
export const canManageSystem = (role: Role): boolean => {
  return ["SUPER_ADMIN", "ADMIN"].includes(role);
};

// =====================================================
// صلاحية الوصول للوحة التحكم
// =====================================================
export const canAccessAdmin = (role: Role): boolean => {
  return ["SUPER_ADMIN", "ADMIN", "EDITOR", "VIEWER"].includes(role);
};

// =====================================================
// صلاحية حذف الأشخاص
// =====================================================
export const canDeletePeople = (role: Role): boolean => {
  return ["SUPER_ADMIN", "ADMIN"].includes(role);
};

// =====================================================
// الحصول على اسم الدور بالعربية
// =====================================================
export const getRoleLabel = (role: Role): string => {
  const labels: Record<Role, string> = {
    SUPER_ADMIN: "مدير النظام",
    ADMIN: "مدير",
    EDITOR: "محرر",
    VIEWER: "مشاهد",
  };
  return labels[role] || role;
};
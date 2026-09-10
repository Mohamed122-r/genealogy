import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

interface AuditLogInput {
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  oldValues?: any;
  newValues?: any;
}

export const AuditLogService = {
  async log(input: AuditLogInput) {
    try {
      await db.auditLog.create({
        data: {
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          userId: input.userId,
          oldValues: input.oldValues as Prisma.InputJsonValue,
          newValues: input.newValues as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      console.error("Audit log error:", error);
    }
  },
};
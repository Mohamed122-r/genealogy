"use client";

import { LayoutNode } from "@/types/tree";

interface TooltipProps {
  node: LayoutNode | null;
  position: { x: number; y: number };
  allNodes: LayoutNode[];
}

function getStatusLabel(status: string) {
  switch (status) {
    case "ALIVE": return "حي";
    case "DECEASED": return "متوفى";
    case "DISCONNECTED": return "منقطع";
    default: return "غير معروف";
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "ALIVE": return "#4A8B3F";
    case "DECEASED": return "#E5B80B";
    case "DISCONNECTED": return "#8B7355";
    default: return "#A8A8A8";
  }
}

function getGenderLabel(gender: string) {
  return gender === "MALE" ? "ذكر" : "أنثى";
}

function formatDate(date: Date | null): string {
  if (!date) return "غير محدد";
  try {
    return new Date(date).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "غير محدد";
  }
}

export function Tooltip({ node, position, allNodes }: TooltipProps) {
  if (!node) return null;

  const father = node.fatherId ? allNodes.find((n) => n.id === node.fatherId) : null;
  const childrenCount = allNodes.filter((n) => n.fatherId === node.id).length;

  return (
    <div
      className="fixed z-[100] pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="bg-dark-bg text-white rounded-2xl shadow-2xl border-2 border-gold-500 overflow-hidden min-w-[250px] max-w-[320px]">
        <div className="bg-gradient-to-l from-gold-500 to-gold-600 px-4 py-3">
          <p className="font-heritage font-bold text-dark-bg text-lg leading-tight">
            {node.fullName}
          </p>
        </div>

        <div className="p-4 space-y-2.5 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-400 text-xs">الحالة:</span>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{
                backgroundColor: getStatusColor(node.status) + "30",
                color: getStatusColor(node.status),
                border: `1px solid ${getStatusColor(node.status)}60`,
              }}
            >
              {getStatusLabel(node.status)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-400 text-xs">الجنس:</span>
            <span className="text-white text-xs font-bold">{getGenderLabel(node.gender)}</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-400 text-xs">الجيل:</span>
            <span className="text-gold-500 text-xs font-bold">
              {node.depth === 0 ? "الجيل الأول (الجذر)" : `الجيل ${node.depth + 1}`}
            </span>
          </div>

          {father && (
            <div className="flex items-start justify-between gap-4">
              <span className="text-gray-400 text-xs">الأب:</span>
              <span className="text-white text-xs font-bold text-left">{father.fullName}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-400 text-xs">عدد الأبناء:</span>
            <span className="text-gold-500 text-xs font-bold">{childrenCount}</span>
          </div>

          {node.birthDate && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-400 text-xs">تاريخ الميلاد:</span>
              <span className="text-white text-xs">{formatDate(node.birthDate)}</span>
            </div>
          )}

          {node.deathDate && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-400 text-xs">تاريخ الوفاة:</span>
              <span className="text-white text-xs">{formatDate(node.deathDate)}</span>
            </div>
          )}

          <div className="pt-2 border-t border-gold-500/30">
            <p className="text-[10px] text-gold-500 text-center">
              اضغط للتركيز على الشخص
            </p>
          </div>
        </div>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 bg-dark-bg border-b-2 border-r-2 border-gold-500 transform rotate-45" />
    </div>
  );
}

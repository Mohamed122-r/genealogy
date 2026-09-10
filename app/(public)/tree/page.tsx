"use client";

import { useRef, useState } from "react";
import { TreePine } from "lucide-react";
import { TreeCanvas } from "@/components/tree/TreeCanvas";
import { PersonNode } from "@/types/tree";

// =====================================================
// البيانات التجريبية (يتم استبدالها بالبيانات الحقيقية من قاعدة البيانات)
// =====================================================
const sampleNodes: PersonNode[] = [
  {
    id: "1",
    firstName: "عبدالله",
    lastName: "القحطاني",
    fullName: "عبدالله القحطاني",
    gender: "MALE",
    status: "DECEASED",
    fatherId: null,
    branchId: null,
    birthDate: null,
    deathDate: null,
  },
  {
    id: "2",
    firstName: "محمد",
    lastName: "عبدالله القحطاني",
    fullName: "محمد عبدالله القحطاني",
    gender: "MALE",
    status: "DECEASED",
    fatherId: "1",
    branchId: null,
    birthDate: null,
    deathDate: null,
  },
  {
    id: "3",
    firstName: "أحمد",
    lastName: "عبدالله القحطاني",
    fullName: "أحمد عبدالله القحطاني",
    gender: "MALE",
    status: "ALIVE",
    fatherId: "1",
    branchId: null,
    birthDate: null,
    deathDate: null,
  },
  {
    id: "4",
    firstName: "خالد",
    lastName: "محمد القحطاني",
    fullName: "خالد محمد القحطاني",
    gender: "MALE",
    status: "ALIVE",
    fatherId: "2",
    branchId: null,
    birthDate: null,
    deathDate: null,
  },
  {
    id: "5",
    firstName: "عمر",
    lastName: "أحمد القحطاني",
    fullName: "عمر أحمد القحطاني",
    gender: "MALE",
    status: "DECEASED",
    fatherId: "3",
    branchId: null,
    birthDate: null,
    deathDate: null,
  },
];

export default function TreePage() {
  const [nodes] = useState<PersonNode[]>(sampleNodes);
  const [selectedPersonId, setSelectedPersonId] = useState<string | undefined>();
  const svgRef = useRef<SVGSVGElement>(null);

  return (
    <div className="min-h-screen bg-heritage-bg">
      {/* الهيدر المخصص */}
      <div className="bg-dark-bg text-white py-4 md:py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gold-500 flex items-center justify-center shadow-lg">
              <TreePine className="w-7 h-7 text-dark-bg" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-heritage font-bold">
                شجرة النسب العائلية الكريمة
              </h1>
              <p className="text-xs md:text-sm text-gold-500 mt-1">
                استكشف، ابحث، وكبّر الشجرة للتفاعل معها
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* منطقة الشجرة */}
      <div className="container mx-auto px-2 md:px-4 py-4 md:py-6">
        <div className="bg-white rounded-2xl border border-gold-500/30 shadow-2xl overflow-hidden">
          <TreeCanvas
            nodes={nodes}
            selectedPersonId={selectedPersonId}
            onSelectPerson={(id) => setSelectedPersonId(id)}
            svgRef={svgRef}
            onExport={async () => {
              // سيتم إضافة منطق التصدير لاحقاً
            }}
          />
        </div>
      </div>
    </div>
  );
}
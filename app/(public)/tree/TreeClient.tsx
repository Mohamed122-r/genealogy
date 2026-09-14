"use client";

import { useRef, useState } from "react";
import { TreePine } from "lucide-react";
import { TreeCanvas } from "@/components/tree/TreeCanvas";
import { ExportMenu } from "@/components/tree/ExportMenu";
import { PersonNode } from "@/types/tree";

interface TreeClientProps {
  nodes: PersonNode[];
}

export function TreeClient({ nodes }: TreeClientProps) {
  const [selectedPersonId, setSelectedPersonId] = useState<string | undefined>();
  const svgRef = useRef<SVGSVGElement>(null);

  return (
    <div className="min-h-screen bg-heritage-bg">
      {/* الهيدر */}
      <div className="bg-dark-bg text-white py-4 md:py-6">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gold-500 flex items-center justify-center shadow-lg">
              <TreePine className="w-7 h-7 text-dark-bg" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-heritage font-bold">
                شجرة النسب العائلية الكريمة
              </h1>
              <p className="text-xs md:text-sm text-gold-500 mt-1">
                {nodes.length} شخص في قاعدة البيانات
              </p>
            </div>
          </div>

          {/* زر التصدير */}
          <ExportMenu svgRef={svgRef} treeTitle="شجرة-النسب-العائلية" />
        </div>
      </div>

      {/* الشجرة */}
      <div className="container mx-auto px-2 md:px-4 py-4 md:py-6">
        <div className="bg-white rounded-2xl border border-gold-500/30 shadow-2xl overflow-hidden">
          {nodes.length === 0 ? (
            <div className="p-16 text-center">
              <TreePine className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-dark-bg mb-2">
                لا يوجد أشخاص في قاعدة البيانات
              </h2>
              <p className="text-gray-500">
                قم بإضافة أشخاص من لوحة التحكم لتظهر في الشجرة.
              </p>
            </div>
          ) : (
            <TreeCanvas
              nodes={nodes}
              selectedPersonId={selectedPersonId}
              onSelectPerson={(id) => setSelectedPersonId(id)}
              svgRef={svgRef}
              onExport={async () => {}}
            />
          )}
        </div>
      </div>
    </div>
  );
}

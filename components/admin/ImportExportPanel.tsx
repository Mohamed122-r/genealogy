"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download, Loader2, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { importPeople, exportPeopleCSV } from "@/server/actions/import.actions";

export function ImportExportPanel() {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        // محاولة تحويل JSON أولاً، ثم CSV
        let data: any[] = [];
        
        if (file.name.endsWith('.json')) {
          data = JSON.parse(text);
        } else {
          // تحويل CSV بسيط (يمكن تحسينه بمكتبة PapaParse لاحقاً)
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
          data = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.replace(/"/g, ''));
            return Object.fromEntries(headers.map((h, i) => [h, values[i]]));
          });
        }

        // تعيين أسماء الحقول للـ Schema
        const formattedData = data.map((row: any) => ({
          firstName: row["الاسم الأول"] || row.firstName,
          lastName: row["اسم العائلة"] || row.lastName,
          gender: row["الجنس"] || row.gender || "MALE",
          status: row["الحالة"] || row.status || "ALIVE",
          fatherFullName: row["اسم الأب"] || row.fatherFullName || null,
          branchName: row["الفرع"] || row.branchName || null,
          birthDate: row["تاريخ الميلاد"] || null,
          deathDate: row["تاريخ الوفاة"] || null,
          notes: row["ملاحظات"] || null,
        }));

        const result = await importPeople(formattedData);

        if (result.success) {
          toast({ 
            title: "تم الاستيراد", 
            description: `تم استيراد ${result.successCount} شخص بنجاح، و ${result.errorCount} فشل` 
          });
        } else {
          toast({ title: "خطأ", description: "فشل الاستيراد", variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "خطأ", description: "صيغة الملف غير مدعومة", variant: "destructive" });
      } finally {
        setIsImporting(false);
        e.target.value = "";
      }
    };

    reader.readAsText(file);
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const csvData = await exportPeopleCSV();
      const blob = new Blob(["\uFEFF" + csvData], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "people-export.csv";
      link.click();
      URL.revokeObjectURL(url);
      toast({ title: "نجاح", description: "تم تصدير البيانات بنجاح" });
    } catch (error) {
      toast({ title: "خطأ", description: "فشل التصدير", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="flex gap-4">
      <label className="cursor-pointer">
        <input type="file" accept=".csv,.json" className="hidden" onChange={handleImport} disabled={isImporting} />
        <Button variant="outline" disabled={isImporting} asChild>
          <span className="flex items-center gap-2">
            {isImporting ? <Loader2 className="animate-spin" /> : <Upload className="w-4 h-4" />}
            استيراد (CSV / JSON)
          </span>
        </Button>
      </label>

      <Button variant="outline" onClick={handleExport} disabled={isExporting}>
        {isExporting ? <Loader2 className="animate-spin" /> : <Download className="w-4 h-4" />}
        تصدير (CSV)
      </Button>
    </div>
  );
}
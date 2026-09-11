"use client";

import { useState } from "react";
import { Upload, Download, FileSpreadsheet, Loader2 } from "lucide-react";

export function ImportExportPanel() {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [result, setResult] = useState<{
    successCount: number;
    errorCount: number;
    errors: string[];
  } | null>(null);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));

        const people = lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
          const row: any = {};
          headers.forEach((header, i) => {
            row[header] = values[i];
          });

          return {
            firstName: row["الاسم الأول"] || row["firstName"] || "",
            lastName: row["اسم العائلة"] || row["lastName"] || "",
            gender: row["الجنس"] === "أنثى" || row["gender"] === "FEMALE" ? "FEMALE" : "MALE",
            status: row["الحالة"] || row["status"] || "ALIVE",
            fatherFullName: row["اسم الأب"] || row["fatherFullName"] || "",
            birthDate: row["تاريخ الميلاد"] || row["birthDate"] || "",
            deathDate: row["تاريخ الوفاة"] || row["deathDate"] || "",
            notes: row["ملاحظات"] || row["notes"] || "",
          };
        });

        const response = await fetch("/api/admin/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ people }),
        });

        const data = await response.json();
        setResult(data);
        setTimeout(() => window.location.reload(), 3000);
      } catch (error) {
        alert("خطأ في معالجة الملف");
      } finally {
        setIsImporting(false);
        e.target.value = "";
      }
    };

    reader.readAsText(file, "UTF-8");
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const response = await fetch("/api/admin/export");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `genealogy-${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("خطأ في التصدير");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* الاستيراد */}
        <div className="bg-white rounded-xl p-6 border border-gold-500/20 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-dark-bg flex items-center justify-center">
              <Upload className="w-6 h-6 text-gold-500" />
            </div>
            <h3 className="text-xl font-bold text-dark-bg">استيراد CSV</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            ارفع ملف CSV يحتوي على: الاسم الأول، اسم العائلة، الجنس، الحالة، اسم الأب.
          </p>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".csv"
              onChange={handleImport}
              disabled={isImporting}
              className="hidden"
            />
            <div className="bg-gold-500 text-dark-bg px-6 py-3 rounded-lg font-bold hover:bg-gold-600 flex items-center justify-center gap-2 transition">
              {isImporting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري الاستيراد...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  اختر ملف CSV
                </>
              )}
            </div>
          </label>
        </div>

        {/* التصدير */}
        <div className="bg-white rounded-xl p-6 border border-gold-500/20 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-dark-bg flex items-center justify-center">
              <Download className="w-6 h-6 text-gold-500" />
            </div>
            <h3 className="text-xl font-bold text-dark-bg">تصدير البيانات</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            حمّل جميع البيانات الحالية كملف CSV (متوافق مع Excel).
          </p>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-dark-bg text-white px-6 py-3 rounded-lg font-bold hover:bg-deep-green flex items-center justify-center gap-2 transition w-full"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                جاري التصدير...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                تحميل CSV
              </>
            )}
          </button>
        </div>
      </div>

      {/* نتائج الاستيراد */}
      {result && (
        <div className="bg-white rounded-xl p-6 border border-gold-500/20 shadow-lg">
          <h3 className="text-xl font-bold text-dark-bg mb-4 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-gold-500" />
            نتيجة الاستيراد
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-700 mb-1">تم بنجاح</p>
              <p className="text-2xl font-bold text-green-800">{result.successCount}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-700 mb-1">فشل</p>
              <p className="text-2xl font-bold text-red-800">{result.errorCount}</p>
            </div>
          </div>
          {result.errors && result.errors.length > 0 && (
            <div className="mt-4 bg-red-50 p-4 rounded-lg">
              <p className="text-sm font-bold text-red-700 mb-2">الأخطاء:</p>
              <ul className="text-xs text-red-600 space-y-1">
                {result.errors.map((err, i) => (
                  <li key={i}>• {err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

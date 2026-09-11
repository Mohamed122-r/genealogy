import { ImportExportPanel } from "@/components/admin/ImportExportPanel";
import { FileSpreadsheet } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-dark-bg">إعدادات النظام</h1>

      <div className="bg-white rounded-xl p-6 border border-gold-500/20 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-dark-bg flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6 text-gold-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-dark-bg">إدارة البيانات</h2>
            <p className="text-sm text-gray-600">استيراد وتصدير البيانات</p>
          </div>
        </div>
        <ImportExportPanel />
      </div>
    </div>
  );
}

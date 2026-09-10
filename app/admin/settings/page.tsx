import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImportExportPanel } from "@/components/admin/ImportExportPanel";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-deep-green">إعدادات النظام</h1>
      
      <Card className="bg-white border-gold-500/30 shadow-lg">
        <CardHeader>
          <CardTitle className="text-deep-green flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6" />
            إدارة البيانات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ImportExportPanel />
        </CardContent>
      </Card>
    </div>
  );
}
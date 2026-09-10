import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-dark-bg">إعدادات النظام</h1>

      <Card className="bg-white border-gold-500/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-dark-bg flex items-center gap-2">
            <Settings className="w-6 h-6 text-gold-500" />
            إعدادات عامة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-heritage-bg rounded-lg">
              <span className="font-bold text-dark-bg">الإصدار</span>
              <span className="text-gray-600">1.0.0</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-heritage-bg rounded-lg">
              <span className="font-bold text-dark-bg">إجمالي الأشخاص</span>
              <span className="text-gray-600">5</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-heritage-bg rounded-lg">
              <span className="font-bold text-dark-bg">المطور</span>
              <span className="text-gray-600">Mohamed Abdalwhab</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

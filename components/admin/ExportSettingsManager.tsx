"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Plus, Trash2, Download, CheckCircle2 } from "lucide-react";

export function ExportSettingsManager() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    treeTitle: "شجرة النسب العائلية الكريمة",
    treeSubtitle: "",
    treeDescription: "",
    footerLines: [""],
  });

  useEffect(() => {
    fetch("/api/admin/export-settings")
      .then((res) => res.json())
      .then((data) => {
        setFormData({
          treeTitle: data.treeTitle || "",
          treeSubtitle: data.treeSubtitle || "",
          treeDescription: data.treeDescription || "",
          footerLines: data.footerLines?.length > 0 ? data.footerLines : [""],
        });
      })
      .finally(() => setIsLoading(false));
  }, []);

  function addFooterLine() {
    if (formData.footerLines.length < 5) {
      setFormData({
        ...formData,
        footerLines: [...formData.footerLines, ""],
      });
    }
  }

  function removeFooterLine(index: number) {
    setFormData({
      ...formData,
      footerLines: formData.footerLines.filter((_, i) => i !== index),
    });
  }

  function updateFooterLine(index: number, value: string) {
    const updated = [...formData.footerLines];
    updated[index] = value;
    setFormData({ ...formData, footerLines: updated });
  }

  async function handleSave() {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/export-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          treeTitle: formData.treeTitle,
          treeSubtitle: formData.treeSubtitle,
          treeDescription: formData.treeDescription,
          footerLines: formData.footerLines.filter((l) => l.trim()),
        }),
      });

      if (response.ok) {
        setMessage("✅ تم حفظ الإعدادات بنجاح!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("❌ حدث خطأ أثناء الحفظ");
      }
    } catch (err) {
      setMessage("❌ حدث خطأ في الاتصال");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-12 h-12 animate-spin text-gold-500 mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* الرأس */}
      <div>
        <h1 className="text-3xl font-bold text-dark-bg mb-2">
          إعدادات تصدير الشجرة
        </h1>
        <p className="text-gray-600">
          هذه الإعدادات تظهر في ملفات PDF و PNG عند التصدير
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gold-500/20 space-y-4">
        {/* العنوان الرئيسي */}
        <div>
          <label className="block text-sm font-bold mb-2 text-dark-bg">
            العنوان الرئيسي
          </label>
          <input
            type="text"
            value={formData.treeTitle}
            onChange={(e) =>
              setFormData({ ...formData, treeTitle: e.target.value })
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 bg-white text-dark-bg placeholder:text-gray-400"
            placeholder="شجرة النسب العائلية الكريمة"
          />
          <p className="text-xs text-gray-500 mt-1">
            يظهر في أعلى الصفحة عند التصدير
          </p>
        </div>

        {/* العنوان الفرعي */}
        <div>
          <label className="block text-sm font-bold mb-2 text-dark-bg">
            العنوان الفرعي (اختياري)
          </label>
          <input
            type="text"
            value={formData.treeSubtitle}
            onChange={(e) =>
              setFormData({ ...formData, treeSubtitle: e.target.value })
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 bg-white text-dark-bg placeholder:text-gray-400"
            placeholder="مثال: قبيلة آل فلان"
          />
        </div>

        {/* الوصف التفصيلي */}
        <div>
          <label className="block text-sm font-bold mb-2 text-dark-bg">
            الوصف التفصيلي
          </label>
          <textarea
            value={formData.treeDescription}
            onChange={(e) =>
              setFormData({ ...formData, treeDescription: e.target.value })
            }
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 bg-white text-dark-bg placeholder:text-gray-400"
            placeholder="وصف مختصر للشجرة يظهر تحت العنوان"
          />
          <p className="text-xs text-gray-500 mt-1">
            سطر أو سطران من الوصف التفصيلي
          </p>
        </div>

        {/* التفاصيل السفلية */}
        <div>
          <label className="block text-sm font-bold mb-2 text-dark-bg">
            التفاصيل السفلية (حتى 5 أسطر)
          </label>
          <p className="text-xs text-gray-500 mb-3">
            تظهر في أسفل الصفحة عند التصدير
          </p>
          <div className="space-y-2">
            {formData.footerLines.map((line, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={line}
                  onChange={(e) => updateFooterLine(index, e.target.value)}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 bg-white text-dark-bg placeholder:text-gray-400"
                  placeholder={`السطر ${index + 1}`}
                />
                {formData.footerLines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFooterLine(index)}
                    className="p-3 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            {formData.footerLines.length < 5 && (
              <button
                type="button"
                onClick={addFooterLine}
                className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gold-500/40 rounded-lg text-gold-600 hover:bg-gold-500/5 transition font-bold"
              >
                <Plus className="w-4 h-4" />
                إضافة سطر ({formData.footerLines.length}/5)
              </button>
            )}
          </div>
        </div>

        {/* رسالة النتيجة */}
        {message && (
          <div
            className={`p-4 rounded-lg flex items-center gap-2 ${
              message.startsWith("✅")
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {message.startsWith("✅") && <CheckCircle2 className="w-5 h-5" />}
            <span className="font-bold text-sm">{message}</span>
          </div>
        )}

        {/* زر الحفظ */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gold-500 text-dark-bg px-8 py-3 rounded-lg font-bold hover:bg-gold-600 disabled:opacity-50 flex items-center gap-2 shadow-lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                حفظ الإعدادات
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

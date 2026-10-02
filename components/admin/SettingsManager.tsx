"use client";

import { useState, useEffect } from "react";
import { Save, Settings, Home, Loader2, CheckCircle2 } from "lucide-react";

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  developerName: string;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  introductionText: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
}

export function SettingsManager() {
  const [activeTab, setActiveTab] = useState<"general" | "homepage">("general");
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: "",
    siteDescription: "",
    developerName: "",
    heroTitle: "",
    heroSubtitle: "",
    heroDescription: "",
    introductionText: "",
    contactEmail: "",
    contactPhone: "",
    contactAddress: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings({
          siteName: data.siteName || "",
          siteDescription: data.siteDescription || "",
          developerName: data.developerName || "",
          heroTitle: data.heroTitle || "",
          heroSubtitle: data.heroSubtitle || "",
          heroDescription: data.heroDescription || "",
          introductionText: data.introductionText || "",
          contactEmail: data.contactEmail || "",
          contactPhone: data.contactPhone || "",
          contactAddress: data.contactAddress || "",
        });
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  async function handleSave() {
    setIsSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (response.ok) {
        setMessage("✅ تم الحفظ بنجاح");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("❌ حدث خطأ");
      }
    } catch (error) {
      setMessage("❌ حدث خطأ");
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
      <h1 className="text-3xl font-bold text-dark-bg">إعدادات النظام</h1>

      {/* التبويبات */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab("general")}
          className={`px-6 py-3 font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === "general"
              ? "border-b-4 border-gold-500 text-dark-bg"
              : "text-gray-500 hover:text-dark-bg"
          }`}
        >
          <Settings className="w-5 h-5" />
          الإعدادات العامة
        </button>
        <button
          onClick={() => setActiveTab("homepage")}
          className={`px-6 py-3 font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === "homepage"
              ? "border-b-4 border-gold-500 text-dark-bg"
              : "text-gray-500 hover:text-dark-bg"
          }`}
        >
          <Home className="w-5 h-5" />
          الصفحة الرئيسية
        </button>
      </div>

      {/* تبويب الإعدادات العامة */}
      {activeTab === "general" && (
        <div className="bg-white rounded-xl p-6 border border-gold-500/20 shadow-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2 text-dark-bg">اسم الموقع</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 bg-white text-dark-bg"
                placeholder="شجرة النسب العائلية"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-dark-bg">اسم المطور</label>
              <input
                type="text"
                value={settings.developerName}
                onChange={(e) => setSettings({ ...settings, developerName: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 bg-white text-dark-bg"
                placeholder="Mohamed Abdalwhab"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-dark-bg">وصف الموقع</label>
            <textarea
              rows={2}
              value={settings.siteDescription}
              onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 bg-white text-dark-bg"
              placeholder="منصة رقمية احترافية لتوثيق الأنساب"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2 text-dark-bg">البريد الإلكتروني</label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 bg-white text-dark-bg"
                placeholder="info@example.com"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-dark-bg">الهاتف</label>
              <input
                type="text"
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 bg-white text-dark-bg"
                placeholder="+966 555 555 555"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-dark-bg">العنوان</label>
              <input
                type="text"
                value={settings.contactAddress}
                onChange={(e) => setSettings({ ...settings, contactAddress: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 bg-white text-dark-bg"
                placeholder="المملكة العربية السعودية"
              />
            </div>
          </div>
        </div>
      )}

      {/* تبويب الصفحة الرئيسية */}
      {activeTab === "homepage" && (
        <div className="bg-white rounded-xl p-6 border border-gold-500/20 shadow-lg space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              💡 <strong>ملاحظة:</strong> هذه النصوص تظهر في الصفحة الرئيسية للموقع العام.
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-dark-bg">
              عنوان البطل الرئيسي
            </label>
            <input
              type="text"
              value={settings.heroTitle}
              onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 bg-white text-dark-bg"
              placeholder="شجرة النسب"
            />
            <p className="text-xs text-gray-500 mt-1">
              يظهر كعنوان كبير في قسم الترحيب
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-dark-bg">
              العنوان الفرعي
            </label>
            <input
              type="text"
              value={settings.heroSubtitle}
              onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 bg-white text-dark-bg"
              placeholder="العائلية الكريمة"
            />
            <p className="text-xs text-gray-500 mt-1">
              يظهر تحت العنوان الرئيسي بلون ذهبي
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-dark-bg">
              وصف البطل
            </label>
            <textarea
              rows={3}
              value={settings.heroDescription}
              onChange={(e) => setSettings({ ...settings, heroDescription: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 bg-white text-dark-bg"
              placeholder="وثّق تاريخ عائلتك، احفظ أنسابك، واربط الأجيال ببعضها البعض..."
            />
            <p className="text-xs text-gray-500 mt-1">
              يظهر تحت العنوان الفرعي
            </p>
          </div>
        </div>
      )}

      {/* زر الحفظ ورسالة النتيجة */}
      <div className="bg-white rounded-xl p-6 border border-gold-500/20 shadow-lg">
        {message && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            {message}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gold-500 text-dark-bg px-8 py-3 rounded-lg font-bold hover:bg-gold-600 flex items-center gap-2 transition disabled:opacity-50 shadow-lg"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {isSaving ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </button>
      </div>
    </div>
  );
}

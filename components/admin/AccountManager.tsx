"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  User,
  Mail,
  Lock,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";

interface AccountManagerProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export function AccountManager({ user }: AccountManagerProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [formData, setFormData] = useState({
    currentPassword: "",
    newName: user.name,
    newEmail: user.email,
    newPassword: "",
    confirmPassword: "",
  });

  // التحقق من تطابق كلمتي المرور
  const passwordsMatch =
    !formData.newPassword || formData.newPassword === formData.confirmPassword;

  const passwordLongEnough =
    !formData.newPassword || formData.newPassword.length >= 8;

  const canSubmit =
    formData.currentPassword.length > 0 &&
    passwordsMatch &&
    passwordLongEnough;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setMessageType("");

    if (!passwordsMatch) {
      setMessage("كلمتا المرور الجديدتان غير متطابقتين");
      setMessageType("error");
      setIsLoading(false);
      return;
    }

    if (!passwordLongEnough) {
      setMessage("كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل");
      setMessageType("error");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newName: formData.newName !== user.name ? formData.newName : undefined,
          newEmail: formData.newEmail !== user.email ? formData.newEmail : undefined,
          newPassword: formData.newPassword || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "حدث خطأ");
        setMessageType("error");
        return;
      }

      setMessage("✅ تم تحديث البيانات بنجاح! سيتم تسجيل خروجك خلال 3 ثوان...");
      setMessageType("success");

      setTimeout(() => {
        signOut({ callbackUrl: "/login" });
      }, 3000);
    } catch (err) {
      setMessage("حدث خطأ في الاتصال");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* الرأس */}
      <div>
        <h1 className="text-3xl font-bold text-dark-bg mb-2">إعدادات الحساب</h1>
        <p className="text-gray-600">
          يمكنك تعديل بيانات حسابك وكلمة المرور من هنا
        </p>
      </div>

      {/* معلومات الحساب الحالية */}
      <div className="bg-gradient-to-l from-dark-bg to-deep-green text-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gold-500 flex items-center justify-center text-dark-bg text-2xl font-bold">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
            <p className="text-gold-500 flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4" />
              {user.email}
            </p>
          </div>
          <div className="bg-gold-500/20 border border-gold-500/50 rounded-lg px-3 py-1.5">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-gold-500" />
              <span className="text-gold-500 text-xs font-bold">
                {user.role === "SUPER_ADMIN"
                  ? "مدير النظام"
                  : user.role === "ADMIN"
                  ? "مدير"
                  : user.role === "EDITOR"
                  ? "محرر"
                  : "مشاهد"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* النموذج */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* قسم المعلومات الأساسية */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gold-500/20">
          <h3 className="text-xl font-bold text-dark-bg mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-gold-500" />
            المعلومات الأساسية
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">الاسم</label>
              <input
                type="text"
                value={formData.newName}
                onChange={(e) =>
                  setFormData({ ...formData, newName: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
                placeholder="الاسم الكامل"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={formData.newEmail}
                onChange={(e) =>
                  setFormData({ ...formData, newEmail: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
                placeholder="admin@example.com"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* قسم تغيير كلمة المرور */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gold-500/20">
          <h3 className="text-xl font-bold text-dark-bg mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-gold-500" />
            تغيير كلمة المرور
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">
                كلمة المرور الجديدة
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, newPassword: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 pl-12"
                  placeholder="اتركها فارغة لعدم التغيير"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {formData.newPassword && !passwordLongEnough && (
                <p className="text-xs text-red-500 mt-1">
                  يجب أن تكون 8 أحرف على الأقل
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">
                تأكيد كلمة المرور الجديدة
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
                placeholder="أعد كتابة كلمة المرور الجديدة"
                dir="ltr"
              />
              {formData.confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-500 mt-1">
                  كلمتا المرور غير متطابقتين
                </p>
              )}
            </div>
          </div>
        </div>

        {/* قسم التأكيد بكلمة المرور الحالية */}
        <div className="bg-amber-50 rounded-2xl p-6 shadow-lg border-2 border-amber-300">
          <h3 className="text-xl font-bold text-amber-900 mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            تأكيد الهوية
          </h3>
          <p className="text-sm text-amber-800 mb-4">
            لأسباب أمنية، يجب إدخال كلمة المرور الحالية لتأكيد أي تغييرات
          </p>

          <div>
            <label className="block text-sm font-bold mb-2 text-amber-900">
              كلمة المرور الحالية *
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) =>
                  setFormData({ ...formData, currentPassword: e.target.value })
                }
                required
                className="w-full p-3 border border-amber-300 rounded-lg focus:outline-none focus:border-amber-500 pl-12 bg-white"
                placeholder="أدخل كلمة المرور الحالية"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCurrentPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* رسالة النتيجة */}
        {message && (
          <div
            className={`p-4 rounded-lg flex items-center gap-2 ${
              messageType === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {messageType === "success" ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="font-bold text-sm">{message}</span>
          </div>
        )}

        {/* زر الحفظ */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || !canSubmit}
            className="bg-gold-500 text-dark-bg px-8 py-3 rounded-lg font-bold hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition shadow-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                حفظ التغييرات
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

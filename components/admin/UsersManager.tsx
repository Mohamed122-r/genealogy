"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  Users as UsersIcon,
  Shield,
  Mail,
  User,
  Eye,
  EyeOff,
  Crown,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "VIEWER";
  createdAt: string;
}

interface UsersManagerProps {
  currentUserId: string;
  currentUserRole: string;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "مدير النظام",
  ADMIN: "مدير",
  EDITOR: "محرر",
  VIEWER: "مشاهد",
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-800 border-red-300",
  ADMIN: "bg-gold-500/20 text-gold-800 border-gold-500/40",
  EDITOR: "bg-blue-100 text-blue-800 border-blue-300",
  VIEWER: "bg-gray-100 text-gray-800 border-gray-300",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  SUPER_ADMIN: "كل الصلاحيات + إدارة المستخدمين",
  ADMIN: "كل الصلاحيات عدا إدارة SUPER_ADMIN",
  EDITOR: "إضافة وتعديل الأشخاص والصفحات",
  VIEWER: "قراءة فقط (لا يمكنه التعديل)",
};

export function UsersManager({ currentUserId, currentUserRole }: UsersManagerProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "EDITOR" as User["role"],
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "حدث خطأ في جلب المستخدمين");
        return;
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      setError("حدث خطأ في جلب المستخدمين");
    } finally {
      setIsLoading(false);
    }
  }

  function openCreateModal() {
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "EDITOR",
    });
    setError("");
    setShowPassword(false);
    setIsModalOpen(true);
  }

  function openEditModal(user: User) {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setError("");
    setShowPassword(false);
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const url = editingUser
        ? `/api/admin/users/${editingUser.id}`
        : "/api/admin/users";
      const method = editingUser ? "PUT" : "POST";

      const payload: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "حدث خطأ");
        return;
      }

      setIsModalOpen(false);
      fetchUsers();
      router.refresh();
    } catch (err) {
      setError("حدث خطأ في الاتصال");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${name}"؟`)) return;

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        alert(result.error || "حدث خطأ");
        return;
      }

      fetchUsers();
    } catch (err) {
      alert("حدث خطأ في الاتصال");
    }
  }

  function formatDate(date: string): string {
    return new Date(date).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <div>
      {/* الرأس */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-dark-bg">إدارة المستخدمين</h1>
          <p className="text-sm text-gray-500 mt-1">
            إجمالي: {users.length} مستخدم
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-gold-500 text-dark-bg px-4 py-2 rounded-lg font-bold hover:bg-gold-600 flex items-center gap-2 transition"
        >
          <Plus className="w-5 h-5" />
          إضافة مستخدم
        </button>
      </div>

      {/* رسالة الخطأ */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {/* جدول المستخدمين */}
      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-gold-500 mx-auto" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gold-500/20 shadow-lg overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-dark-bg text-white">
              <tr>
                <th className="p-4 text-sm font-bold">الاسم</th>
                <th className="p-4 text-sm font-bold">البريد الإلكتروني</th>
                <th className="p-4 text-sm font-bold">الدور</th>
                <th className="p-4 text-sm font-bold">تاريخ الإضافة</th>
                <th className="p-4 text-sm font-bold">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    لا يوجد مستخدمون
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 hover:bg-heritage-bg"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-dark-bg flex items-center justify-center text-gold-500 font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-dark-bg">{user.name}</p>
                          {user.id === currentUserId && (
                            <p className="text-xs text-gold-600">(أنت)</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-700" dir="ltr">
                      {user.email}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          ROLE_COLORS[user.role]
                        }`}
                      >
                        {user.role === "SUPER_ADMIN" && (
                          <Crown className="w-3 h-3 inline ml-1" />
                        )}
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="تعديل"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {user.id !== currentUserId && (
                          <button
                            onClick={() => handleDelete(user.id, user.name)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* النموذج */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-dark-bg">
                {editingUser ? "تعديل مستخدم" : "إضافة مستخدم جديد"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* الاسم */}
              <div>
                <label className="block text-sm font-bold mb-2">
                  <User className="w-4 h-4 inline ml-1" />
                  الاسم *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
                  placeholder="محمد أحمد"
                />
              </div>

              {/* البريد */}
              <div>
                <label className="block text-sm font-bold mb-2">
                  <Mail className="w-4 h-4 inline ml-1" />
                  البريد الإلكتروني *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
                  placeholder="user@example.com"
                  dir="ltr"
                />
              </div>

              {/* كلمة المرور */}
              <div>
                <label className="block text-sm font-bold mb-2">
                  كلمة المرور {editingUser ? "(اتركها فارغة لعدم التغيير)" : "*"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 pl-12"
                    placeholder={editingUser ? "اتركها فارغة" : "8 أحرف على الأقل"}
                    dir="ltr"
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* الدور */}
              <div>
                <label className="block text-sm font-bold mb-2">
                  <Shield className="w-4 h-4 inline ml-1" />
                  الصلاحية *
                </label>
                <div className="space-y-2">
                  {(
                    ["SUPER_ADMIN", "ADMIN", "EDITOR", "VIEWER"] as User["role"][]
                  ).map((role) => (
                    <label
                      key={role}
                      className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition ${
                        formData.role === role
                          ? "border-gold-500 bg-gold-500/5"
                          : "border-gray-200 hover:border-gold-500/40"
                      } ${
                        role === "SUPER_ADMIN" &&
                        currentUserRole !== "SUPER_ADMIN"
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role}
                        checked={formData.role === role}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            role: e.target.value as User["role"],
                          })
                        }
                        disabled={
                          role === "SUPER_ADMIN" &&
                          currentUserRole !== "SUPER_ADMIN"
                        }
                        className="mt-1"
                      />
                      <div>
                        <p className="font-bold text-dark-bg text-sm">
                          {ROLE_LABELS[role]}
                        </p>
                        <p className="text-xs text-gray-500">
                          {ROLE_DESCRIPTIONS[role]}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* الأزرار */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg font-bold hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-gold-500 text-dark-bg rounded-lg font-bold hover:bg-gold-600 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      حفظ
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

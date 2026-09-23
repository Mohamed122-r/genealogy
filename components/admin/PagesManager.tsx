"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, Save, Eye, EyeOff, Loader2, FileText, Info } from "lucide-react";
import { RichTextEditor } from "./RichTextEditor";

interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  order: number;
  isPublished: boolean;
  showInNav: boolean;
  iconName: string | null;
  createdAt: string;
  updatedAt: string;
}

export function PagesManager() {
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "<p></p>",
    order: 100,
    isPublished: true,
    showInNav: true,
    iconName: "",
  });

  useEffect(() => {
    fetchPages();
  }, []);

  async function fetchPages() {
    try {
      const response = await fetch("/api/admin/pages");
      const data = await response.json();
      setPages(data);
    } catch (error) {
      setError("حدث خطأ في جلب الصفحات");
    } finally {
      setIsLoading(false);
    }
  }

  function openCreateModal() {
    setEditingPage(null);
    setFormData({
      title: "",
      slug: "",
      content: "<p></p>",
      order: (pages.length + 1) * 10,
      isPublished: true,
      showInNav: true,
      iconName: "",
    });
    setError("");
    setIsModalOpen(true);
  }

  function openEditModal(page: Page) {
    setEditingPage(page);
    setFormData({
      title: page.title,
      slug: page.slug,
      content: page.content,
      order: page.order,
      isPublished: page.isPublished,
      showInNav: page.showInNav,
      iconName: page.iconName || "",
    });
    setError("");
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const url = editingPage
        ? `/api/admin/pages/${editingPage.id}`
        : "/api/admin/pages";
      const method = editingPage ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "حدث خطأ");
        return;
      }

      setIsModalOpen(false);
      fetchPages();
      router.refresh();
    } catch (err) {
      setError("حدث خطأ في الاتصال");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`هل أنت متأكد من حذف صفحة "${title}"؟`)) return;

    try {
      const response = await fetch(`/api/admin/pages/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const result = await response.json();
        alert(result.error || "حدث خطأ");
        return;
      }
      fetchPages();
    } catch (err) {
      alert("حدث خطأ في الاتصال");
    }
  }

  // =====================================================
  // توليد slug بالإنجليزية فقط
  // =====================================================
  function generateSlug(title: string): string {
    // إذا كان العنوان يحتوي على أحرف عربية، لا نولّد slug
    const hasArabic = /[\u0600-\u06FF]/.test(title);
    if (hasArabic) {
      return "";
    }

    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // التحقق من أن الـ slug بالإنجليزية
  function isSlugValid(slug: string): boolean {
    if (!slug) return false;
    // يجب أن يحتوي على أحرف إنجليزية أو أرقام أو شرطات فقط
    return /^[a-z0-9-]+$/.test(slug);
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-dark-bg">إدارة الصفحات</h1>
          <p className="text-sm text-gray-500 mt-1">
            يمكنك تحرير الصفحات الحالية، أو إضافة صفحات جديدة مثل "أعيان القبيلة"
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-gold-500 text-dark-bg px-4 py-2 rounded-lg font-bold hover:bg-gold-600 flex items-center gap-2 transition"
        >
          <Plus className="w-5 h-5" />
          إضافة صفحة جديدة
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-gold-500 mx-auto" />
        </div>
      ) : pages.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gold-500/20 shadow-lg">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-dark-bg mb-2">لا توجد صفحات بعد</h2>
          <p className="text-gray-500 mb-4">ابدأ بإضافة صفحة جديدة</p>
          <button
            onClick={openCreateModal}
            className="bg-gold-500 text-dark-bg px-6 py-2 rounded-lg font-bold hover:bg-gold-600"
          >
            + إضافة صفحة جديدة
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map((page) => (
            <div
              key={page.id}
              className="bg-white rounded-xl p-6 border border-gold-500/20 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-dark-bg mb-1">{page.title}</h3>
                  <p className="text-xs text-gray-500 font-mono" dir="ltr">
                    /{page.slug}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  {page.isPublished ? (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <Eye className="w-3 h-3" /> منشورة
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <EyeOff className="w-3 h-3" /> مخفية
                    </span>
                  )}
                </div>
              </div>

              <div className="text-xs text-gray-400 mb-4">
                الترتيب: {page.order} • {new Date(page.updatedAt).toLocaleDateString("ar-SA")}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(page)}
                  className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg font-bold text-sm hover:bg-blue-100 flex items-center justify-center gap-1"
                >
                  <Pencil className="w-4 h-4" /> تحرير
                </button>
                <button
                  onClick={() => handleDelete(page.id, page.title)}
                  className="bg-red-50 text-red-700 px-3 py-2 rounded-lg font-bold text-sm hover:bg-red-100"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-dark-bg">
                {editingPage ? "تحرير صفحة" : "إضافة صفحة جديدة"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">عنوان الصفحة *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      setFormData({
                        ...formData,
                        title: newTitle,
                        slug: editingPage ? formData.slug : generateSlug(newTitle),
                      });
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
                    placeholder="مثال: أعيان القبيلة وشيوخها"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">
                    الرابط (slug) *
                    <span className="text-xs text-gray-500 mr-2">(بالإنجليزية فقط)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className={`w-full p-3 border rounded-lg focus:outline-none font-mono text-sm ${
                      formData.slug && !isSlugValid(formData.slug)
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-300 focus:border-gold-500"
                    }`}
                    placeholder="notables"
                    dir="ltr"
                  />
                  {formData.slug && !isSlugValid(formData.slug) && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ الرابط يجب أن يكون بالإنجليزية (a-z, 0-9, -)
                    </p>
                  )}
                  {formData.slug && isSlugValid(formData.slug) && (
                    <p className="text-xs text-green-600 mt-1" dir="ltr">
                      ✓ /{formData.slug}
                    </p>
                  )}
                </div>
              </div>

              {/* تنبيه للمستخدم */}
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <strong>ملاحظة:</strong> الرابط (slug) يجب أن يكون بالإنجليزية حتى يعمل مع جميع المتصفحات.
                  مثال: للصفحة "أعيان القبيلة" → الرابط المناسب: <code className="bg-white px-1 rounded font-mono">notables</code>
                </div>
              </div>

              {/* المحرر المرئي */}
              <div>
                <label className="block text-sm font-bold mb-2">المحتوى *</label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(html) => setFormData({ ...formData, content: html })}
                  placeholder="اكتب محتوى الصفحة هنا..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">الترتيب</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">الأصغر يظهر أولاً</p>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">أيقونة (اختياري)</label>
                  <input
                    type="text"
                    value={formData.iconName}
                    onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 font-mono text-sm"
                    placeholder="Users"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">الحالة</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isPublished}
                        onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">منشورة</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showInNav}
                        onChange={(e) => setFormData({ ...formData, showInNav: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">في القائمة</span>
                    </label>
                  </div>
                </div>
              </div>

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
                  disabled={isSaving || !isSlugValid(formData.slug)}
                  className="px-6 py-2 bg-gold-500 text-dark-bg rounded-lg font-bold hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

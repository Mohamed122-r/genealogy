"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, Filter, Sparkles } from "lucide-react";

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  gender: "MALE" | "FEMALE";
  status: "ALIVE" | "DECEASED" | "DISCONNECTED" | "UNKNOWN";
  fatherId: string | null;
  branchId: string | null;
  birthDate: Date | null;
  deathDate: Date | null;
  notes: string | null;
  father: { fullName: string } | null;
  branch: { name: string } | null;
  children: { id: string }[];
}

interface AllPerson {
  id: string;
  fullName: string;
  gender: string;
  fatherId: string | null;
  status: string;
}

interface PeopleManagerProps {
  initialPeople: Person[];
  branches: any[];
  allPeople: AllPerson[];
}

export function PeopleManager({ initialPeople, allPeople }: PeopleManagerProps) {
  const [people] = useState(initialPeople);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterGeneration, setFilterGeneration] = useState<string>("all");
  const [isCustomGeneration, setIsCustomGeneration] = useState(false);
  const [customGenerationNumber, setCustomGenerationNumber] = useState("");
  const router = useRouter();

  // =====================================================
  // حساب الجيل لكل شخص
  // =====================================================
  const peopleWithGeneration = useMemo(() => {
    const genMap = new Map<string, number>();
    function getGeneration(personId: string): number {
      if (genMap.has(personId)) return genMap.get(personId)!;
      const person = allPeople.find((p) => p.id === personId);
      if (!person || !person.fatherId) {
        genMap.set(personId, 0);
        return 0;
      }
      const gen = getGeneration(person.fatherId) + 1;
      genMap.set(personId, gen);
      return gen;
    }
    allPeople.forEach((p) => getGeneration(p.id));
    return allPeople.map((p) => ({ ...p, generation: genMap.get(p.id) || 0 }));
  }, [allPeople]);

  // =====================================================
  // الأجيال المتاحة (مع إضافة الأجيال المستقبلية)
  // =====================================================
  const availableGenerations = useMemo(() => {
    const gens = new Set(peopleWithGeneration.map((p) => p.generation));
    const maxGen = Math.max(0, ...Array.from(gens));
    // نضيف 5 أجيال مستقبلية إضافية حتى يتمكن المستخدم من إضافة أجيال جديدة
    for (let i = 1; i <= 5; i++) {
      gens.add(maxGen + i);
    }
    return Array.from(gens).sort((a, b) => a - b);
  }, [peopleWithGeneration]);

  // الفلتر يعرض فقط الأجيال التي تحتوي على أشخاص
  const existingGenerations = useMemo(() => {
    const gens = new Set(peopleWithGeneration.map((p) => p.generation));
    return Array.from(gens).sort((a, b) => a - b);
  }, [peopleWithGeneration]);

  const filteredPeople = useMemo(() => {
    if (filterGeneration === "all") return people;
    return people.filter((p) => {
      const personGen = peopleWithGeneration.find((pg) => pg.id === p.id)?.generation;
      return personGen === Number(filterGeneration);
    });
  }, [people, filterGeneration, peopleWithGeneration]);

  // =====================================================
  // بيانات النموذج
  // =====================================================
  const [formData, setFormData] = useState({
    firstName: "",
    gender: "MALE",
    status: "ALIVE",
    fatherId: "",
    birthDate: "",
    deathDate: "",
    notes: "",
    generation: "",
  });

  // الجيل الفعلي المستخدم
  const effectiveGeneration = useMemo(() => {
    if (isCustomGeneration && customGenerationNumber) {
      return Number(customGenerationNumber);
    }
    return formData.generation ? Number(formData.generation) : null;
  }, [isCustomGeneration, customGenerationNumber, formData.generation]);

  // =====================================================
  // فلترة الآباء حسب الجيل
  // =====================================================
  const availableFathers = useMemo(() => {
    if (!isModalOpen) return [];

    return peopleWithGeneration
      .filter((p) => {
        if (p.gender !== "MALE") return false;
        if (editingPerson && p.id === editingPerson.id) return false;

        if (editingPerson) {
          // عند التعديل: استبعاد نفسه والأجيال اللاحقة
          const personGen = peopleWithGeneration.find((pg) => pg.id === editingPerson.id)?.generation || 0;
          if (p.generation >= personGen) return false;
        } else if (effectiveGeneration !== null) {
          // عند الإضافة: عرض الآباء من الجيل السابق فقط
          if (p.generation !== effectiveGeneration - 1) return false;
        }

        return true;
      })
      .sort((a, b) => a.generation - b.generation);
  }, [peopleWithGeneration, editingPerson, effectiveGeneration, isModalOpen]);

  // =====================================================
  // الدوال المساعدة
  // =====================================================
  function openCreateModal() {
    setEditingPerson(null);
    setFormData({
      firstName: "",
      gender: "MALE",
      status: "ALIVE",
      fatherId: "",
      birthDate: "",
      deathDate: "",
      notes: "",
      generation: "",
    });
    setIsCustomGeneration(false);
    setCustomGenerationNumber("");
    setError("");
    setIsModalOpen(true);
  }

  function openEditModal(person: Person) {
    const personGen = peopleWithGeneration.find((p) => p.id === person.id)?.generation || 0;
    setEditingPerson(person);
    setFormData({
      firstName: person.firstName,
      gender: person.gender,
      status: person.status,
      fatherId: person.fatherId || "",
      birthDate: person.birthDate ? new Date(person.birthDate).toISOString().split("T")[0] : "",
      deathDate: person.deathDate ? new Date(person.deathDate).toISOString().split("T")[0] : "",
      notes: person.notes || "",
      generation: String(personGen),
    });
    setIsCustomGeneration(false);
    setCustomGenerationNumber("");
    setError("");
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const url = editingPerson ? `/api/admin/people/${editingPerson.id}` : "/api/admin/people";
      const method = editingPerson ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: "",
          gender: formData.gender,
          status: formData.status,
          fatherId: formData.fatherId || null,
          birthDate: formData.birthDate || null,
          deathDate: formData.deathDate || null,
          notes: formData.notes || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "حدث خطأ");
        return;
      }

      setIsModalOpen(false);
      window.location.reload();
    } catch (err) {
      setError("حدث خطأ في الاتصال");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا الشخص؟")) return;
    try {
      const response = await fetch(`/api/admin/people/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const result = await response.json();
        alert(result.error || "حدث خطأ");
        return;
      }
      window.location.reload();
    } catch (err) {
      alert("حدث خطأ في الاتصال");
    }
  }

  function getGenerationName(gen: number): string {
    if (gen === 0) return "الجيل الأول (الجذور)";
    return `الجيل ${gen + 1}`;
  }

  return (
    <div>
      {/* الرأس */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-dark-bg">إدارة الأشخاص</h1>
          <p className="text-sm text-gray-500 mt-1">إجمالي: {people.length} شخص</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-gold-500 text-dark-bg px-4 py-2 rounded-lg font-bold hover:bg-gold-600 flex items-center gap-2 transition"
        >
          <Plus className="w-5 h-5" />
          إضافة شخص
        </button>
      </div>

      {/* فلتر الجيل */}
      <div className="bg-white rounded-xl p-4 border border-gold-500/20 shadow-lg mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-dark-bg font-bold">
            <Filter className="w-5 h-5 text-gold-500" />
            <span>تصفية حسب الجيل:</span>
          </div>
          <button
            onClick={() => setFilterGeneration("all")}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${
              filterGeneration === "all"
                ? "bg-dark-bg text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            الكل ({people.length})
          </button>
          {existingGenerations.map((gen) => {
            const count = peopleWithGeneration.filter(
              (p) => p.generation === gen && people.some((person) => person.id === p.id)
            ).length;
            return (
              <button
                key={gen}
                onClick={() => setFilterGeneration(String(gen))}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${
                  filterGeneration === String(gen)
                    ? "bg-gold-500 text-dark-bg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {getGenerationName(gen)} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* الجدول */}
      <div className="bg-white rounded-xl border border-gold-500/20 shadow-lg overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-dark-bg text-white">
            <tr>
              <th className="p-4 text-sm font-bold">الاسم</th>
              <th className="p-4 text-sm font-bold">الجيل</th>
              <th className="p-4 text-sm font-bold">الحالة</th>
              <th className="p-4 text-sm font-bold">الأب</th>
              <th className="p-4 text-sm font-bold">الأبناء</th>
              <th className="p-4 text-sm font-bold">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredPeople.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-500">
                  لا يوجد أشخاص في هذا الجيل
                </td>
              </tr>
            ) : (
              filteredPeople.map((person) => {
                const gen = peopleWithGeneration.find((p) => p.id === person.id)?.generation ?? 0;
                return (
                  <tr key={person.id} className="border-b border-gray-100 hover:bg-heritage-bg">
                    <td className="p-4 font-bold text-dark-bg">{person.firstName}</td>
                    <td className="p-4">
                      <span className="bg-gold-500/20 text-gold-700 px-3 py-1 rounded-full text-xs font-bold">
                        {getGenerationName(gen)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          person.status === "ALIVE"
                            ? "bg-green-100 text-green-800"
                            : person.status === "DECEASED"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {person.status === "ALIVE" ? "حي" : person.status === "DECEASED" ? "متوفى" : "غير معروف"}
                      </span>
                    </td>
                    <td className="p-4">{person.father?.fullName || "جذر"}</td>
                    <td className="p-4">
                      <span className="bg-gold-500/20 text-gold-700 px-3 py-1 rounded-full text-xs font-bold">
                        {person.children.length}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(person)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="تعديل"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(person.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* نموذج الإضافة/التعديل */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-dark-bg">
                {editingPerson ? "تعديل شخص" : "إضافة شخص جديد"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
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
                <label className="block text-sm font-bold mb-2">الاسم *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
                  placeholder="مثال: محمد"
                />
              </div>

              {/* الجنس والحالة */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">الجنس</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
                  >
                    <option value="MALE">ذكر</option>
                    <option value="FEMALE">أنثى</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">الحالة</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
                  >
                    <option value="ALIVE">حي</option>
                    <option value="DECEASED">متوفى</option>
                    <option value="DISCONNECTED">منقطع</option>
                    <option value="UNKNOWN">غير معروف</option>
                  </select>
                </div>
              </div>

              {/* الجيل */}
              <div>
                <label className="block text-sm font-bold mb-2">الجيل *</label>
                <div className="space-y-2">
                  <select
                    value={isCustomGeneration ? "custom" : formData.generation}
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        setIsCustomGeneration(true);
                        setCustomGenerationNumber("");
                        setFormData({ ...formData, generation: "", fatherId: "" });
                      } else {
                        setIsCustomGeneration(false);
                        setCustomGenerationNumber("");
                        setFormData({ ...formData, generation: e.target.value, fatherId: "" });
                      }
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
                  >
                    <option value="">اختر الجيل أولاً</option>
                    {availableGenerations.map((gen) => {
                      const hasPeople = existingGenerations.includes(gen);
                      return (
                        <option key={gen} value={gen}>
                          {getGenerationName(gen)} {hasPeople ? "" : "(جديد)"}
                        </option>
                      );
                    })}
                    <option value="custom">✨ إضافة جيل جديد (يدوياً)</option>
                  </select>

                  {/* حقل إدخال الجيل اليدوي */}
                  {isCustomGeneration && (
                    <div className="flex items-center gap-2 bg-gold-500/10 border-2 border-gold-500/40 p-3 rounded-lg">
                      <Sparkles className="w-5 h-5 text-gold-600 flex-shrink-0" />
                      <input
                        type="number"
                        min="0"
                        value={customGenerationNumber}
                        onChange={(e) => {
                          setCustomGenerationNumber(e.target.value);
                          setFormData({ ...formData, fatherId: "" });
                        }}
                        placeholder="أدخل رقم الجيل (مثلاً: 8)"
                        className="flex-1 p-2 border border-gold-500/30 rounded-lg focus:outline-none focus:border-gold-500 bg-white"
                      />
                      <span className="text-xs text-gray-600 whitespace-nowrap">
                        {customGenerationNumber
                          ? `= الجيل ${Number(customGenerationNumber) + 1}`
                          : ""}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  💡 اختر "إضافة جيل جديد" لإضافة جيل لم يكن موجوداً من قبل (مثل الجيل الثامن).
                </p>
              </div>

              {/* الأب */}
              <div>
                <label className="block text-sm font-bold mb-2">
                  الأب
                  {effectiveGeneration !== null && (
                    <span className="text-xs text-gray-500 mr-2">
                      (من الجيل {effectiveGeneration})
                    </span>
                  )}
                </label>
                <select
                  value={formData.fatherId}
                  onChange={(e) => setFormData({ ...formData, fatherId: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={effectiveGeneration === 0 || effectiveGeneration === null}
                >
                  {effectiveGeneration === 0 ? (
                    <option value="">— هذا الشخص جذر (لا أب) —</option>
                  ) : effectiveGeneration === null ? (
                    <option value="">— اختر الجيل أولاً —</option>
                  ) : (
                    <>
                      <option value="">بدون أب (جذر الشجرة)</option>
                      {availableFathers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.fullName} — {getGenerationName(p.generation)}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                {effectiveGeneration !== null && effectiveGeneration > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {availableFathers.length} أب متاح في الجيل {effectiveGeneration}
                  </p>
                )}
              </div>

              {/* التواريخ */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">تاريخ الميلاد</label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">تاريخ الوفاة</label>
                  <input
                    type="date"
                    value={formData.deathDate}
                    onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              {/* ملاحظات */}
              <div>
                <label className="block text-sm font-bold mb-2">ملاحظات</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
                  placeholder="ملاحظات إضافية..."
                />
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
                  disabled={isLoading}
                  className="px-6 py-2 bg-gold-500 text-dark-bg rounded-lg font-bold hover:bg-gold-600 disabled:opacity-50"
                >
                  {isLoading ? "جاري الحفظ..." : "حفظ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, Filter, Sparkles, Crown } from "lucide-react";

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
  const [isNewRoot, setIsNewRoot] = useState(false);
  const [sonId, setSonId] = useState("");
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

  // الأجيال الموجودة
  const existingGenerations = useMemo(() => {
    const gens = new Set(peopleWithGeneration.map((p) => p.generation));
    return Array.from(gens).sort((a, b) => a - b);
  }, [peopleWithGeneration]);

  // الأجيال المتاحة للاختيار (مع 5 أجيال مستقبلية)
  const availableGenerations = useMemo(() => {
    const maxGen = Math.max(0, ...Array.from(existingGenerations));
    const gens = new Set(existingGenerations);
    for (let i = 1; i <= 5; i++) gens.add(maxGen + i);
    return Array.from(gens).sort((a, b) => a - b);
  }, [existingGenerations]);

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

  const effectiveGeneration = useMemo(() => {
    return formData.generation ? Number(formData.generation) : null;
  }, [formData.generation]);

  // =====================================================
  // فلترة الآباء حسب الجيل
  // =====================================================
  const availableFathers = useMemo(() => {
    if (!isModalOpen) return [];
    if (isNewRoot) return []; // الجذر الجديد لا يحتاج أب

    return peopleWithGeneration
      .filter((p) => {
        if (p.gender !== "MALE") return false;
        if (editingPerson && p.id === editingPerson.id) return false;

        if (editingPerson) {
          const personGen = peopleWithGeneration.find((pg) => pg.id === editingPerson.id)?.generation || 0;
          if (p.generation >= personGen) return false;
        } else if (effectiveGeneration !== null) {
          if (p.generation !== effectiveGeneration - 1) return false;
        }

        return true;
      })
      .sort((a, b) => a.generation - b.generation);
  }, [peopleWithGeneration, editingPerson, effectiveGeneration, isModalOpen, isNewRoot]);

  // =====================================================
  // الأبناء المتاحون للربط (عند إضافة جذر جديد)
  // نعرض فقط الجذور الحالية (الجيل الأول) التي يمكن ربط الجذر الجديد بها
  // =====================================================
  const availableSons = useMemo(() => {
    if (!isModalOpen || !isNewRoot) return [];

    // عرض الأشخاص من الجيل الأول (الجذور الحالية)
    return peopleWithGeneration
      .filter((p) => {
        if (p.gender !== "MALE") return false;
        // الجذور الحالية فقط (من الجيل الأول)
        if (p.generation !== 0) return false;
        // استبعاد نفسه (عند التعديل)
        if (editingPerson && p.id === editingPerson.id) return false;
        return true;
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"));
  }, [peopleWithGeneration, editingPerson, isModalOpen, isNewRoot]);

  // =====================================================
  // دوال فتح النموذج
  // =====================================================
  function openCreateModal() {
    setEditingPerson(null);
    setIsNewRoot(false);
    setSonId("");
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
    setError("");
    setIsModalOpen(true);
  }

  function openEditModal(person: Person) {
    const personGen = peopleWithGeneration.find((p) => p.id === person.id)?.generation || 0;
    setEditingPerson(person);
    setIsNewRoot(false);
    setSonId("");
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
    setError("");
    setIsModalOpen(true);
  }

  // =====================================================
  // حفظ البيانات
  // =====================================================
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const url = editingPerson ? `/api/admin/people/${editingPerson.id}` : "/api/admin/people";
      const method = editingPerson ? "PUT" : "POST";

      const payload = {
        firstName: formData.firstName,
        lastName: "",
        gender: formData.gender,
        status: formData.status,
        fatherId: isNewRoot ? null : (formData.fatherId || null),
        birthDate: formData.birthDate || null,
        deathDate: formData.deathDate || null,
        notes: formData.notes || null,
        // ⚠️ إشارة خاصة للـ API: ربط الجذر بابن
        linkedSonId: isNewRoot && sonId ? sonId : null,
      };

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

              {/* ⚠️ خيار الجذر الجديد (عند الإضافة فقط) */}
              {!editingPerson && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isNewRoot}
                      onChange={(e) => {
                        setIsNewRoot(e.target.checked);
                        setSonId("");
                        setFormData({ ...formData, generation: "0", fatherId: "" });
                      }}
                      className="w-5 h-5 accent-amber-600"
                    />
                    <div className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-amber-600" />
                      <span className="font-bold text-amber-900">
                        إضافة كجذر جديد (للتصحيح)
                      </span>
                    </div>
                  </label>
                  <p className="text-xs text-amber-700 pr-8">
                    💡 استخدم هذا الخيار عند اكتشاف خطأ في التسلسل، أو عند سقوط جذر من الشجرة.
                    <br />
                    سيتم ربط الجذر الجديد بأحد الجذور الحالية (كأبٍ له).
                  </p>
                </div>
              )}

              {/* ====== حالة الجذر الجديد ====== */}
              {isNewRoot && !editingPerson ? (
                <div className="space-y-4">
                  <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-lg p-4">
                    <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                      <Crown className="w-5 h-5" />
                      ربط الجذر الجديد بابن موجود
                    </h3>

                    <div>
                      <label className="block text-sm font-bold mb-2 text-amber-900">
                        الابن (الجذر الحالي الذي سيصبح ابناً لهذا الجذر الجديد) *
                      </label>
                      <select
                        value={sonId}
                        onChange={(e) => setSonId(e.target.value)}
                        required
                        className="w-full p-3 border border-amber-300 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
                      >
                        <option value="">— اختر الجذر الحالي —</option>
                        {availableSons.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.fullName}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-amber-700 mt-2">
                        {availableSons.length > 0
                          ? `${availableSons.length} جذر متاح. الجذر الجديد سيصبح أباً للشخص المختار.`
                          : "⚠️ لا يوجد جذور حالية. أضف جذراً عادياً أولاً."}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* ====== الحالة العادية: مع أب ====== */
                <>
                  {/* الجيل */}
                  <div>
                    <label className="block text-sm font-bold mb-2">الجيل *</label>
                    <div className="space-y-2">
                      <select
                        value={formData.generation}
                        onChange={(e) => {
                          setFormData({ ...formData, generation: e.target.value, fatherId: "" });
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
                      </select>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      💡 إذا لم تجد الجيل المطلوب، اضغط على "إضافة كجذر جديد" أعلاه.
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
                      disabled={effectiveGeneration === null}
                    >
                      {effectiveGeneration === null ? (
                        <option value="">— اختر الجيل أولاً —</option>
                      ) : (
                        <>
                          <option value="">— بدون أب (سيتم إنشاؤه كجذر منفصل) —</option>
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
                        {availableFathers.length} أب متاح
                      </p>
                    )}
                    {effectiveGeneration === 0 && (
                      <p className="text-xs text-amber-600 mt-1">
                        ⚠️ إذا اخترت الجيل الأول، لن يتمكن من الارتباط بشجرة (سيصبح جذراً منفصلاً).
                      </p>
                    )}
                  </div>
                </>
              )}

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
                  disabled={isLoading || (isNewRoot && !sonId)}
                  className="px-6 py-2 bg-gold-500 text-dark-bg rounded-lg font-bold hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed"
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

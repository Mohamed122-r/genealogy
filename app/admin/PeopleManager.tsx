"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X } from "lucide-react";

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

interface Branch {
  id: string;
  name: string;
  color: string;
}

interface PeopleManagerProps {
  initialPeople: Person[];
  branches: Branch[];
  allPeople: { id: string; fullName: string; gender: string; fatherId: string | null; status: string }[];
}

export function PeopleManager({ initialPeople, branches, allPeople }: PeopleManagerProps) {
  const [people, setPeople] = useState(initialPeople);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "MALE",
    status: "ALIVE",
    fatherId: "",
    branchId: "",
    birthDate: "",
    deathDate: "",
    notes: "",
  });

  function openCreateModal() {
    setEditingPerson(null);
    setFormData({
      firstName: "",
      lastName: "",
      gender: "MALE",
      status: "ALIVE",
      fatherId: "",
      branchId: "",
      birthDate: "",
      deathDate: "",
      notes: "",
    });
    setError("");
    setIsModalOpen(true);
  }

  function openEditModal(person: Person) {
    setEditingPerson(person);
    setFormData({
      firstName: person.firstName,
      lastName: person.lastName,
      gender: person.gender,
      status: person.status,
      fatherId: person.fatherId || "",
      branchId: person.branchId || "",
      birthDate: person.birthDate ? new Date(person.birthDate).toISOString().split("T")[0] : "",
      deathDate: person.deathDate ? new Date(person.deathDate).toISOString().split("T")[0] : "",
      notes: person.notes || "",
    });
    setError("");
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const url = editingPerson
        ? `/api/admin/people/${editingPerson.id}`
        : "/api/admin/people";
      const method = editingPerson ? "PUT" : "POST";

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
      router.refresh();
      // إعادة تحميل البيانات
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
      const response = await fetch(`/api/admin/people/${id}`, {
        method: "DELETE",
      });

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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-dark-bg">إدارة الأشخاص</h1>
        <button
          onClick={openCreateModal}
          className="bg-gold-500 text-dark-bg px-4 py-2 rounded-lg font-bold hover:bg-gold-600 flex items-center gap-2 transition"
        >
          <Plus className="w-5 h-5" />
          إضافة شخص
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gold-500/20 shadow-lg overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-dark-bg text-white">
            <tr>
              <th className="p-4 text-sm font-bold">الاسم الكامل</th>
              <th className="p-4 text-sm font-bold">الحالة</th>
              <th className="p-4 text-sm font-bold">الفرع</th>
              <th className="p-4 text-sm font-bold">الأب</th>
              <th className="p-4 text-sm font-bold">الأبناء</th>
              <th className="p-4 text-sm font-bold">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {people.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-500">
                  لا يوجد أشخاص
                </td>
              </tr>
            ) : (
              people.map((person) => (
                <tr key={person.id} className="border-b border-gray-100 hover:bg-heritage-bg">
                  <td className="p-4 font-bold text-dark-bg">{person.fullName}</td>
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
                  <td className="p-4">{person.branch?.name || "-"}</td>
                  <td className="p-4">{person.father?.fullName || "جذر"}</td>
                  <td className="p-4">{person.children.length}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(person)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(person.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">الاسم الأول</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">اسم العائلة</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">الأب</label>
                  <select
                    value={formData.fatherId}
                    onChange={(e) => setFormData({ ...formData, fatherId: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
                  >
                    <option value="">بدون أب (جذر)</option>
                    {allPeople
                      .filter((p) => p.id !== editingPerson?.id && p.gender === "MALE")
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.fullName}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">الفرع</label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
                  >
                    <option value="">بدون فرع</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

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

              <div>
                <label className="block text-sm font-bold mb-2">ملاحظات</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
                />
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

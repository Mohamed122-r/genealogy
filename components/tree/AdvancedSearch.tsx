"use client";

import { useState, useMemo } from "react";
import { Search, X, Filter, User, Users, Crown, ChevronLeft } from "lucide-react";
import { LayoutNode } from "@/types/tree";

interface AdvancedSearchProps {
  nodes: LayoutNode[];
  onSelectPerson: (id: string) => void;
  onHighlight: (ids: Set<string>) => void;
}

type SearchMode = "name" | "nameFather" | "generation";

export function AdvancedSearch({ nodes, onSelectPerson, onHighlight }: AdvancedSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<SearchMode>("name");
  const [nameQuery, setNameQuery] = useState("");
  const [fatherQuery, setFatherQuery] = useState("");
  const [selectedGeneration, setSelectedGeneration] = useState<string>("");
  const [results, setResults] = useState<LayoutNode[]>([]);

  // الأجيال المتاحة
  const availableGenerations = useMemo(() => {
    const gens = new Set(nodes.map((n) => n.depth));
    return Array.from(gens).sort((a, b) => a - b);
  }, [nodes]);

  // الحصول على اسم الأب
  const getFatherName = (node: LayoutNode): string => {
    if (!node.fatherId) return "—";
    const father = nodes.find((n) => n.id === node.fatherId);
    return father?.fullName || "—";
  };

  // =====================================================
  // تنفيذ البحث
  // =====================================================
  function performSearch() {
    let found: LayoutNode[] = [];

    if (mode === "name") {
      if (!nameQuery.trim()) {
        found = [];
      } else {
        const query = nameQuery.trim().toLowerCase();
        found = nodes.filter((n) => n.fullName.toLowerCase().includes(query));
      }
    } else if (mode === "nameFather") {
      if (!nameQuery.trim() && !fatherQuery.trim()) {
        found = [];
      } else {
        found = nodes.filter((n) => {
          const matchesName = !nameQuery.trim() ||
            n.fullName.toLowerCase().includes(nameQuery.trim().toLowerCase());
          const fatherName = getFatherName(n);
          const matchesFather = !fatherQuery.trim() ||
            fatherName.toLowerCase().includes(fatherQuery.trim().toLowerCase());
          return matchesName && matchesFather;
        });
      }
    } else if (mode === "generation") {
      if (selectedGeneration === "") {
        found = [];
      } else {
        const gen = Number(selectedGeneration);
        found = nodes.filter((n) => n.depth === gen);
      }
    }

    // ترتيب النتائج حسب الجيل
    found.sort((a, b) => a.depth - b.depth);

    setResults(found);

    // إضاءة النتائج في الشجرة
    const ids = new Set(found.map((n) => n.id));
    onHighlight(ids);

    // إذا كانت النتيجة شخصاً واحداً، تمركز عليه
    if (found.length === 1) {
      onSelectPerson(found[0].id);
    }
  }

  // =====================================================
  // إعادة ضبط البحث
  // =====================================================
  function resetSearch() {
    setNameQuery("");
    setFatherQuery("");
    setSelectedGeneration("");
    setResults([]);
    onHighlight(new Set());
  }

  // =====================================================
  // الحصول على اسم الجيل
  // =====================================================
  function getGenerationName(gen: number): string {
    if (gen === 0) return "الجيل الأول (الجذور)";
    return `الجيل ${gen + 1}`;
  }

  // =====================================================
  // الحصول على اسم الحالة
  // =====================================================
  function getStatusLabel(status: string): string {
    switch (status) {
      case "ALIVE": return "حي";
      case "DECEASED": return "متوفى";
      case "DISCONNECTED": return "منقطع";
      default: return "غير معروف";
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case "ALIVE": return "bg-green-100 text-green-800";
      case "DECEASED": return "bg-amber-100 text-amber-800";
      case "DISCONNECTED": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-600";
    }
  }

  return (
    <>
      {/* زر فتح البحث */}
      <button
        onClick={() => setIsOpen(true)}
        className="bg-gold-500 text-dark-bg px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gold-600 transition shadow-lg"
        title="البحث المتقدم"
      >
        <Filter className="w-4 h-4" />
        بحث متقدم
      </button>

      {/* نافذة البحث */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mt-8 mb-8">
            {/* الرأس */}
            <div className="bg-dark-bg text-white p-4 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Search className="w-5 h-5 text-gold-500" />
                البحث المتقدم في المشجرة
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* اختيار نمط البحث */}
            <div className="p-6 border-b border-gray-200">
              <label className="block text-sm font-bold mb-3 text-dark-bg">
                نمط البحث
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => { setMode("name"); resetSearch(); }}
                  className={`p-4 rounded-xl border-2 transition text-right ${
                    mode === "name"
                      ? "border-gold-500 bg-gold-500/10"
                      : "border-gray-200 hover:border-gold-500/40"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <User className={`w-5 h-5 ${mode === "name" ? "text-gold-600" : "text-gray-400"}`} />
                    <span className="font-bold text-dark-bg">بالاسم</span>
                  </div>
                  <p className="text-xs text-gray-500">ابحث عن شخص باسمه</p>
                </button>

                <button
                  type="button"
                  onClick={() => { setMode("nameFather"); resetSearch(); }}
                  className={`p-4 rounded-xl border-2 transition text-right ${
                    mode === "nameFather"
                      ? "border-gold-500 bg-gold-500/10"
                      : "border-gray-200 hover:border-gold-500/40"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Users className={`w-5 h-5 ${mode === "nameFather" ? "text-gold-600" : "text-gray-400"}`} />
                    <span className="font-bold text-dark-bg">بالاسم والأب</span>
                  </div>
                  <p className="text-xs text-gray-500">ابحث بالاسم مع اسم الأب</p>
                </button>

                <button
                  type="button"
                  onClick={() => { setMode("generation"); resetSearch(); }}
                  className={`p-4 rounded-xl border-2 transition text-right ${
                    mode === "generation"
                      ? "border-gold-500 bg-gold-500/10"
                      : "border-gray-200 hover:border-gold-500/40"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className={`w-5 h-5 ${mode === "generation" ? "text-gold-600" : "text-gray-400"}`} />
                    <span className="font-bold text-dark-bg">بالجيل</span>
                  </div>
                  <p className="text-xs text-gray-500">اعرض أفراد جيل معين</p>
                </button>
              </div>
            </div>

            {/* حقول البحث حسب النمط */}
            <div className="p-6 border-b border-gray-200 space-y-4">
              {mode === "name" && (
                <div>
                  <label className="block text-sm font-bold mb-2">الاسم</label>
                  <input
                    type="text"
                    value={nameQuery}
                    onChange={(e) => setNameQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && performSearch()}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
                    placeholder="اكتب الاسم..."
                  />
                </div>
              )}

              {mode === "nameFather" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">الاسم</label>
                    <input
                      type="text"
                      value={nameQuery}
                      onChange={(e) => setNameQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && performSearch()}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
                      placeholder="اكتب الاسم..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">اسم الأب</label>
                    <input
                      type="text"
                      value={fatherQuery}
                      onChange={(e) => setFatherQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && performSearch()}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
                      placeholder="اكتب اسم الأب..."
                    />
                  </div>
                </div>
              )}

              {mode === "generation" && (
                <div>
                  <label className="block text-sm font-bold mb-2">الجيل</label>
                  <select
                    value={selectedGeneration}
                    onChange={(e) => setSelectedGeneration(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
                  >
                    <option value="">— اختر الجيل —</option>
                    {availableGenerations.map((gen) => {
                      const count = nodes.filter((n) => n.depth === gen).length;
                      return (
                        <option key={gen} value={gen}>
                          {getGenerationName(gen)} ({count} شخص)
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* أزرار البحث */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={performSearch}
                  className="flex-1 bg-gold-500 text-dark-bg px-6 py-3 rounded-lg font-bold hover:bg-gold-600 transition flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  ابحث
                </button>
                <button
                  type="button"
                  onClick={resetSearch}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-bold hover:bg-gray-50 transition"
                >
                  مسح
                </button>
              </div>
            </div>

            {/* النتائج */}
            {results.length > 0 && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-dark-bg">
                    نتائج البحث ({results.length})
                  </h3>
                  <span className="text-xs text-gray-500">
                    اضغط على أي اسم للانتقال إليه
                  </span>
                </div>

                <div className="max-h-[400px] overflow-y-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-right">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="p-3 text-xs font-bold text-dark-bg">#</th>
                        <th className="p-3 text-xs font-bold text-dark-bg">الاسم</th>
                        <th className="p-3 text-xs font-bold text-dark-bg">الأب</th>
                        <th className="p-3 text-xs font-bold text-dark-bg">الجيل</th>
                        <th className="p-3 text-xs font-bold text-dark-bg">الحالة</th>
                        <th className="p-3 text-xs font-bold text-dark-bg"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((person, index) => (
                        <tr
                          key={person.id}
                          className="border-b border-gray-100 hover:bg-gold-500/5 cursor-pointer transition"
                          onClick={() => {
                            onSelectPerson(person.id);
                            setIsOpen(false);
                          }}
                        >
                          <td className="p-3 text-xs text-gray-500">{index + 1}</td>
                          <td className="p-3 font-bold text-dark-bg text-sm">
                            {person.fullName}
                          </td>
                          <td className="p-3 text-xs text-gray-600">
                            {getFatherName(person)}
                          </td>
                          <td className="p-3">
                            <span className="bg-gold-500/20 text-gold-700 px-2 py-0.5 rounded-full text-xs font-bold">
                              {getGenerationName(person.depth)}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusColor(person.status)}`}>
                              {getStatusLabel(person.status)}
                            </span>
                          </td>
                          <td className="p-3 text-gold-600">
                            <ChevronLeft className="w-4 h-4" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {results.length === 0 && mode && (
              <div className="p-6 text-center">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  استخدم الحقول أعلاه للبحث
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

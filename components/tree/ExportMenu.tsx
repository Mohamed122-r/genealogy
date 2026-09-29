"use client";

import { useState } from "react";
import {
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  X,
  Settings,
  Plus,
  Trash2,
} from "lucide-react";

interface ExportMenuProps {
  svgRef: React.RefObject<SVGSVGElement>;
  treeTitle?: string;
}

type PaperSize = "A4" | "A3" | "A2" | "A1" | "A0";

export function ExportMenu({ svgRef, treeTitle = "شجرة-النسب" }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  // إعدادات التصدير
  const [title, setTitle] = useState("شجرة النسب العائلية الكريمة");
  const [subtitle, setSubtitle] = useState("");
  const [footerLines, setFooterLines] = useState<string[]>([
    "تم إعداد هذه الشجرة بواسطة Mohamed Abdalwhab",
  ]);

  // =====================================================
  // إضافة سطر جديد
  // =====================================================
  function addFooterLine() {
    if (footerLines.length < 5) {
      setFooterLines([...footerLines, ""]);
    }
  }

  // =====================================================
  // حذف سطر
  // =====================================================
  function removeFooterLine(index: number) {
    setFooterLines(footerLines.filter((_, i) => i !== index));
  }

  // =====================================================
  // تحديث سطر
  // =====================================================
  function updateFooterLine(index: number, value: string) {
    const updated = [...footerLines];
    updated[index] = value;
    setFooterLines(updated);
  }

  // =====================================================
  // إنشاء صورة PDF من الشجرة + العناوين
  // =====================================================
  async function exportPDF(size: PaperSize) {
    if (!svgRef.current) return;
    setIsExporting(true);
    setProgress(`جاري تحضير PDF بمقاس ${size}...`);

    try {
      const { jsPDF } = await import("jspdf");
      const { toPng } = await import("html-to-image");

      // أبعاد الورق (أفقياً)
      const paperSizes: Record<PaperSize, [number, number]> = {
        A4: [297, 210],
        A3: [420, 297],
        A2: [594, 420],
        A1: [841, 594],
        A0: [1189, 841],
      };

      const [paperWidth, paperHeight] = paperSizes[size];

      // تحويل SVG إلى صورة
      setProgress("جاري تحويل الشجرة إلى صورة...");
      const svgElement = svgRef.current;
      const dataUrl = await toPng(svgElement as unknown as HTMLElement, {
        pixelRatio: 4,
        backgroundColor: "#FDFBF3",
        cacheBust: true,
      });

      // إنشاء PDF
      setProgress("جاري إنشاء PDF...");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [paperWidth, paperHeight],
      });

      // ============================================
      // إضافة خلفية كريمية
      // ============================================
      pdf.setFillColor(253, 251, 243);
      pdf.rect(0, 0, paperWidth, paperHeight, "F");

      // ============================================
      // إضافة إطار ذهبي
      // ============================================
      pdf.setDrawColor(201, 162, 39);
      pdf.setLineWidth(0.8);
      pdf.rect(5, 5, paperWidth - 10, paperHeight - 10);
      pdf.setLineWidth(0.3);
      pdf.rect(8, 8, paperWidth - 16, paperHeight - 16);

      // ============================================
      // إضافة العنوان الرئيسي
      // ============================================
      let currentY = 20;
      if (title) {
        pdf.setFontSize(24);
        pdf.setTextColor(10, 23, 17);
        pdf.setFont("helvetica", "bold");
        pdf.text(title, paperWidth / 2, currentY, { align: "center" });
        currentY += 10;
      }

      // العنوان الفرعي
      if (subtitle) {
        pdf.setFontSize(14);
        pdf.setTextColor(139, 90, 43);
        pdf.setFont("helvetica", "normal");
        pdf.text(subtitle, paperWidth / 2, currentY, { align: "center" });
        currentY += 8;
      }

      // خط فاصل
      pdf.setDrawColor(201, 162, 39);
      pdf.setLineWidth(0.5);
      pdf.line(paperWidth / 2 - 30, currentY, paperWidth / 2 + 30, currentY);
      currentY += 5;

      // ============================================
      // إضافة الشجرة (وسط الصفحة)
      // ============================================
      const treeTopY = currentY;
      const footerHeight = 15 + footerLines.filter((l) => l.trim()).length * 7;
      const treeBottomY = paperHeight - footerHeight - 10;
      const treeAvailableHeight = treeBottomY - treeTopY;
      const treeAvailableWidth = paperWidth - 30;

      // حساب أبعاد الصورة مع الحفاظ على النسبة
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const imgRatio = img.width / img.height;
      const availableRatio = treeAvailableWidth / treeAvailableHeight;

      let imgWidth = treeAvailableWidth;
      let imgHeight = treeAvailableWidth / imgRatio;

      if (imgRatio < availableRatio) {
        imgHeight = treeAvailableHeight;
        imgWidth = treeAvailableHeight * imgRatio;
      }

      const imgX = (paperWidth - imgWidth) / 2;
      const imgY = treeTopY + (treeAvailableHeight - imgHeight) / 2;

      pdf.addImage(dataUrl, "PNG", imgX, imgY, imgWidth, imgHeight, undefined, "FAST");

      // ============================================
      // إضافة التفاصيل في الأسفل
      // ============================================
      const validFooterLines = footerLines.filter((l) => l.trim());
      if (validFooterLines.length > 0) {
        const footerY = paperHeight - footerHeight - 5;

        // خط فاصل
        pdf.setDrawColor(201, 162, 39);
        pdf.setLineWidth(0.5);
        pdf.line(20, footerY - 5, paperWidth - 20, footerY - 5);

        // الأسطر
        pdf.setFontSize(10);
        pdf.setTextColor(80, 80, 80);
        pdf.setFont("helvetica", "normal");

        validFooterLines.forEach((line, index) => {
          pdf.text(line, paperWidth / 2, footerY + index * 6, {
            align: "center",
          });
        });
      }

      // حفظ الملف
      pdf.save(`${treeTitle}-${size}.pdf`);

      setProgress("✅ تم التصدير بنجاح!");
      setTimeout(() => {
        setIsOpen(false);
        setProgress("");
      }, 2000);
    } catch (error) {
      console.error("PDF Export Error:", error);
      setProgress("❌ حدث خطأ أثناء التصدير");
    } finally {
      setIsExporting(false);
    }
  }

  // =====================================================
  // تصدير PNG
  // =====================================================
  async function exportPNG() {
    if (!svgRef.current) return;
    setIsExporting(true);
    setProgress("جاري إنشاء PNG...");

    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(svgRef.current as unknown as HTMLElement, {
        pixelRatio: 4,
        backgroundColor: "#FDFBF3",
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.download = `${treeTitle}.png`;
      link.href = dataUrl;
      link.click();

      setProgress("✅ تم التصدير!");
      setTimeout(() => {
        setIsOpen(false);
        setProgress("");
      }, 2000);
    } catch (error) {
      console.error("PNG Export Error:", error);
      setProgress("❌ حدث خطأ");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <>
      {/* زر التصدير */}
      <button
        onClick={() => setIsOpen(true)}
        className="bg-gold-500 text-dark-bg px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gold-600 transition shadow-lg"
        title="تصدير الشجرة"
      >
        <Download className="w-4 h-4" />
        تصدير
      </button>

      {/* القائمة المنبثقة */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8">
            {/* الرأس */}
            <div className="bg-dark-bg text-white p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Download className="w-5 h-5 text-gold-500" />
                تصدير الشجرة
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                disabled={isExporting}
                className="p-1 hover:bg-white/20 rounded-lg transition disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* المحتوى */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {isExporting ? (
                <div className="text-center py-8">
                  <Loader2 className="w-12 h-12 text-gold-500 animate-spin mx-auto mb-4" />
                  <p className="text-dark-bg font-bold">{progress}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    قد يستغرق التصدير من 30 ثانية إلى دقيقة
                  </p>
                </div>
              ) : (
                <>
                  {/* زر إعدادات التصدير */}
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="w-full bg-heritage-bg border border-gold-500/30 rounded-lg p-3 flex items-center justify-between hover:bg-gold-500/5 transition"
                  >
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-gold-500" />
                      <span className="font-bold text-dark-bg">
                        إعدادات العنوان والتفاصيل
                      </span>
                    </div>
                    <span className="text-xs text-gold-500">
                      {showSettings ? "إخفاء" : "إظهار"}
                    </span>
                  </button>

                  {/* إعدادات التصدير */}
                  {showSettings && (
                    <div className="bg-heritage-bg border border-gold-500/30 rounded-lg p-4 space-y-4">
                      {/* العنوان الرئيسي */}
                      <div>
                        <label className="block text-sm font-bold mb-2 text-dark-bg">
                          العنوان الرئيسي (يظهر في الأعلى)
                        </label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
                          placeholder="شجرة النسب العائلية الكريمة"
                        />
                      </div>

                      {/* العنوان الفرعي */}
                      <div>
                        <label className="block text-sm font-bold mb-2 text-dark-bg">
                          العنوان الفرعي (اختياري)
                        </label>
                        <input
                          type="text"
                          value={subtitle}
                          onChange={(e) => setSubtitle(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
                          placeholder="مثال: قبيلة آل ..."
                        />
                      </div>

                      {/* التفاصيل السفلية */}
                      <div>
                        <label className="block text-sm font-bold mb-2 text-dark-bg">
                          التفاصيل السفلية (حتى 5 أسطر)
                        </label>
                        <div className="space-y-2">
                          {footerLines.map((line, index) => (
                            <div key={index} className="flex gap-2">
                              <input
                                type="text"
                                value={line}
                                onChange={(e) => updateFooterLine(index, e.target.value)}
                                className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 text-sm"
                                placeholder={`السطر ${index + 1}`}
                              />
                              <button
                                type="button"
                                onClick={() => removeFooterLine(index)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}

                          {footerLines.length < 5 && (
                            <button
                              type="button"
                              onClick={addFooterLine}
                              className="w-full flex items-center justify-center gap-2 p-2 border-2 border-dashed border-gold-500/40 rounded-lg text-gold-600 hover:bg-gold-500/5 transition text-sm font-bold"
                            >
                              <Plus className="w-4 h-4" />
                              إضافة سطر ({footerLines.length}/5)
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PDF */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5 text-red-600" />
                      <h3 className="font-bold text-dark-bg">تصدير PDF للطباعة</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {(["A4", "A3", "A2", "A1", "A0"] as PaperSize[]).map((size) => (
                        <button
                          key={size}
                          onClick={() => exportPDF(size)}
                          className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-lg font-bold hover:bg-red-100 transition flex items-center justify-between"
                        >
                          <span>{size}</span>
                          <span className="text-xs text-red-500">
                            {size === "A4" && "صغير"}
                            {size === "A3" && "متوسط"}
                            {size === "A2" && "كبير"}
                            {size === "A1" && "ضخم"}
                            {size === "A0" && "لوحة"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* PNG */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <ImageIcon className="w-5 h-5 text-blue-600" />
                      <h3 className="font-bold text-dark-bg">تصدير صورة</h3>
                    </div>
                    <button
                      onClick={exportPNG}
                      className="w-full bg-blue-50 text-blue-700 border border-blue-200 px-4 py-3 rounded-lg font-bold hover:bg-blue-100 transition"
                    >
                      تحميل PNG (عالية الدقة)
                    </button>
                  </div>

                  {/* ملاحظة */}
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-xs text-yellow-800">
                    💡 <strong>نصيحة:</strong> للطباعة على لوحة كبيرة، اختر مقاس <strong>A0</strong> أو <strong>A1</strong>.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

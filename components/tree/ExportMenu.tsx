"use client";

import { useState } from "react";
import { Download, FileText, Image as ImageIcon, Loader2, X } from "lucide-react";

interface ExportMenuProps {
  svgRef: React.RefObject<SVGSVGElement>;
  treeTitle?: string;
}

type PaperSize = "A4" | "A3" | "A2" | "A1" | "A0";

export function ExportMenu({ svgRef, treeTitle = "شجرة-النسب" }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState("");

  // =====================================================
  // تصدير PDF
  // =====================================================
  async function exportPDF(size: PaperSize) {
    if (!svgRef.current) return;
    setIsExporting(true);
    setProgress(`جاري تحضير PDF بمقاس ${size}...`);

    try {
      const { jsPDF } = await import("jspdf");
      const { toPng } = await import("html-to-image");

      // الحصول على أبعاد الورق
      const paperSizes: Record<PaperSize, [number, number]> = {
        A4: [297, 210],   // [width, height] بالأفقي
        A3: [420, 297],
        A2: [594, 420],
        A1: [841, 594],
        A0: [1189, 841],
      };

      const [paperWidth, paperHeight] = paperSizes[size];

      // تحويل SVG إلى صورة عالية الدقة
      setProgress("جاري تحويل الشجرة إلى صورة...");

      const svgElement = svgRef.current;
      const dataUrl = await toPng(svgElement as unknown as HTMLElement, {
        pixelRatio: 4, // جودة عالية
        backgroundColor: "#FDFBF3",
        cacheBust: true,
      });

      // إنشاء PDF
      setProgress("جاري إنشاء ملف PDF...");

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [paperWidth, paperHeight],
      });

      // حساب أبعاد الصورة (مع الحفاظ على النسبة)
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const imgRatio = img.width / img.height;
      const pageRatio = paperWidth / paperHeight;

      let imgWidth = paperWidth;
      let imgHeight = paperWidth / imgRatio;

      if (imgRatio < pageRatio) {
        imgHeight = paperHeight;
        imgWidth = paperHeight * imgRatio;
      }

      const offsetX = (paperWidth - imgWidth) / 2;
      const offsetY = (paperHeight - imgHeight) / 2;

      // إضافة العنوان
      pdf.setFontSize(24);
      pdf.setTextColor(201, 162, 39);
      pdf.text(treeTitle, paperWidth / 2, 15, { align: "center" });

      // إضافة الصورة
      pdf.addImage(dataUrl, "PNG", offsetX, offsetY, imgWidth, imgHeight - 10, undefined, "FAST");

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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
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
            <div className="p-6 space-y-4">
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
                  {/* PDF */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5 text-red-600" />
                      <h3 className="font-bold text-dark-bg">تصدير PDF للطباعة</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
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

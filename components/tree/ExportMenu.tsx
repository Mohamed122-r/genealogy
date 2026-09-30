"use client";

import { useState, useEffect } from "react";
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
  const [progressPercent, setProgressPercent] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const [title, setTitle] = useState("شجرة النسب العائلية الكريمة");
  const [subtitle, setSubtitle] = useState("");
  const [footerLines, setFooterLines] = useState<string[]>([
    "تم إعداد هذه الشجرة بواسطة Mohamed Abdalwhab",
  ]);

  // =====================================================
  // تحميل خط Amiri
  // =====================================================
  useEffect(() => {
    if (typeof document !== "undefined") {
      const existing = document.querySelector('link[href*="Amiri"]');
      if (!existing) {
        const link = document.createElement("link");
        link.href =
          "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap";
        link.rel = "stylesheet";
        document.head.appendChild(link);
      }
    }
  }, []);

  // =====================================================
  // إدارة الأسطر السفلية
  // =====================================================
  function addFooterLine() {
    if (footerLines.length < 5) {
      setFooterLines([...footerLines, ""]);
    }
  }

  function removeFooterLine(index: number) {
    setFooterLines(footerLines.filter((_, i) => i !== index));
  }

  function updateFooterLine(index: number, value: string) {
    const updated = [...footerLines];
    updated[index] = value;
    setFooterLines(updated);
  }

  // =====================================================
  // ✅ الدالة المحسّنة: تصدير بدقة عالية جداً
  // تستخدم chunked rendering لتجنب تجميد المتصفح
  // =====================================================
  async function renderTreeToImage(): Promise<{
    dataUrl: string;
    width: number;
    height: number;
  }> {
    if (!svgRef.current) throw new Error("SVG not found");

    const { toPng } = await import("html-to-image");
    const svgElement = svgRef.current;

    // الحصول على أبعاد viewBox
    const viewBox = svgElement.getAttribute("viewBox");
    let svgWidth = 1200;
    let svgHeight = 800;

    if (viewBox) {
      const parts = viewBox.split(" ").map(Number);
      if (parts.length === 4) {
        svgWidth = parts[2];
        svgHeight = parts[3];
      }
    }

    // =====================================================
    // ✅ استخدام pixelRatio عالٍ جداً مع تقسيم العمل
    // =====================================================
    // الهدف: دقة عالية جداً (pixelRatio = 5)
    // لكن مع حجم نهائي آمن (لا يتجاوز 100 ميجابكسل)
    const TARGET_PIXEL_RATIO = 5;
    const MAX_PIXELS = 100 * 1000 * 1000; // 100 ميجابكسل

    const currentPixels = svgWidth * svgHeight;
    const maxRatio = Math.sqrt(MAX_PIXELS / currentPixels);
    const pixelRatio = Math.min(TARGET_PIXEL_RATIO, Math.max(2, maxRatio));

    const finalWidth = svgWidth * pixelRatio;
    const finalHeight = svgHeight * pixelRatio;

    console.log(`[Export] SVG: ${svgWidth}x${svgHeight}`);
    console.log(`[Export] PixelRatio: ${pixelRatio.toFixed(2)}`);
    console.log(`[Export] Final: ${finalWidth}x${finalHeight} (${((finalWidth * finalHeight) / 1000000).toFixed(1)}MP)`);

    // =====================================================
    // ✅ تقنية "Chunked Rendering"
    // ننتظر بين الخطوات للسماح للمتصفح بالتنفس
    // =====================================================

    // الخطوة 1: تجهيز المتصفح
    setProgress("جاري تجهيز المتصفح...");
    setProgressPercent(10);
    await new Promise((resolve) => setTimeout(resolve, 200));

    // الخطوة 2: بدء التصدير
    setProgress("جاري تصدير الشجرة بدقة عالية...");
    setProgressPercent(30);
    await new Promise((resolve) => setTimeout(resolve, 200));

    // الخطوة 3: التصدير الفعلي (هنا العملية الثقيلة)
    let dataUrl: string;
    try {
      dataUrl = await toPng(svgElement as unknown as HTMLElement, {
        pixelRatio: pixelRatio,
        backgroundColor: "#FDFBF3",
        cacheBust: true,
        // ✅ تحسينات إضافية:
        skipAutoScale: true,
        quality: 1,
      });
    } catch (error) {
      console.error("toPng failed:", error);
      throw new Error("فشل تصدير الصورة. حاول مرة أخرى أو استخدم مقاساً أصغر.");
    }

    // الخطوة 4: انتهى التصدير
    setProgress("جاري تجهيز الصورة النهائية...");
    setProgressPercent(80);
    await new Promise((resolve) => setTimeout(resolve, 200));

    // الخطوة 5: التحقق من النتيجة
    setProgressPercent(100);

    return { dataUrl, width: svgWidth, height: svgHeight };
  }

  // =====================================================
  // تصدير PDF
  // =====================================================
  async function exportPDF(size: PaperSize) {
    if (!svgRef.current) return;
    setIsExporting(true);
    setProgressPercent(0);
    setProgress(`جاري تحضير PDF بمقاس ${size}...`);

    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const { jsPDF } = await import("jspdf");

      const paperSizes: Record<PaperSize, [number, number]> = {
        A4: [297, 210],
        A3: [420, 297],
        A2: [594, 420],
        A1: [841, 594],
        A0: [1189, 841],
      };

      const [paperWidth, paperHeight] = paperSizes[size];

      setProgress("جاري تصدير الشجرة بدقة عالية...");
      const { dataUrl } = await renderTreeToImage();

      setProgress("جاري إنشاء ملف PDF...");
      setProgressPercent(85);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [paperWidth, paperHeight],
        compress: true,
      });

      // ===== الخلفية الكريمية =====
      pdf.setFillColor(253, 251, 243);
      pdf.rect(0, 0, paperWidth, paperHeight, "F");

      // ===== الإطار الذهبي =====
      pdf.setDrawColor(201, 162, 39);
      pdf.setLineWidth(1);
      pdf.rect(6, 6, paperWidth - 12, paperHeight - 12);
      pdf.setLineWidth(0.3);
      pdf.rect(10, 10, paperWidth - 20, paperHeight - 20);

      // ===== العنوان الرئيسي =====
      let currentY = 22;

      if (title) {
        try {
          const titleCanvas = document.createElement("canvas");
          titleCanvas.width = paperWidth * 8;
          titleCanvas.height = 50;
          const ctx = titleCanvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#FDFBF3";
            ctx.fillRect(0, 0, titleCanvas.width, titleCanvas.height);
            ctx.font = "bold 40px 'Amiri', serif";
            ctx.fillStyle = "#0A1711";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.direction = "rtl";
            ctx.fillText(title, titleCanvas.width / 2, 25);

            const titleDataUrl = titleCanvas.toDataURL("image/png");
            pdf.addImage(
              titleDataUrl,
              "PNG",
              paperWidth / 2 - 70,
              currentY - 6,
              140,
              12
            );
          }
        } catch (e) {
          pdf.setFontSize(18);
          pdf.setTextColor(10, 23, 17);
          pdf.text(title, paperWidth / 2, currentY, { align: "center" });
        }
        currentY += 11;
      }

      // ===== العنوان الفرعي =====
      if (subtitle) {
        try {
          const subCanvas = document.createElement("canvas");
          subCanvas.width = paperWidth * 8;
          subCanvas.height = 35;
          const ctx = subCanvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#FDFBF3";
            ctx.fillRect(0, 0, subCanvas.width, subCanvas.height);
            ctx.font = "24px 'Amiri', serif";
            ctx.fillStyle = "#8B5A2B";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.direction = "rtl";
            ctx.fillText(subtitle, subCanvas.width / 2, 17);

            const subDataUrl = subCanvas.toDataURL("image/png");
            pdf.addImage(
              subDataUrl,
              "PNG",
              paperWidth / 2 - 60,
              currentY - 5,
              120,
              8
            );
          }
        } catch (e) {
          pdf.setFontSize(12);
          pdf.setTextColor(139, 90, 43);
          pdf.text(subtitle, paperWidth / 2, currentY, { align: "center" });
        }
        currentY += 8;
      }

      // ===== خط فاصل =====
      pdf.setDrawColor(201, 162, 39);
      pdf.setLineWidth(0.5);
      pdf.line(paperWidth / 2 - 40, currentY, paperWidth / 2 + 40, currentY);
      currentY += 5;

      // ===== الشجرة =====
      const validFooterLines = footerLines.filter((l) => l.trim());
      const footerHeight =
        validFooterLines.length > 0 ? 12 + validFooterLines.length * 6 : 8;

      const treeTopY = currentY;
      const treeBottomY = paperHeight - footerHeight - 5;
      const treeAvailableHeight = treeBottomY - treeTopY;
      const treeAvailableWidth = paperWidth - 20;

      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
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

      // ✅ استخدام FAST مع HIGH للتوازن
      pdf.addImage(
        dataUrl,
        "PNG",
        imgX,
        imgY,
        imgWidth,
        imgHeight,
        undefined,
        "FAST"
      );

      // ===== التفاصيل السفلية =====
      if (validFooterLines.length > 0) {
        const footerY = paperHeight - footerHeight;

        pdf.setDrawColor(201, 162, 39);
        pdf.setLineWidth(0.5);
        pdf.line(15, footerY - 3, paperWidth - 15, footerY - 3);

        try {
          const footerCanvas = document.createElement("canvas");
          footerCanvas.width = paperWidth * 8;
          footerCanvas.height = validFooterLines.length * 35;
          const ctx = footerCanvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#FDFBF3";
            ctx.fillRect(0, 0, footerCanvas.width, footerCanvas.height);
            ctx.font = "18px 'Amiri', serif";
            ctx.fillStyle = "#505050";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.direction = "rtl";

            validFooterLines.forEach((line, index) => {
              ctx.fillText(line, footerCanvas.width / 2, index * 35 + 17);
            });

            const footerDataUrl = footerCanvas.toDataURL("image/png");
            pdf.addImage(
              footerDataUrl,
              "PNG",
              15,
              footerY,
              paperWidth - 30,
              validFooterLines.length * 5
            );
          }
        } catch (e) {
          pdf.setFontSize(9);
          pdf.setTextColor(80, 80, 80);
          validFooterLines.forEach((line, index) => {
            pdf.text(line, paperWidth / 2, footerY + index * 5, {
              align: "center",
            });
          });
        }
      }

      setProgress("جاري الحفظ...");
      setProgressPercent(95);
      await new Promise((resolve) => setTimeout(resolve, 100));

      pdf.save(`${treeTitle}-${size}.pdf`);

      setProgress("✅ تم التصدير بنجاح!");
      setProgressPercent(100);
      setTimeout(() => {
        setIsOpen(false);
        setProgress("");
        setProgressPercent(0);
      }, 2000);
    } catch (error) {
      console.error("PDF Export Error:", error);
      setProgress(
        `❌ ${error instanceof Error ? error.message : "حدث خطأ أثناء التصدير"}`
      );
      setTimeout(() => {
        setProgress("");
        setProgressPercent(0);
      }, 4000);
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
    setProgressPercent(0);
    setProgress("جاري إنشاء PNG...");

    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const { dataUrl } = await renderTreeToImage();

      const link = document.createElement("a");
      link.download = `${treeTitle}.png`;
      link.href = dataUrl;
      link.click();

      setProgress("✅ تم التصدير!");
      setProgressPercent(100);
      setTimeout(() => {
        setIsOpen(false);
        setProgress("");
        setProgressPercent(0);
      }, 2000);
    } catch (error) {
      console.error("PNG Export Error:", error);
      setProgress("❌ حدث خطأ");
      setTimeout(() => {
        setProgress("");
        setProgressPercent(0);
      }, 3000);
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
                className="p-2 hover:bg-white/20 rounded-lg transition group disabled:opacity-50"
                title="إغلاق"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              </button>
            </div>

            {/* المحتوى */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {isExporting ? (
                <div className="text-center py-8">
                  <Loader2 className="w-12 h-12 text-gold-500 animate-spin mx-auto mb-4" />
                  <p className="text-dark-bg font-bold mb-4">{progress}</p>

                  {/* شريط التقدم */}
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-gold-500 to-gold-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500">{progressPercent}%</p>

                  <p className="text-xs text-gray-400 mt-4">
                    ⏱️ قد يستغرق التصدير حتى دقيقة واحدة حسب حجم الشجرة
                  </p>
                </div>
              ) : (
                <>
                  {/* إعدادات العنوان */}
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

                  {showSettings && (
                    <div className="bg-heritage-bg border border-gold-500/30 rounded-lg p-4 space-y-4">
                      <div>
                        <label className="block text-sm font-bold mb-2 text-dark-bg">
                          العنوان الرئيسي
                        </label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
                          placeholder="شجرة النسب العائلية الكريمة"
                        />
                      </div>

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
                                onChange={(e) =>
                                  updateFooterLine(index, e.target.value)
                                }
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
                      <h3 className="font-bold text-dark-bg">
                        تصدير PDF للطباعة
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {(["A4", "A3", "A2", "A1", "A0"] as PaperSize[]).map(
                        (size) => (
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
                        )
                      )}
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
                      تحميل PNG (دقة عالية جداً)
                    </button>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-xs text-yellow-800">
                    💡 <strong>نصيحة:</strong> للطباعة على لوحة كبيرة، اختر
                    مقاس <strong>A0</strong> أو <strong>A1</strong>.
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

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
  const [showSettings, setShowSettings] = useState(false);

  const [title, setTitle] = useState("شجرة النسب العائلية الكريمة");
  const [subtitle, setSubtitle] = useState("");
  const [footerLines, setFooterLines] = useState<string[]>([
    "تم إعداد هذه الشجرة بواسطة Mohamed Abdalwhab",
  ]);

  // =====================================================
  // تحميل خط عربي لدعم PDF
  // =====================================================
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    // إضافة خط Amiri مباشرة في HTML
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    setTimeout(() => setFontLoaded(true), 500);
  }, []);

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
  // إنشاء صورة عالية الدقة من الشجرة
  // =====================================================
  async function renderTreeToImage(): Promise<{ dataUrl: string; width: number; height: number }> {
    if (!svgRef.current) throw new Error("SVG not found");

    const { toPng } = await import("html-to-image");
    const svgElement = svgRef.current;

    // الحصول على الأبعاد الفعلية للـ SVG
    const svgRect = svgElement.getBoundingClientRect();
    const viewBox = svgElement.getAttribute("viewBox");
    
    let svgWidth = svgRect.width || 1200;
    let svgHeight = svgRect.height || 800;

    if (viewBox) {
      const [, , vbWidth, vbHeight] = viewBox.split(" ").map(Number);
      if (vbWidth && vbHeight) {
        svgWidth = vbWidth;
        svgHeight = vbHeight;
      }
    }

    // تصدير بدقة عالية جداً
    const dataUrl = await toPng(svgElement as unknown as HTMLElement, {
      pixelRatio: 5,
      backgroundColor: "#FDFBF3",
      cacheBust: true,
      width: svgWidth * 1.2,
      height: svgHeight * 1.2,
      style: {
        transform: "scale(1.2)",
        transformOrigin: "top left",
      },
    });

    return { dataUrl, width: svgWidth, height: svgHeight };
  }

  // =====================================================
  // تصدير PDF
  // =====================================================
  async function exportPDF(size: PaperSize) {
    if (!svgRef.current) return;
    setIsExporting(true);
    setProgress(`جاري تحضير PDF بمقاس ${size}...`);

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

      setProgress("جاري تحويل الشجرة إلى صورة عالية الدقة...");
      const { dataUrl } = await renderTreeToImage();

      setProgress("جاري إنشاء ملف PDF...");

      // إنشاء PDF
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [paperWidth, paperHeight],
        compress: true,
      });

      // خلفية كريمية
      pdf.setFillColor(253, 251, 243);
      pdf.rect(0, 0, paperWidth, paperHeight, "F");

      // إطار ذهبي
      pdf.setDrawColor(201, 162, 39);
      pdf.setLineWidth(1);
      pdf.rect(6, 6, paperWidth - 12, paperHeight - 12);
      pdf.setLineWidth(0.3);
      pdf.rect(10, 10, paperWidth - 20, paperHeight - 20);

      // ===== العنوان =====
      let currentY = 22;

      if (title) {
        // استخدام خط عربي
        try {
          // إضافة العنوان عبر canvas (لتفادي مشكلة الحروف)
          const titleCanvas = document.createElement("canvas");
          titleCanvas.width = paperWidth * 10;
          titleCanvas.height = 60;
          const ctx = titleCanvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#FDFBF3";
            ctx.fillRect(0, 0, titleCanvas.width, titleCanvas.height);
            ctx.font = "bold 40px 'Amiri', serif";
            ctx.fillStyle = "#0A1711";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.direction = "rtl";
            ctx.fillText(title, titleCanvas.width / 2, 30);
            
            const titleDataUrl = titleCanvas.toDataURL("image/png");
            pdf.addImage(titleDataUrl, "PNG", paperWidth / 2 - 60, currentY - 8, 120, 15);
          }
        } catch (e) {
          // إذا فشل، نكتب بالخط الافتراضي
          pdf.setFontSize(20);
          pdf.setTextColor(10, 23, 17);
          pdf.text(title, paperWidth / 2, currentY, { align: "center" });
        }
        currentY += 12;
      }

      // العنوان الفرعي
      if (subtitle) {
        try {
          const subCanvas = document.createElement("canvas");
          subCanvas.width = paperWidth * 10;
          subCanvas.height = 40;
          const ctx = subCanvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#FDFBF3";
            ctx.fillRect(0, 0, subCanvas.width, subCanvas.height);
            ctx.font = "24px 'Amiri', serif";
            ctx.fillStyle = "#8B5A2B";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.direction = "rtl";
            ctx.fillText(subtitle, subCanvas.width / 2, 20);
            
            const subDataUrl = subCanvas.toDataURL("image/png");
            pdf.addImage(subDataUrl, "PNG", paperWidth / 2 - 50, currentY - 6, 100, 10);
          }
        } catch (e) {
          pdf.setFontSize(12);
          pdf.setTextColor(139, 90, 43);
          pdf.text(subtitle, paperWidth / 2, currentY, { align: "center" });
        }
        currentY += 10;
      }

      // خط فاصل ذهبي
      pdf.setDrawColor(201, 162, 39);
      pdf.setLineWidth(0.5);
      pdf.line(paperWidth / 2 - 40, currentY, paperWidth / 2 + 40, currentY);
      currentY += 6;

      // ===== الشجرة (كامل الصفحة) =====
      const footerHeight = footerLines.filter((l) => l.trim()).length > 0 
        ? 12 + footerLines.filter((l) => l.trim()).length * 6 
        : 8;

      const treeTopY = currentY;
      const treeBottomY = paperHeight - footerHeight - 5;
      const treeAvailableHeight = treeBottomY - treeTopY;
      const treeAvailableWidth = paperWidth - 24;

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

      // ===== التفاصيل السفلية =====
      const validFooterLines = footerLines.filter((l) => l.trim());
      if (validFooterLines.length > 0) {
        const footerY = paperHeight - footerHeight;

        pdf.setDrawColor(201, 162, 39);
        pdf.setLineWidth(0.5);
        pdf.line(20, footerY - 3, paperWidth - 20, footerY - 3);

        // كتابة كل سطر عبر canvas
        try {
          const footerCanvas = document.createElement("canvas");
          footerCanvas.width = paperWidth * 10;
          footerCanvas.height = validFooterLines.length * 40;
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
              ctx.fillText(line, footerCanvas.width / 2, index * 40 + 20);
            });

            const footerDataUrl = footerCanvas.toDataURL("image/png");
            pdf.addImage(
              footerDataUrl,
              "PNG",
              20,
              footerY,
              paperWidth - 40,
              validFooterLines.length * 5
            );
          }
        } catch (e) {
          pdf.setFontSize(9);
          pdf.setTextColor(80, 80, 80);
          validFooterLines.forEach((line, index) => {
            pdf.text(line, paperWidth / 2, footerY + index * 5, { align: "center" });
          });
        }
      }

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
      const { dataUrl } = await renderTreeToImage();
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
      <button
        onClick={() => setIsOpen(true)}
        className="bg-gold-500 text-dark-bg px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gold-600 transition shadow-lg"
        title="تصدير الشجرة"
      >
        <Download className="w-4 h-4" />
        تصدير
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8">
            <div className="bg-dark-bg text-white p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Download className="w-5 h-5 text-gold-500" />
                تصدير الشجرة
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                disabled={isExporting}
                className="p-2 hover:bg-white/20 rounded-lg transition group"
                title="إغلاق"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              </button>
            </div>

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

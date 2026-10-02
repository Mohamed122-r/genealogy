"use client";

import { useState, useEffect } from "react";
import {
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  X,
} from "lucide-react";

interface ExportMenuProps {
  svgRef: React.RefObject<SVGSVGElement>;
  treeTitle?: string;
}

type PaperSize = "A4" | "A3" | "A2" | "A1" | "A0";

interface ExportSettings {
  treeTitle: string;
  treeSubtitle: string;
  treeDescription: string;
  footerLines: string[];
}

export function ExportMenu({ svgRef, treeTitle = "شجرة-النسب" }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [isFontLoaded, setIsFontLoaded] = useState(false);

  const [settings, setSettings] = useState<ExportSettings>({
    treeTitle: "شجرة النسب العائلية الكريمة",
    treeSubtitle: "",
    treeDescription: "",
    footerLines: [],
  });

  // =====================================================
  // ✅ تحميل خط Amiri بانتظار كامل
  // =====================================================
  useEffect(() => {
    let isMounted = true;

    async function loadFonts() {
      try {
        const link = document.createElement("link");
        link.href =
          "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap";
        link.rel = "stylesheet";
        document.head.appendChild(link);

        if (document.fonts) {
          await document.fonts.load("bold 42px Amiri");
          await document.fonts.load("24px Amiri");
          await document.fonts.load("16px Amiri");
          await document.fonts.ready;
        }

        // انتظار إضافي لضمان التحميل الكامل
        await new Promise((resolve) => setTimeout(resolve, 500));

        if (isMounted) setIsFontLoaded(true);
      } catch (e) {
        if (isMounted) setIsFontLoaded(true);
      }
    }

    loadFonts();
    return () => {
      isMounted = false;
    };
  }, []);

  // =====================================================
  // ✅ جلب الإعدادات من قاعدة البيانات
  // =====================================================
  useEffect(() => {
    fetch("/api/admin/export-settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings({
          treeTitle: data.treeTitle || "شجرة النسب العائلية الكريمة",
          treeSubtitle: data.treeSubtitle || "",
          treeDescription: data.treeDescription || "",
          footerLines: data.footerLines || [],
        });
      })
      .catch(() => {});
  }, []);

  // =====================================================
  // ✅ كتابة نص عربي على canvas بدقة عالية جداً
  // =====================================================
  function drawArabicText(
    text: string,
    options: {
      fontSize: number;
      fontWeight?: string;
      color: string;
      maxWidth: number;
    }
  ): { dataUrl: string; width: number; height: number } | null {
    const { fontSize, fontWeight = "normal", color, maxWidth } = options;

    // ✅ دقة فائقة (16x بدلاً من 8x)
    const dpr = 16;
    const widthPx = maxWidth * dpr;
    const heightPx = Math.ceil(fontSize * 1.5 * dpr);

    const canvas = document.createElement("canvas");
    canvas.width = widthPx;
    canvas.height = heightPx;

    const ctx = canvas.getContext("2d", {
      alpha: true,
    });
    if (!ctx) return null;

    // ✅ تحسين جودة الرسم
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // ✅ استخدام خط Amiri صراحة مع fallback
    ctx.font = `${fontWeight} ${fontSize * dpr}px "Amiri", serif`;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.direction = "rtl";

    // رسم النص
    ctx.fillText(text, widthPx / 2, heightPx / 2);

    return {
      dataUrl: canvas.toDataURL("image/png", 1.0),
      width: maxWidth,
      height: fontSize * 1.5,
    };
  }

  async function renderTreeToImage(): Promise<{
    dataUrl: string;
    width: number;
    height: number;
  }> {
    if (!svgRef.current) throw new Error("SVG not found");

    const { toPng } = await import("html-to-image");
    const svgElement = svgRef.current;

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

    const TARGET_PIXEL_RATIO = 5;
    const MAX_PIXELS = 100 * 1000 * 1000;

    const currentPixels = svgWidth * svgHeight;
    const maxRatio = Math.sqrt(MAX_PIXELS / currentPixels);
    const pixelRatio = Math.min(TARGET_PIXEL_RATIO, Math.max(2, maxRatio));

    setProgress("جاري تجهيز المتصفح...");
    setProgressPercent(10);
    await new Promise((resolve) => setTimeout(resolve, 200));

    setProgress("جاري تصدير الشجرة بدقة عالية...");
    setProgressPercent(30);
    await new Promise((resolve) => setTimeout(resolve, 200));

    let dataUrl: string;
    try {
      dataUrl = await toPng(svgElement as unknown as HTMLElement, {
        pixelRatio: pixelRatio,
        backgroundColor: "#FDFBF3",
        cacheBust: true,
        skipAutoScale: true,
        quality: 1,
      });
    } catch (error) {
      throw new Error("فشل تصدير الصورة");
    }

    setProgress("جاري تجهيز الصورة...");
    setProgressPercent(80);
    await new Promise((resolve) => setTimeout(resolve, 200));

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

      setProgress("جاري تصدير الشجرة...");
      const { dataUrl } = await renderTreeToImage();

      setProgress("جاري إنشاء ملف PDF...");
      setProgressPercent(85);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [paperWidth, paperHeight],
        compress: false, // ✅ لا ضغط للحفاظ على الجودة
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

      let currentY = 24;

      // ✅ العنوان الرئيسي
      if (settings.treeTitle) {
        const titleResult = drawArabicText(settings.treeTitle, {
          fontSize: 42,
          fontWeight: "bold",
          color: "#0A1711",
          maxWidth: paperWidth - 40,
        });

        if (titleResult) {
          pdf.addImage(
            titleResult.dataUrl,
            "PNG",
            20,
            currentY - 10,
            titleResult.width,
            titleResult.height,
            undefined,
            "SLOW" // ✅ جودة عالية
          );
        }
        currentY += titleResult?.height || 14;
      }

      // ✅ العنوان الفرعي
      if (settings.treeSubtitle) {
        const subResult = drawArabicText(settings.treeSubtitle, {
          fontSize: 24,
          color: "#8B5A2B",
          maxWidth: paperWidth - 60,
        });

        if (subResult) {
          pdf.addImage(
            subResult.dataUrl,
            "PNG",
            30,
            currentY - 5,
            subResult.width,
            subResult.height,
            undefined,
            "SLOW"
          );
        }
        currentY += subResult?.height || 8;
      }

      // ✅ الوصف التفصيلي
      if (settings.treeDescription) {
        const descResult = drawArabicText(settings.treeDescription, {
          fontSize: 16,
          color: "#505050",
          maxWidth: paperWidth - 60,
        });

        if (descResult) {
          pdf.addImage(
            descResult.dataUrl,
            "PNG",
            30,
            currentY - 4,
            descResult.width,
            descResult.height,
            undefined,
            "SLOW"
          );
        }
        currentY += descResult?.height || 7;
      }

      // خط فاصل ذهبي
      pdf.setDrawColor(201, 162, 39);
      pdf.setLineWidth(0.5);
      pdf.line(paperWidth / 2 - 40, currentY, paperWidth / 2 + 40, currentY);
      currentY += 5;

      // ✅ الشجرة
      const validFooterLines = settings.footerLines.filter((l) => l.trim());
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

      // ✅ التفاصيل السفلية
      if (validFooterLines.length > 0) {
        const footerY = paperHeight - footerHeight;

        pdf.setDrawColor(201, 162, 39);
        pdf.setLineWidth(0.5);
        pdf.line(15, footerY - 3, paperWidth - 15, footerY - 3);

        validFooterLines.forEach((line, index) => {
          const lineResult = drawArabicText(line, {
            fontSize: 16,
            color: "#505050",
            maxWidth: paperWidth - 40,
          });

          if (lineResult) {
            pdf.addImage(
              lineResult.dataUrl,
              "PNG",
              20,
              footerY + index * 5,
              lineResult.width,
              lineResult.height,
              undefined,
              "SLOW"
            );
          }
        });
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
      setProgress(
        `❌ ${error instanceof Error ? error.message : "حدث خطأ"}`
      );
      setTimeout(() => {
        setProgress("");
        setProgressPercent(0);
      }, 4000);
    } finally {
      setIsExporting(false);
    }
  }

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
                {!isFontLoaded && (
                  <span className="text-xs bg-yellow-500 text-dark-bg px-2 py-0.5 rounded-full font-bold">
                    جاري تحضير الخطوط...
                  </span>
                )}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                disabled={isExporting}
                className="p-2 hover:bg-white/20 rounded-lg transition group disabled:opacity-50"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {isExporting ? (
                <div className="text-center py-8">
                  <Loader2 className="w-12 h-12 text-gold-500 animate-spin mx-auto mb-4" />
                  <p className="text-dark-bg font-bold mb-4">{progress}</p>

                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-gold-500 to-gold-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500">{progressPercent}%</p>
                </div>
              ) : (
                <>
                  {/* معاينة الإعدادات */}
                  <div className="bg-heritage-bg border border-gold-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-dark-bg text-sm">
                        الإعدادات الحالية
                      </h3>
                      <span className="text-xs text-gray-500">
                        (للتعديل، افتح لوحة التحكم)
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-700">
                      <p>
                        <strong>العنوان:</strong> {settings.treeTitle || "—"}
                      </p>
                      {settings.treeSubtitle && (
                        <p>
                          <strong>العنوان الفرعي:</strong> {settings.treeSubtitle}
                        </p>
                      )}
                      {settings.treeDescription && (
                        <p className="text-xs">
                          <strong>الوصف:</strong> {settings.treeDescription}
                        </p>
                      )}
                    </div>
                  </div>

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
                            disabled={!isFontLoaded}
                            className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-lg font-bold hover:bg-red-100 transition flex items-center justify-between disabled:opacity-50"
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
                      disabled={!isFontLoaded}
                      className="w-full bg-blue-50 text-blue-700 border border-blue-200 px-4 py-3 rounded-lg font-bold hover:bg-blue-100 transition disabled:opacity-50"
                    >
                      تحميل PNG (دقة عالية جداً)
                    </button>
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

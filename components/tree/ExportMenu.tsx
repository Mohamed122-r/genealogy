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
  // تحميل الخطوط
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
  // جلب الإعدادات
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
  // حساب حجم الخط ديناميكياً
  // =====================================================
  function getFontSize(
    paperWidth: number,
    type: "title" | "subtitle" | "description" | "footer"
  ): number {
    const factors = {
      title: 0.042,
      subtitle: 0.026,
      description: 0.018,
      footer: 0.015,
    };
    const limits = {
      title: { min: 6, max: 50 },
      subtitle: { min: 4, max: 30 },
      description: { min: 3, max: 20 },
      footer: { min: 2.5, max: 15 },
    };
    const size = paperWidth * factors[type];
    return Math.min(limits[type].max, Math.max(limits[type].min, size));
  }

  // =====================================================
  // كتابة نص عربي
  // =====================================================
  function drawArabicText(
    text: string,
    options: {
      fontSizeMm: number;
      fontWeight?: string;
      color: string;
      maxWidthMm: number;
    }
  ): { dataUrl: string; widthMm: number; heightMm: number } | null {
    const { fontSizeMm, fontWeight = "normal", color, maxWidthMm } = options;
    const MM_TO_PX = 3.7795;
    const dpr = 16;
    const fontSizePx = fontSizeMm * MM_TO_PX * dpr;
    const widthPx = maxWidthMm * MM_TO_PX * dpr;
    const heightPx = Math.ceil(fontSizePx * 1.4);

    const canvas = document.createElement("canvas");
    canvas.width = widthPx;
    canvas.height = heightPx;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return null;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.font = `${fontWeight} ${fontSizePx}px "Amiri", serif`;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.direction = "rtl";
    ctx.fillText(text, widthPx / 2, heightPx / 2);

    const textMetrics = ctx.measureText(text);
    const actualWidthPx = Math.min(textMetrics.width, widthPx);
    const actualWidthMm = actualWidthPx / (MM_TO_PX * dpr);
    const actualHeightMm = fontSizeMm * 1.4;

    return {
      dataUrl: canvas.toDataURL("image/png", 1.0),
      widthMm: actualWidthMm,
      heightMm: actualHeightMm,
    };
  }

  // =====================================================
  // ✅ تصدير الشجرة مقسمة (Tiling)
  // =====================================================
  async function exportTreeAsTiles(): Promise<string> {
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

    // إذا كانت الشجرة صغيرة، نصدّرها دفعة واحدة
    if (svgWidth < 4000 && svgHeight < 4000) {
      setProgress("جاري تصدير الشجرة...");
      return await toPng(svgElement as unknown as HTMLElement, {
        pixelRatio: 3,
        backgroundColor: "#FDFBF3",
        cacheBust: true,
        skipAutoScale: true,
      });
    }

    // إذا كانت الشجرة ضخمة، نقسمها
    setProgress("جاري تجهيز الشجرة الضخمة (تقسيم ذكي)...");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    const scale = 2;
    canvas.width = svgWidth * scale;
    canvas.height = svgHeight * scale;

    const cols = 3;
    const rows = 3;
    const tileWidth = svgWidth / cols;
    const tileHeight = svgHeight / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const clipX = c * tileWidth;
        const clipY = r * tileHeight;

        const tileDataUrl = await toPng(svgElement as unknown as HTMLElement, {
          width: svgWidth,
          height: svgHeight,
          style: {
            transform: `translate(-${clipX}px, -${clipY}px)`,
            transformOrigin: "top left",
          },
          pixelRatio: scale,
          backgroundColor: "#FDFBF3",
        });

        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(
              img,
              clipX * scale,
              clipY * scale,
              tileWidth * scale,
              tileHeight * scale
            );
            resolve();
          };
          img.src = tileDataUrl;
        });

        const currentProgress =
          Math.round(((r * cols + c + 1) / (cols * rows)) * 60) + 10;
        setProgressPercent(currentProgress);
      }
    }

    setProgress("جاري دمج الأجزاء...");
    return canvas.toDataURL("image/png", 1.0);
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
      const dataUrl = await exportTreeAsTiles();

      setProgress("جاري إنشاء ملف PDF...");
      setProgressPercent(70);
      await new Promise((resolve) => setTimeout(resolve, 200));

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [paperWidth, paperHeight],
        compress: true,
      });

      // الخلفية والإطار
      pdf.setFillColor(253, 251, 243);
      pdf.rect(0, 0, paperWidth, paperHeight, "F");

      const frameWidth = Math.max(0.5, paperWidth * 0.003);
      pdf.setDrawColor(201, 162, 39);
      pdf.setLineWidth(frameWidth);
      const frameMargin = paperWidth * 0.02;
      pdf.rect(
        frameMargin,
        frameMargin,
        paperWidth - frameMargin * 2,
        paperHeight - frameMargin * 2
      );
      pdf.setLineWidth(frameWidth * 0.3);
      const innerMargin = paperWidth * 0.03;
      pdf.rect(
        innerMargin,
        innerMargin,
        paperWidth - innerMargin * 2,
        paperHeight - innerMargin * 2
      );

      const titleFontSize = getFontSize(paperWidth, "title");
      const subtitleFontSize = getFontSize(paperWidth, "subtitle");
      const descriptionFontSize = getFontSize(paperWidth, "description");
      const footerFontSize = getFontSize(paperWidth, "footer");

      const padding = paperWidth * 0.05;
      let currentY = paperHeight * 0.06;

      if (settings.treeTitle) {
        const result = drawArabicText(settings.treeTitle, {
          fontSizeMm: titleFontSize,
          fontWeight: "bold",
          color: "#0A1711",
          maxWidthMm: paperWidth - padding * 2,
        });
        if (result) {
          pdf.addImage(
            result.dataUrl,
            "PNG",
            padding,
            currentY,
            paperWidth - padding * 2,
            result.heightMm,
            undefined,
            "SLOW"
          );
          currentY += result.heightMm + paperHeight * 0.01;
        }
      }

      if (settings.treeSubtitle) {
        const result = drawArabicText(settings.treeSubtitle, {
          fontSizeMm: subtitleFontSize,
          color: "#8B5A2B",
          maxWidthMm: paperWidth - padding * 2.5,
        });
        if (result) {
          pdf.addImage(
            result.dataUrl,
            "PNG",
            padding * 1.25,
            currentY,
            paperWidth - padding * 2.5,
            result.heightMm,
            undefined,
            "SLOW"
          );
          currentY += result.heightMm + paperHeight * 0.008;
        }
      }

      if (settings.treeDescription) {
        const result = drawArabicText(settings.treeDescription, {
          fontSizeMm: descriptionFontSize,
          color: "#505050",
          maxWidthMm: paperWidth - padding * 3,
        });
        if (result) {
          pdf.addImage(
            result.dataUrl,
            "PNG",
            padding * 1.5,
            currentY,
            paperWidth - padding * 3,
            result.heightMm,
            undefined,
            "SLOW"
          );
          currentY += result.heightMm + paperHeight * 0.008;
        }
      }

      const validFooterLines = settings.footerLines.filter((l) => l.trim());
      const footerSectionHeight =
        validFooterLines.length > 0
          ? paperHeight * 0.05 + validFooterLines.length * footerFontSize * 1.5
          : paperHeight * 0.03;

      const treeTopY = currentY + paperHeight * 0.01;
      const treeBottomY = paperHeight - footerSectionHeight - paperHeight * 0.02;
      const treeAvailableHeight = treeBottomY - treeTopY;
      const treeAvailableWidth = paperWidth - padding * 2;

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

      if (validFooterLines.length > 0) {
        const footerStartY =
          paperHeight - footerSectionHeight - paperHeight * 0.01;
        pdf.setDrawColor(201, 162, 39);
        pdf.setLineWidth(Math.max(0.3, paperWidth * 0.001));
        pdf.line(padding, footerStartY, paperWidth - padding, footerStartY);

        let lineY = footerStartY + paperHeight * 0.008;
        validFooterLines.forEach((line) => {
          const result = drawArabicText(line, {
            fontSizeMm: footerFontSize,
            color: "#505050",
            maxWidthMm: paperWidth - padding * 2,
          });
          if (result) {
            pdf.addImage(
              result.dataUrl,
              "PNG",
              padding,
              lineY,
              paperWidth - padding * 2,
              result.heightMm,
              undefined,
              "SLOW"
            );
            lineY += result.heightMm * 1.3;
          }
        });
      }

      setProgress("جاري الحفظ...");
      setProgressPercent(95);
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
      const dataUrl = await exportTreeAsTiles();
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
      >
        <Download className="w-4 h-4" /> تصدير
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8">
            {/* الرأس */}
            <div className="bg-dark-bg text-white p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Download className="w-5 h-5 text-gold-500" /> تصدير الشجرة
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

            {/* المحتوى */}
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
                  <p className="text-xs text-gray-400 mt-4">
                    ⏱️ قد يستغرق التصدير حتى دقيقة واحدة حسب حجم الشجرة
                  </p>
                </div>
              ) : (
                <>
                  {/* الإعدادات الحالية */}
                  <div className="bg-heritage-bg border border-gold-500/30 rounded-lg p-4">
                    <h3 className="font-bold text-dark-bg text-sm mb-2">
                      الإعدادات الحالية
                    </h3>
                    <div className="space-y-1 text-sm text-gray-700">
                      <p>
                        <strong>العنوان:</strong> {settings.treeTitle || "—"}
                      </p>
                      {settings.treeSubtitle && (
                        <p>
                          <strong>العنوان الفرعي:</strong>{" "}
                          {settings.treeSubtitle}
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

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
  const [isFontLoaded, setIsFontLoaded] = useState(false);

  const [title, setTitle] = useState("شجرة النسب العائلية الكريمة");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [footerLines, setFooterLines] = useState<string[]>([
    "تم إعداد هذه الشجرة بواسطة Mohamed Abdalwhab",
  ]);

  // =====================================================
  // ✅ تحميل خط Amiri + انتظار جاهزيته
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
          await document.fonts.load("bold 40px Amiri");
          await document.fonts.load("24px Amiri");
          await document.fonts.load("18px Amiri");
          await document.fonts.ready;
        }

        if (isMounted) {
          setIsFontLoaded(true);
          console.log("[Export] Amiri font loaded successfully");
        }
      } catch (e) {
        console.warn("[Export] Font loading failed:", e);
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
        if (data.treeTitle) setTitle(data.treeTitle);
        if (data.treeSubtitle) setSubtitle(data.treeSubtitle);
        if (data.treeDescription) setDescription(data.treeDescription);
        if (data.footerLines?.length > 0) setFooterLines(data.footerLines);
      })
      .catch((err) => console.warn("Failed to load export settings:", err));
  }, []);

  function addFooterLine() {
    if (footerLines.length < 5) setFooterLines([...footerLines, ""]);
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
  // ✅ حفظ الإعدادات
  // =====================================================
  async function saveSettings() {
    try {
      await fetch("/api/admin/export-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          treeTitle: title,
          treeSubtitle: subtitle,
          treeDescription: description,
        }),
      });
    } catch (error) {
      console.warn("Failed to save settings:", error);
    }
  }

  // =====================================================
  // ✅ كتابة نص عربي على canvas
  // =====================================================
  function drawArabicText(
    text: string,
    options: {
      fontSize: number;
      fontFamily: string;
      fontWeight?: string;
      color: string;
      align?: CanvasTextAlign;
      maxWidth: number;
    }
  ): string {
    const {
      fontSize,
      fontFamily,
      fontWeight = "normal",
      color,
      align = "center",
      maxWidth,
    } = options;

    const dpr = 8;
    const canvas = document.createElement("canvas");
    canvas.width = maxWidth * dpr;
    canvas.height = fontSize * 1.6 * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    ctx.font = `${fontWeight} ${fontSize * dpr}px '${fontFamily}', serif`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.direction = "rtl";

    const x =
      align === "center"
        ? canvas.width / 2
        : align === "right"
        ? canvas.width - 10
        : 10;
    ctx.fillText(text, x, canvas.height / 2);

    return canvas.toDataURL("image/png");
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
      console.error("toPng failed:", error);
      throw new Error("فشل تصدير الصورة");
    }

    setProgress("جاري تجهيز الصورة...");
    setProgressPercent(80);
    await new Promise((resolve) => setTimeout(resolve, 200));

    setProgressPercent(100);
    return { dataUrl, width: svgWidth, height: svgHeight };
  }

  async function exportPDF(size: PaperSize) {
    if (!svgRef.current) return;
    setIsExporting(true);
    setProgressPercent(0);
    setProgress(`جاري تحضير PDF بمقاس ${size}...`);

    await new Promise((resolve) => setTimeout(resolve, 100));
    await saveSettings();

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

      pdf.setFillColor(253, 251, 243);
      pdf.rect(0, 0, paperWidth, paperHeight, "F");

      pdf.setDrawColor(201, 162, 39);
      pdf.setLineWidth(1);
      pdf.rect(6, 6, paperWidth - 12, paperHeight - 12);
      pdf.setLineWidth(0.3);
      pdf.rect(10, 10, paperWidth - 20, paperHeight - 20);

      let currentY = 24;

      if (title) {
        const titleImg = drawArabicText(title, {
          fontSize: 42,
          fontFamily: "Amiri",
          fontWeight: "bold",
          color: "#0A1711",
          maxWidth: paperWidth - 40,
        });

        if (titleImg) {
          pdf.addImage(titleImg, "PNG", 20, currentY - 8, paperWidth - 40, 14);
        }
        currentY += 14;
      }

      if (subtitle) {
        const subImg = drawArabicText(subtitle, {
          fontSize: 24,
          fontFamily: "Amiri",
          color: "#8B5A2B",
          maxWidth: paperWidth - 60,
        });

        if (subImg) {
          pdf.addImage(subImg, "PNG", 30, currentY - 5, paperWidth - 60, 8);
        }
        currentY += 8;
      }

      if (description) {
        const descImg = drawArabicText(description, {
          fontSize: 16,
          fontFamily: "Amiri",
          color: "#505050",
          maxWidth: paperWidth - 60,
        });

        if (descImg) {
          pdf.addImage(descImg, "PNG", 30, currentY - 4, paperWidth - 60, 6);
        }
        currentY += 7;
      }

      pdf.setDrawColor(201, 162, 39);
      pdf.setLineWidth(0.5);
      pdf.line(paperWidth / 2 - 40, currentY, paperWidth / 2 + 40, currentY);
      currentY += 5;

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
        const footerY = paperHeight - footerHeight;

        pdf.setDrawColor(201, 162, 39);
        pdf.setLineWidth(0.5);
        pdf.line(15, footerY - 3, paperWidth - 15, footerY - 3);

        validFooterLines.forEach((line, index) => {
          const lineImg = drawArabicText(line, {
            fontSize: 16,
            fontFamily: "Amiri",
            color: "#505050",
            maxWidth: paperWidth - 40,
          });

          if (lineImg) {
            pdf.addImage(
              lineImg,
              "PNG",
              20,
              footerY + index * 5,
              paperWidth - 40,
              5
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
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="w-full bg-heritage-bg border border-gold-500/30 rounded-lg p-3 flex items-center justify-between hover:bg-gold-500/5 transition"
                  >
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-gold-500" />
                      <span className="font-bold text-dark-bg">
                        إعدادات العنوان والوصف
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
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 bg-white text-dark-bg placeholder:text-gray-400"
                          placeholder="شجرة النسب العائلية الكريمة"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold mb-2 text-dark-bg">
                          العنوان الفرعي
                        </label>
                        <input
                          type="text"
                          value={subtitle}
                          onChange={(e) => setSubtitle(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 bg-white text-dark-bg placeholder:text-gray-400"
                          placeholder="اختياري"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold mb-2 text-dark-bg">
                          الوصف التفصيلي
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={3}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 text-sm bg-white text-dark-bg placeholder:text-gray-400"
                          placeholder="وصف مختصر للشجرة يظهر تحت العنوان"
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
                                className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 text-sm bg-white text-dark-bg placeholder:text-gray-400"
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

                      <button
                        type="button"
                        onClick={saveSettings}
                        className="w-full bg-deep-green text-white py-2 rounded-lg font-bold hover:bg-dark-bg transition"
                      >
                        💾 حفظ الإعدادات
                      </button>
                    </div>
                  )}

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

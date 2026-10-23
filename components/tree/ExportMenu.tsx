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

const MM_TO_PX = 3.7795;

export function ExportMenu({ svgRef, treeTitle = "شجرة-النسب" }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [isFontLoaded, setIsFontLoaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [settings, setSettings] = useState<ExportSettings>({
    treeTitle: "شجرة النسب العائلية الكريمة",
    treeSubtitle: "",
    treeDescription: "",
    footerLines: [],
  });

  // تحميل الخطوط
  useEffect(() => {
    let isMounted = true;
    async function loadFonts() {
      try {
        const link = document.createElement("link");
        link.href = "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap";
        link.rel = "stylesheet";
        document.head.appendChild(link);

        if (document.fonts) {
          await Promise.all([
            document.fonts.load("bold 48px Amiri"),
            document.fonts.load("400 24px Amiri"),
          ]);
          let tries = 0;
          while (tries < 20 && !document.fonts.check("bold 48px Amiri")) {
            await new Promise((r) => setTimeout(r, 150));
            tries++;
          }
        }
        if (isMounted) setIsFontLoaded(true);
      } catch {
        if (isMounted) setIsFontLoaded(true);
      }
    }
    loadFonts();
    return () => { isMounted = false; };
  }, []);

  // جلب الإعدادات
  useEffect(() => {
    fetch("/api/admin/export-settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings({
          treeTitle: data.treeTitle || "شجرة النسب العائلية الكريمة",
          treeSubtitle: data.treeSubtitle || "",
          treeDescription: data.treeDescription || "",
          footerLines: Array.isArray(data.footerLines) ? data.footerLines : [],
        });
      })
      .catch(() => {});
  }, []);

  function getFontSize(paperWidth: number, type: "title" | "subtitle" | "description" | "footer"): number {
    const factors = { title: 0.042, subtitle: 0.026, description: 0.018, footer: 0.015 };
    const limits = {
      title: { min: 6, max: 50 },
      subtitle: { min: 4, max: 30 },
      description: { min: 3, max: 20 },
      footer: { min: 2.5, max: 15 },
    };
    const size = paperWidth * factors[type];
    return Math.min(limits[type].max, Math.max(limits[type].min, size));
  }

  function drawArabicText(text: string, options: { fontSizeMm: number; fontWeight?: string; color: string; maxWidthMm: number }) {
    const { fontSizeMm, fontWeight = "normal", color, maxWidthMm } = options;
    const DPR = 4;
    const fontSizePx = fontSizeMm * MM_TO_PX * DPR;
    const widthPx = Math.max(1, Math.ceil(maxWidthMm * MM_TO_PX * DPR));
    const heightPx = Math.max(1, Math.ceil(fontSizePx * 1.5));

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
    ctx.fillText(text, widthPx / 2, heightPx / 2, widthPx * 0.98);

    return {
      dataUrl: canvas.toDataURL("image/png", 1.0),
      widthMm: maxWidthMm,
      heightMm: heightPx / (MM_TO_PX * DPR),
    };
  }

  function getSvgDimensions(svg: SVGSVGElement) {
    const viewBox = svg.getAttribute("viewBox");
    if (viewBox) {
      const parts = viewBox.split(/[\s,]+/).map(Number);
      if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
        return { w: parts[2], h: parts[3], x: parts[0], y: parts[1] };
      }
    }
    try {
      const bbox = svg.getBBox();
      if (bbox.width > 0 && bbox.height > 0) {
        return { w: bbox.width, h: bbox.height, x: bbox.x, y: bbox.y };
      }
    } catch {}
    return { w: svg.clientWidth || 1200, h: svg.clientHeight || 800, x: 0, y: 0 };
  }

  // =====================================================
  // 🚀 المحرك الجديد لتحويل الشجرة إلى صورة (آمن 100%)
  // =====================================================
  async function svgToPng(svgEl: SVGSVGElement, width: number, height: number, scale = 1.5): Promise<string> {
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(width));
    clone.setAttribute("height", String(height));

    const svgString = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("فشل تحويل SVG"));
        img.src = url;
      });

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      ctx.fillStyle = "#FDFBF3";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      return canvas.toDataURL("image/png", 1.0);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function exportTreeAsImage(): Promise<string> {
    if (!svgRef.current) throw new Error("SVG not found");
    const svgEl = svgRef.current;
    const { w: svgWidth, h: svgHeight, x: svgX, y: svgY } = getSvgDimensions(svgEl);

    if (svgWidth <= 0 || svgHeight <= 0) throw new Error("أبعاد الشجرة غير صالحة");

    // تقليل الدقة لتناسب الجوال (Scale 1.2 بدل 2)
    let SCALE = 1.2;
    const MAX_CANVAS_DIM = 4000; // حد آمن جداً للجوال
    if (svgWidth * SCALE > MAX_CANVAS_DIM || svgHeight * SCALE > MAX_CANVAS_DIM) {
      SCALE = Math.min(MAX_CANVAS_DIM / svgWidth, MAX_CANVAS_DIM / svgHeight);
    }

    if (svgWidth < 2500 && svgHeight < 2500) {
      setProgress("جاري تصدير الشجرة...");
      setProgressPercent(30);
      return await svgToPng(svgEl, svgWidth, svgHeight, SCALE);
    }

    setProgress("جاري معالجة الشجرة الضخمة...");
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(svgWidth * SCALE);
    canvas.height = Math.round(svgHeight * SCALE);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    ctx.fillStyle = "#FDFBF3";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cols = 5; // 25 قطعة لتخفيف الضغط
    const rows = 5;
    const tileW = svgWidth / cols;
    const tileH = svgHeight / rows;

    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const clipX = svgX + c * tileW;
        const clipY = svgY + r * tileH;

        clone.setAttribute("viewBox", `${clipX} ${clipY} ${tileW} ${tileH}`);
        clone.setAttribute("width", String(tileW));
        clone.setAttribute("height", String(tileH));

        const tileUrl = await svgToPng(clone, tileW, tileH, SCALE);

        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, Math.round(c * tileW * SCALE), Math.round(r * tileH * SCALE), Math.round(tileW * SCALE), Math.round(tileH * SCALE));
            resolve();
          };
          img.onerror = () => reject(new Error("فشل تحميل قطعة"));
          img.src = tileUrl;
        });

        setProgressPercent(10 + Math.round(((r * cols + c + 1) / (cols * rows)) * 60));
        await new Promise((r) => setTimeout(r, 100)); // تنفّس للمتصفح
      }
    }

    setProgress("جاري الدمج...");
    const result = canvas.toDataURL("image/png", 1.0);
    if (result.length < 1000) throw new Error("فشل إنشاء الصورة (الذاكرة ممتلئة)");
    
    return result;
  }

  // دالة التنزيل الآمنة
  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  // =====================================================
  // تصدير PDF
  // =====================================================
  async function exportPDF(size: PaperSize) {
    if (!svgRef.current) return;
    setIsExporting(true);
    setErrorMsg("");
    setProgressPercent(0);
    setProgress(`جاري تحضير PDF بمقاس ${size}...`);
    await new Promise((r) => setTimeout(r, 100));

    try {
      setProgress("جاري تصدير الشجرة (قد يستغرق دقيقة)...");
      const treeDataUrl = await exportTreeAsImage();
      
      const { jsPDF } = await import("jspdf");
      const paperSizes: Record<PaperSize, [number, number]> = {
        A4: [297, 210], A3: [420, 297], A2: [594, 420], A1: [841, 594], A0: [1189, 841],
      };
      const [paperWidth, paperHeight] = paperSizes[size];

      setProgress("جاري إنشاء ملف PDF...");
      setProgressPercent(80);

      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [paperWidth, paperHeight], compress: true });

      pdf.setFillColor(253, 251, 243);
      pdf.rect(0, 0, paperWidth, paperHeight, "F");

      // إطار
      pdf.setDrawColor(201, 162, 39);
      pdf.setLineWidth(paperWidth * 0.003);
      pdf.rect(paperWidth * 0.02, paperWidth * 0.02, paperWidth * 0.96, paperHeight - paperWidth * 0.04);

      // تحميل الصورة لمعرفة النسبة
      const img = new Image();
      img.src = treeDataUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("فشل قراءة الصورة"));
      });

      const padding = paperWidth * 0.05;
      const treeAvailableWidth = paperWidth - padding * 2;
      const treeAvailableHeight = paperHeight - padding * 2;

      const imgRatio = img.width / img.height;
      const availableRatio = treeAvailableWidth / treeAvailableHeight;

      let imgWidth = treeAvailableWidth;
      let imgHeight = treeAvailableWidth / imgRatio;
      if (imgRatio < availableRatio) {
        imgHeight = treeAvailableHeight;
        imgWidth = treeAvailableHeight * imgRatio;
      }

      // إضافة الصورة
      pdf.addImage(treeDataUrl, "PNG", (paperWidth - imgWidth) / 2, (paperHeight - imgHeight) / 2, imgWidth, imgHeight, undefined, "FAST");

      setProgress("جاري الحفظ...");
      setProgressPercent(95);

      const blob = pdf.output("blob");
      if (blob.size === 0) throw new Error("ملف PDF فارغ");

      downloadBlob(blob, `${treeTitle}-${size}.pdf`);

      setProgress("✅ تم التصدير بنجاح!");
      setProgressPercent(100);
      setTimeout(() => { setIsOpen(false); setProgress(""); setProgressPercent(0); }, 2000);

    } catch (error: any) {
      console.error("PDF Export Error:", error);
      setErrorMsg(`فشل التصدير: ${error.message}. جرب تصدير الصورة (PNG) بدلاً من ذلك.`);
      setProgress(`❌ حدث خطأ`);
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
    setErrorMsg("");
    setProgressPercent(0);
    setProgress("جاري إنشاء PNG...");

    try {
      const dataUrl = await exportTreeAsImage();
      if (!dataUrl || dataUrl.length < 1000) throw new Error("الصورة فارغة");

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      
      downloadBlob(blob, `${treeTitle}.png`);

      setProgress("✅ تم التصدير!");
      setProgressPercent(100);
      setTimeout(() => { setIsOpen(false); setProgress(""); setProgressPercent(0); }, 2000);
    } catch (error: any) {
      console.error("PNG Export Error:", error);
      setErrorMsg(`فشل التصدير: ${error.message}`);
      setProgress("❌ حدث خطأ");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="bg-gold-500 text-dark-bg px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gold-600 transition shadow-lg">
        <Download className="w-4 h-4" /> تصدير
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8">
            <div className="bg-dark-bg text-white p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Download className="w-5 h-5 text-gold-500" /> تصدير الشجرة
              </h2>
              <button onClick={() => setIsOpen(false)} disabled={isExporting} className="p-2 hover:bg-white/20 rounded-lg disabled:opacity-50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {isExporting ? (
                <div className="text-center py-8">
                  <Loader2 className="w-12 h-12 text-gold-500 animate-spin mx-auto mb-4" />
                  <p className="text-dark-bg font-bold mb-4">{progress}</p>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
                    <div className="bg-gold-500 h-3 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <p className="text-sm text-gray-500">{progressPercent}%</p>
                  <p className="text-xs text-gray-400 mt-4">⏱️ يرجى الانتظار، لا تغلق الصفحة.</p>
                </div>
              ) : (
                <>
                  {errorMsg && (
                    <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm font-bold">
                      {errorMsg}
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-bold text-dark-bg mb-3 flex items-center gap-2"><FileText className="w-5 h-5 text-red-600" /> تصدير PDF</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {(["A4", "A3", "A2", "A1", "A0"] as PaperSize[]).map((size) => (
                        <button key={size} onClick={() => exportPDF(size)} disabled={!isFontLoaded}
                          className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-lg font-bold hover:bg-red-100 transition disabled:opacity-50">
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="font-bold text-dark-bg mb-3 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-blue-600" /> تصدير صورة</h3>
                    <button onClick={exportPNG} disabled={!isFontLoaded}
                      className="w-full bg-blue-50 text-blue-700 border border-blue-200 px-4 py-3 rounded-lg font-bold hover:bg-blue-100 transition disabled:opacity-50">
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

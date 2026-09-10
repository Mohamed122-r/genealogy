"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, FileImage, FileText, FileType } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface TreeExporterProps {
  svgRef: React.RefObject<SVGSVGElement>;
  treeTitle?: string;
}

export function TreeExporter({ svgRef, treeTitle = "شجرة-النسب-العائلية" }: TreeExporterProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const exportToPNG = async () => {
    if (!svgRef.current) return;
    setIsExporting("png");
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(svgRef.current, {
        pixelRatio: 5,
        backgroundColor: "#FDFBF3",
        style: { transform: "none" },
      });
      const link = document.createElement("a");
      link.download = `${treeTitle}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "تم التصدير", description: "تم تصدير PNG عالي الدقة" });
    } catch (error) {
      toast({ title: "خطأ", description: "فشل تصدير PNG", variant: "destructive" });
    } finally {
      setIsExporting(null);
    }
  };

  const exportToSVG = () => {
    if (!svgRef.current) return;
    setIsExporting("svg");
    try {
      const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;
      svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      const svgData = new XMLSerializer().serializeToString(svgClone);
      const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${treeTitle}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      toast({ title: "تم التصدير", description: "تم تصدير SVG" });
    } catch (error) {
      toast({ title: "خطأ", description: "فشل تصدير SVG", variant: "destructive" });
    } finally {
      setIsExporting(null);
    }
  };

  const exportToPDF = async (size: 'A3' | 'A1' | 'A0') => {
    if (!svgRef.current) return;
    setIsExporting(size);
    try {
      const { jsPDF } = await import("jspdf");
      const { toSvg } = await import("html-to-image");
      const svgDataUrl = await toSvg(svgRef.current, {
        pixelRatio: 3, backgroundColor: "#FDFBF3", style: { transform: "none" }
      });

      const paperSizes = {
        A3: [420, 297], A1: [841, 594], A0: [1189, 841]
      };
      const [width, height] = paperSizes[size];
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [width, height] });
      doc.setFontSize(20);
      doc.text(treeTitle, width / 2, 20, { align: "center" });
      doc.addImage(svgDataUrl, "PNG", 10, 30, width - 20, height - 50, undefined, "FAST");
      doc.save(`${treeTitle}-${size}.pdf`);
      toast({ title: "تم التصدير", description: `تم تصدير PDF مقاس ${size}` });
    } catch (error) {
      toast({ title: "خطأ", description: `فشل تصدير PDF`, variant: "destructive" });
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={exportToSVG} disabled={isExporting !== null}>
        {isExporting === "svg" ? <Loader2 className="animate-spin" /> : <FileType className="w-4 h-4" />} SVG
      </Button>
      <Button variant="outline" onClick={exportToPNG} disabled={isExporting !== null}>
        {isExporting === "png" ? <Loader2 className="animate-spin" /> : <FileImage className="w-4 h-4" />} PNG
      </Button>
      <Button variant="outline" onClick={() => exportToPDF('A3')} disabled={isExporting !== null}>
        {isExporting === "A3" ? <Loader2 className="animate-spin" /> : <FileText className="w-4 h-4" />} PDF A3
      </Button>
      <Button variant="outline" onClick={() => exportToPDF('A1')} disabled={isExporting !== null}>
        {isExporting === "A1" ? <Loader2 className="animate-spin" /> : <FileText className="w-4 h-4" />} PDF A1
      </Button>
      <Button variant="outline" onClick={() => exportToPDF('A0')} disabled={isExporting !== null}>
        {isExporting === "A0" ? <Loader2 className="animate-spin" /> : <FileText className="w-4 h-4" />} PDF A0
      </Button>
    </div>
  );
}
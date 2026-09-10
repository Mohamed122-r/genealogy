"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { PersonNode } from "@/types/tree";
import { calculateTreeLayout } from "@/lib/tree/tree-layout";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Search, Download } from "lucide-react";
import { TreeLeaf } from "./TreeLeaf";
import { TreeBranch } from "./TreeBranch";

interface TreeCanvasProps {
  nodes: PersonNode[];
  selectedPersonId?: string;
  onSelectPerson: (id: string) => void;
  svgRef: React.RefObject<SVGSVGElement>;
  onExport?: (format: "svg" | "pdf" | "png") => void;
}

export function TreeCanvas({
  nodes,
  selectedPersonId,
  onSelectPerson,
  svgRef,
  onExport,
}: TreeCanvasProps) {
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 1000, height: 800 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // حساب مواقع العقد
  const layoutNodes = useMemo(() => {
    return calculateTreeLayout(nodes, { width: 1000, height: 800 });
  }, [nodes]);

  // أبعاد الشجرة الكلية
  const treeBounds = useMemo(() => {
    if (layoutNodes.length === 0) return { minX: 0, minY: 0, maxX: 1000, maxY: 800 };

    const minX = Math.min(...layoutNodes.map((n) => n.x - n.width / 2));
    const maxX = Math.max(...layoutNodes.map((n) => n.x + n.width / 2));
    const minY = Math.min(...layoutNodes.map((n) => n.y - n.height / 2));
    const maxY = Math.max(...layoutNodes.map((n) => n.y + n.height / 2));

    return { minX, minY, maxX, maxY };
  }, [layoutNodes]);

  // إعادة ضبط العرض عند التغيير
  useEffect(() => {
    const padding = 100;
    setViewBox({
      x: treeBounds.minX - padding,
      y: treeBounds.minY - padding,
      width: treeBounds.maxX - treeBounds.minX + padding * 2,
      height: treeBounds.maxY - treeBounds.minY + padding * 2,
    });
  }, [treeBounds]);

  // التكبير والتصغير
  const handleZoom = (direction: "in" | "out") => {
    setZoomLevel((prev) => {
      const next = direction === "in" ? prev * 1.2 : prev / 1.2;
      return Math.min(5, Math.max(0.5, next));
    });
  };

  // البحث
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      const found = layoutNodes.find((node) =>
        node.fullName.includes(term.trim())
      );
      if (found) {
        setViewBox((prev) => ({
          ...prev,
          x: found.x - prev.width / 2,
          y: found.y - prev.height / 2,
        }));
        onSelectPerson(found.id);
      }
    }
  };

  // إعادة الضبط
  const resetView = () => {
    const padding = 100;
    setZoomLevel(1);
    setViewBox({
      x: treeBounds.minX - padding,
      y: treeBounds.minY - padding,
      width: treeBounds.maxX - treeBounds.minX + padding * 2,
      height: treeBounds.maxY - treeBounds.minY + padding * 2,
    });
  };

  // التحريك بالماوس
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setStartPan({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - startPan.x;
    const dy = e.clientY - startPan.y;

    setViewBox((prev) => ({
      ...prev,
      x: prev.x - dx * (prev.width / (svgRef.current?.clientWidth || 1)),
      y: prev.y - dy * (prev.height / (svgRef.current?.clientHeight || 1)),
    }));
    setStartPan({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsPanning(false);

  // دعم اللمس
  const touchStartRef = useRef({ x: 0, y: 0, dist: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsPanning(true);
      setStartPan({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartRef.current = { x: 0, y: 0, dist };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isPanning) {
      handleMouseMove(e.touches[0] as any);
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (touchStartRef.current.dist > 0) {
        handleZoom(dist > touchStartRef.current.dist ? "in" : "out");
      }
      touchStartRef.current.dist = dist;
    }
  };

  // ملء الشاشة
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      svgRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="w-full h-[600px] md:h-[800px] bg-[#FDFBF3] relative overflow-hidden rounded-2xl">
      {/* إطار ذهبي */}
      <div className="absolute inset-0 border-4 border-[#C9A227]/20 pointer-events-none z-10 rounded-2xl"></div>

      {/* شريط الأدوات الأيمن */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 bg-[#0A1711]/95 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-[#C9A227]/30">
        <button
          onClick={() => handleZoom("in")}
          className="p-2 text-white hover:bg-[#C9A227] hover:text-[#0A1711] rounded-xl transition-all duration-200"
          title="تكبير"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleZoom("out")}
          className="p-2 text-white hover:bg-[#C9A227] hover:text-[#0A1711] rounded-xl transition-all duration-200"
          title="تصغير"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={resetView}
          className="p-2 text-white hover:bg-[#C9A227] hover:text-[#0A1711] rounded-xl transition-all duration-200"
          title="إعادة ضبط"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-2 text-white hover:bg-[#C9A227] hover:text-[#0A1711] rounded-xl transition-all duration-200"
          title="ملء الشاشة"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
        {onExport && (
          <button
            onClick={() => onExport("png")}
            className="p-2 text-white hover:bg-[#C9A227] hover:text-[#0A1711] rounded-xl transition-all duration-200"
            title="تصدير"
          >
            <Download className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* شريط البحث الأيسر */}
      <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-2 flex items-center gap-2 w-64 border border-[#C9A227]/30">
        <Search className="w-4 h-4 text-[#C9A227]" />
        <input
          type="text"
          placeholder="ابحث عن شخص..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="bg-transparent outline-none w-full text-sm text-[#0A1711] placeholder:text-gray-400"
        />
      </div>

      {/* لوحة الرسم SVG */}
      <div
        className={`flex-1 h-full overflow-hidden ${
          isPanning ? "cursor-grabbing" : "cursor-grab"
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      >
        <div
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: "center",
            transition: "transform 0.3s ease-out",
          }}
          className="w-full h-full"
        >
          <svg
            ref={svgRef}
            viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
            className="w-full h-full"
          >
            {/* الخلفية */}
            <defs>
              <pattern
                id="heritagePattern"
                x="0"
                y="0"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 20 0 L 20 40 M 0 20 L 40 20"
                  stroke="#e5e0d0"
                  strokeWidth="0.5"
                  fill="none"
                  opacity="0.5"
                />
              </pattern>
              {/* تدرج ذهبي */}
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C9A227" />
                <stop offset="50%" stopColor="#F5E6A1" />
                <stop offset="100%" stopColor="#C9A227" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#heritagePattern)" />

            {/* الجذع التراثي */}
            <path
              d={`M ${(treeBounds.minX + treeBounds.maxX) / 2} ${
                treeBounds.maxY + 100
              } 
                 C ${(treeBounds.minX + treeBounds.maxX) / 2} ${
                treeBounds.maxY - 100
              }, 
                   ${treeBounds.minX - 50} ${treeBounds.maxY - 200}, 
                   ${treeBounds.minX - 50} ${treeBounds.minY - 50}`}
              stroke="#5D3A1A"
              strokeWidth="20"
              fill="none"
              strokeLinecap="round"
              opacity="0.9"
            />

            {/* رسم الفروع */}
            {layoutNodes.map((node) => {
              const children = layoutNodes.filter(
                (child) => child.fatherId === node.id
              );
              return children.map((child) => (
                <TreeBranch
                  key={`${node.id}-${child.id}`}
                  parent={node}
                  child={child}
                />
              ));
            })}

            {/* رسم الأوراق (الأشخاص) */}
            {layoutNodes.map((node) => (
              <TreeLeaf
                key={node.id}
                node={node}
                isSelected={selectedPersonId === node.id}
                onClick={() => onSelectPerson(node.id)}
              />
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
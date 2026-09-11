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
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 1200, height: 1000 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [zoomLevel, setZoomLevel] = useState(1);

  // حساب مواقع العقد
  const layoutNodes = useMemo(() => {
    return calculateTreeLayout(nodes, { width: 1200, height: 1000 });
  }, [nodes]);

  // أبعاد الشجرة الكلية
  const treeBounds = useMemo(() => {
    if (layoutNodes.length === 0) return { minX: 0, minY: 0, maxX: 1200, maxY: 1000 };

    const minX = Math.min(...layoutNodes.map((n) => n.x - n.width / 2));
    const maxX = Math.max(...layoutNodes.map((n) => n.x + n.width / 2));
    const minY = Math.min(...layoutNodes.map((n) => n.y - n.height / 2));
    const maxY = Math.max(...layoutNodes.map((n) => n.y + n.height / 2));

    return { minX, minY, maxX, maxY };
  }, [layoutNodes]);

  // إعادة ضبط العرض
  useEffect(() => {
    const padding = 150;
    setViewBox({
      x: treeBounds.minX - padding,
      y: treeBounds.minY - padding,
      width: treeBounds.maxX - treeBounds.minX + padding * 2,
      height: treeBounds.maxY - treeBounds.minY + padding * 2,
    });
  }, [treeBounds]);

  const handleZoom = (direction: "in" | "out") => {
    setZoomLevel((prev) => {
      const next = direction === "in" ? prev * 1.2 : prev / 1.2;
      return Math.min(5, Math.max(0.5, next));
    });
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      const found = layoutNodes.find((node) => node.fullName.includes(term.trim()));
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

  const resetView = () => {
    const padding = 150;
    setZoomLevel(1);
    setViewBox({
      x: treeBounds.minX - padding,
      y: treeBounds.minY - padding,
      width: treeBounds.maxX - treeBounds.minX + padding * 2,
      height: treeBounds.maxY - treeBounds.minY + padding * 2,
    });
  };

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

  // حساب مواقع الجذور لرسم الجذع
  const rootX = layoutNodes.length > 0 
    ? (Math.min(...layoutNodes.map(n => n.x)) + Math.max(...layoutNodes.map(n => n.x))) / 2
    : 600;
  const rootY = treeBounds.maxY + 100;

  return (
    <div className="w-full h-[600px] md:h-[800px] bg-[#FDFBF3] relative overflow-hidden rounded-2xl">
      {/* الإطار الذهبي المزخرف */}
      <div className="absolute inset-0 pointer-events-none z-10 m-2">
        <svg width="100%" height="100%" className="w-full h-full">
          <defs>
            <linearGradient id="goldFrame" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C9A227" />
              <stop offset="50%" stopColor="#F5E6A1" />
              <stop offset="100%" stopColor="#C9A227" />
            </linearGradient>
          </defs>
          <rect
            x="5"
            y="5"
            width="calc(100% - 10px)"
            height="calc(100% - 10px)"
            fill="none"
            stroke="url(#goldFrame)"
            strokeWidth="3"
            rx="20"
          />
        </svg>
      </div>

      {/* شريط الأدوات الأيمن */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 bg-dark-bg/95 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-gold-500/30">
        <button
          onClick={() => handleZoom("in")}
          className="p-2 text-white hover:bg-gold-500 hover:text-dark-bg rounded-xl transition-all"
          title="تكبير"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleZoom("out")}
          className="p-2 text-white hover:bg-gold-500 hover:text-dark-bg rounded-xl transition-all"
          title="تصغير"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={resetView}
          className="p-2 text-white hover:bg-gold-500 hover:text-dark-bg rounded-xl transition-all"
          title="إعادة ضبط"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          onClick={() => svgRef.current?.requestFullscreen()}
          className="p-2 text-white hover:bg-gold-500 hover:text-dark-bg rounded-xl transition-all"
          title="ملء الشاشة"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
        {onExport && (
          <button
            onClick={() => onExport("png")}
            className="p-2 text-white hover:bg-gold-500 hover:text-dark-bg rounded-xl transition-all"
            title="تصدير"
          >
            <Download className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* البحث */}
      <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-2 flex items-center gap-2 w-64 border border-gold-500/30">
        <Search className="w-4 h-4 text-gold-500" />
        <input
          type="text"
          placeholder="ابحث عن شخص..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="bg-transparent outline-none w-full text-sm text-dark-bg placeholder:text-gray-400"
        />
      </div>

      {/* لوحة الرسم SVG */}
      <div
        className={`flex-1 h-full overflow-hidden ${isPanning ? "cursor-grabbing" : "cursor-grab"}`}
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
            {/* خلفية تراثية */}
            <defs>
              <pattern id="heritageBg" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 30 60 M 0 30 L 60 30" stroke="#e8dfc8" strokeWidth="0.5" fill="none" opacity="0.6" />
                <circle cx="30" cy="30" r="2" fill="#e8dfc8" opacity="0.4" />
              </pattern>
              <radialGradient id="treeGlow" cx="50%" cy="80%" r="60%">
                <stop offset="0%" stopColor="#C9A227" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#C9A227" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="trunkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4A2810" />
                <stop offset="50%" stopColor="#6B3E1E" />
                <stop offset="100%" stopColor="#4A2810" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="#FDFBF3" />
            <rect width="100%" height="100%" fill="url(#heritageBg)" />
            <rect width="100%" height="100%" fill="url(#treeGlow)" />

            {/* ===== الجذع الرئيسي ===== */}
            <path
              d={`M ${rootX - 80} ${rootY} 
                 C ${rootX - 60} ${rootY - 100}, ${rootX - 50} ${rootY - 200}, ${rootX - 30} ${rootY - 300}
                 L ${rootX + 30} ${rootY - 300}
                 C ${rootX + 50} ${rootY - 200}, ${rootX + 60} ${rootY - 100}, ${rootX + 80} ${rootY}
                 Z`}
              fill="url(#trunkGradient)"
              stroke="#3D1F0A"
              strokeWidth="2"
            />

            {/* خطوط الجذع التفصيلية */}
            <path
              d={`M ${rootX - 40} ${rootY - 50} C ${rootX - 20} ${rootY - 150}, ${rootX - 10} ${rootY - 250}, ${rootX} ${rootY - 290}`}
              fill="none"
              stroke="#3D1F0A"
              strokeWidth="1"
              opacity="0.6"
            />
            <path
              d={`M ${rootX + 40} ${rootY - 50} C ${rootX + 20} ${rootY - 150}, ${rootX + 10} ${rootY - 250}, ${rootX} ${rootY - 290}`}
              fill="none"
              stroke="#3D1F0A"
              strokeWidth="1"
              opacity="0.6"
            />

            {/* ===== الأغصان الرئيسية (رسم بيزير) ===== */}
            {layoutNodes.map((node) => {
              const children = layoutNodes.filter((child) => child.fatherId === node.id);
              return children.map((child) => (
                <TreeBranch
                  key={`${node.id}-${child.id}`}
                  parent={node}
                  child={child}
                />
              ));
            })}

            {/* ===== الأوراق (الأشخاص) ===== */}
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

      {/* عداد الأشخاص */}
      <div className="absolute bottom-4 right-4 z-20 bg-dark-bg/90 backdrop-blur-md text-white px-4 py-2 rounded-xl shadow-xl border border-gold-500/30">
        <span className="text-xs text-gold-500">إجمالي الأشخاص:</span>
        <span className="font-bold mr-2 text-lg">{layoutNodes.length}</span>
      </div>
    </div>
  );
}

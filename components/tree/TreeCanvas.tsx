"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { PersonNode, LayoutNode } from "@/types/tree";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Search } from "lucide-react";

interface TreeCanvasProps {
  nodes: PersonNode[];
  selectedPersonId?: string;
  onSelectPerson: (id: string) => void;
  svgRef: React.RefObject<SVGSVGElement>;
  onExport?: (format: "svg" | "pdf" | "png") => void;
}

// =====================================================
// خوارزمية تخطيط شجرة بشكل حقيقي
// =====================================================
const LEAF_WIDTH = 80;
const LEAF_HEIGHT = 45;
const GENERATION_HEIGHT = 220; // المسافة بين الأجيال
const SIBLING_SPACING = 130;   // المسافة بين الأخوة

function calculateRealisticLayout(nodes: PersonNode[]): LayoutNode[] {
  if (nodes.length === 0) return [];

  const roots = nodes.filter((n) => !n.fatherId);
  if (roots.length === 0) return [];

  const layout: LayoutNode[] = [];

  // حساب عمق كل شخص
  function getDepth(person: PersonNode, d: number = 0): number {
    const children = nodes.filter((n) => n.fatherId === person.id);
    if (children.length === 0) return d;
    return Math.max(...children.map((c) => getDepth(c, d + 1)));
  }

  const maxDepth = Math.max(...roots.map((r) => getDepth(r)));

  // دالة توزيع العقد (Recursive)
  function layoutSubtree(person: PersonNode, depth: number, leftBound: number): number {
    const children = nodes.filter((n) => n.fatherId === person.id);

    const node: LayoutNode = {
      ...person,
      x: 0,
      y: (maxDepth - depth) * GENERATION_HEIGHT,
      width: LEAF_WIDTH,
      height: LEAF_HEIGHT,
      depth,
    };

    if (children.length === 0) {
      node.x = leftBound + SIBLING_SPACING / 2;
      layout.push(node);
      return node.x;
    }

    let currentLeft = leftBound;
    const childPositions: number[] = [];

    children.forEach((child) => {
      const childX = layoutSubtree(child, depth + 1, currentLeft);
      childPositions.push(childX);
      currentLeft = childX + SIBLING_SPACING / 2;
    });

    // الأب يقع بين أقصى اليسار وأقصى اليمين من الأبناء
    node.x = (childPositions[0] + childPositions[childPositions.length - 1]) / 2;
    layout.push(node);

    return node.x;
  }

  let globalLeft = 0;
  roots.forEach((root) => {
    const rootX = layoutSubtree(root, 0, globalLeft);
    globalLeft = rootX + SIBLING_SPACING;
  });

  return layout;
}

// =====================================================
// المكون الرئيسي
// =====================================================
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

  const layoutNodes = useMemo(() => calculateRealisticLayout(nodes), [nodes]);

  const treeBounds = useMemo(() => {
    if (layoutNodes.length === 0) return { minX: 0, minY: 0, maxX: 1200, maxY: 1000 };
    const minX = Math.min(...layoutNodes.map((n) => n.x - LEAF_WIDTH / 2));
    const maxX = Math.max(...layoutNodes.map((n) => n.x + LEAF_WIDTH / 2));
    const minY = Math.min(...layoutNodes.map((n) => n.y - LEAF_HEIGHT / 2));
    const maxY = Math.max(...layoutNodes.map((n) => n.y + LEAF_HEIGHT / 2));
    return { minX, minY, maxX, maxY };
  }, [layoutNodes]);

  useEffect(() => {
    const padding = 200;
    setViewBox({
      x: treeBounds.minX - padding,
      y: treeBounds.minY - padding,
      width: treeBounds.maxX - treeBounds.minX + padding * 2,
      height: treeBounds.maxY - treeBounds.minY + padding * 3,
    });
  }, [treeBounds]);

  const handleZoom = (direction: "in" | "out") => {
    setZoomLevel((prev) => Math.min(5, Math.max(0.5, direction === "in" ? prev * 1.2 : prev / 1.2)));
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
    const padding = 200;
    setZoomLevel(1);
    setViewBox({
      x: treeBounds.minX - padding,
      y: treeBounds.minY - padding,
      width: treeBounds.maxX - treeBounds.minX + padding * 2,
      height: treeBounds.maxY - treeBounds.minY + padding * 3,
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
    if (e.touches.length === 1 && isPanning) handleMouseMove(e.touches[0] as any);
    else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (touchStartRef.current.dist > 0) handleZoom(dist > touchStartRef.current.dist ? "in" : "out");
      touchStartRef.current.dist = dist;
    }
  };

  // ===== رسم الجذع الرئيسي =====
  const treeCenterX = (treeBounds.minX + treeBounds.maxX) / 2;
  const trunkBottomY = treeBounds.maxY + 80;
  const trunkTopY = treeBounds.maxY - 50;

  // ===== رسم الفروع =====
  const renderBranches = () => {
    return layoutNodes.flatMap((node) => {
      const children = layoutNodes.filter((child) => child.fatherId === node.id);
      return children.map((child) => {
        const startX = node.x;
        const startY = node.y + LEAF_HEIGHT / 2;
        const endX = child.x;
        const endY = child.y - LEAF_HEIGHT / 2;
        const midY = (startY + endY) / 2;

        const path = `M ${startX} ${startY}
                     C ${startX} ${midY},
                       ${endX} ${midY},
                       ${endX} ${endY}`;

        return (
          <g key={`${node.id}-${child.id}`}>
            {/* ظل الفرع */}
            <path d={path} fill="none" stroke="#3D1F0A" strokeWidth={5} strokeLinecap="round" opacity={0.15} transform="translate(2,2)" />
            {/* الفرع الرئيسي */}
            <path d={path} fill="none" stroke="#6B3E1E" strokeWidth={3.5} strokeLinecap="round" />
            {/* إضاءة الفرع */}
            <path d={path} fill="none" stroke="#8B5A2B" strokeWidth={1.5} strokeLinecap="round" opacity={0.6} />
          </g>
        );
      });
    });
  };

  // ===== رسم الأوراق =====
  const getLeafColor = (status: string) => {
    switch (status) {
      case "ALIVE": return { fill: "#4A8B3F", stroke: "#2D5A24", vein: "#1F4218" };
      case "DECEASED": return { fill: "#D4A017", stroke: "#8B6B0F", vein: "#6B4F0A" };
      case "DISCONNECTED": return { fill: "#8B7355", stroke: "#5D4A2E", vein: "#4A3A22" };
      default: return { fill: "#A8A8A8", stroke: "#707070", vein: "#505050" };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ALIVE": return "حي";
      case "DECEASED": return "متوفى";
      case "DISCONNECTED": return "منقطع";
      default: return "؟";
    }
  };

  const truncateName = (name: string, max: number = 14) => {
    if (name.length <= max) return name;
    return name.substring(0, max - 2) + "..";
  };

  const renderLeaves = () => {
    return layoutNodes.map((node) => {
      const colors = getLeafColor(node.status);
      const isSelected = selectedPersonId === node.id;

      return (
        <g
          key={node.id}
          transform={`translate(${node.x - LEAF_WIDTH / 2}, ${node.y - LEAF_HEIGHT / 2})`}
          className="cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onSelectPerson(node.id); }}
          style={{
            filter: isSelected
              ? "drop-shadow(0 0 15px #FFD700) drop-shadow(0 0 5px #C9A227)"
              : "drop-shadow(0 3px 4px rgba(0,0,0,0.25))",
          }}
        >
          {/* شكل الورقة */}
          <path
            d={`M ${LEAF_WIDTH / 2} 2
               C ${LEAF_WIDTH * 0.9} ${LEAF_HEIGHT * 0.2},
                 ${LEAF_WIDTH - 2} ${LEAF_HEIGHT * 0.5},
                 ${LEAF_WIDTH / 2} ${LEAF_HEIGHT - 2}
               C 2 ${LEAF_HEIGHT * 0.5},
                 ${LEAF_WIDTH * 0.1} ${LEAF_HEIGHT * 0.2},
                 ${LEAF_WIDTH / 2} 2 Z`}
            fill={colors.fill}
            stroke={isSelected ? "#FFD700" : colors.stroke}
            strokeWidth={isSelected ? 3 : 1.5}
          />
          {/* عرق مركزي */}
          <path
            d={`M ${LEAF_WIDTH / 2} 6 L ${LEAF_WIDTH / 2} ${LEAF_HEIGHT - 6}`}
            stroke={colors.vein}
            strokeWidth="1"
            opacity="0.6"
          />
          {/* الاسم */}
          <text
            x={LEAF_WIDTH / 2}
            y={LEAF_HEIGHT / 2 - 1}
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="9.5"
            fontWeight="bold"
            style={{ fontFamily: "Amiri, serif", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
            className="select-none pointer-events-none"
          >
            {truncateName(node.fullName, 14)}
          </text>
          {/* الحالة */}
          <text
            x={LEAF_WIDTH / 2}
            y={LEAF_HEIGHT / 2 + 11}
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="7"
            opacity="0.85"
            style={{ fontFamily: "Cairo, sans-serif" }}
            className="select-none pointer-events-none"
          >
            {getStatusLabel(node.status)}
          </text>
        </g>
      );
    });
  };

  return (
    <div className="w-full h-[600px] md:h-[800px] bg-[#FDFBF3] relative overflow-hidden rounded-2xl">
      {/* الإطار الذهبي */}
      <div className="absolute inset-0 border-4 border-gold-500/30 pointer-events-none z-10 rounded-2xl m-2" />

      {/* شريط الأدوات */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 bg-dark-bg/95 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-gold-500/30">
        <button onClick={() => handleZoom("in")} className="p-2 text-white hover:bg-gold-500 hover:text-dark-bg rounded-xl transition-all" title="تكبير">
          <ZoomIn className="w-5 h-5" />
        </button>
        <button onClick={() => handleZoom("out")} className="p-2 text-white hover:bg-gold-500 hover:text-dark-bg rounded-xl transition-all" title="تصغير">
          <ZoomOut className="w-5 h-5" />
        </button>
        <button onClick={resetView} className="p-2 text-white hover:bg-gold-500 hover:text-dark-bg rounded-xl transition-all" title="إعادة ضبط">
          <RotateCcw className="w-5 h-5" />
        </button>
        <button onClick={() => svgRef.current?.requestFullscreen()} className="p-2 text-white hover:bg-gold-500 hover:text-dark-bg rounded-xl transition-all" title="ملء الشاشة">
          <Maximize2 className="w-5 h-5" />
        </button>
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

      {/* منطقة الرسم */}
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
            {/* الخلفية */}
            <defs>
              <pattern id="heritageBg" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 25 0 L 25 50 M 0 25 L 50 25" stroke="#e8dfc8" strokeWidth="0.5" fill="none" opacity="0.5" />
              </pattern>
              <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3D1F0A" />
                <stop offset="50%" stopColor="#6B3E1E" />
                <stop offset="100%" stopColor="#3D1F0A" />
              </linearGradient>
              <radialGradient id="treeGlow" cx="50%" cy="70%" r="50%">
                <stop offset="0%" stopColor="#C9A227" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#C9A227" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="#FDFBF3" />
            <rect width="100%" height="100%" fill="url(#heritageBg)" />
            <rect width="100%" height="100%" fill="url(#treeGlow)" />

            {/* ===== الجذع الرئيسي (شكل عضوي) ===== */}
            <path
              d={`M ${treeCenterX - 90} ${trunkBottomY}
                 C ${treeCenterX - 70} ${trunkBottomY - 60},
                   ${treeCenterX - 40} ${trunkTopY - 40},
                   ${treeCenterX - 35} ${trunkTopY}
                 L ${treeCenterX + 35} ${trunkTopY}
                 C ${treeCenterX + 40} ${trunkTopY - 40},
                   ${treeCenterX + 70} ${trunkBottomY - 60},
                   ${treeCenterX + 90} ${trunkBottomY}
                 Z`}
              fill="url(#trunkGrad)"
              stroke="#2A1506"
              strokeWidth="2"
            />

            {/* خطوط الجذع للتفاصيل */}
            <path
              d={`M ${treeCenterX - 50} ${trunkBottomY - 20}
                 C ${treeCenterX - 30} ${trunkBottomY - 100},
                   ${treeCenterX - 20} ${trunkTopY + 40},
                   ${treeCenterX - 15} ${trunkTopY}`}
              stroke="#2A1506"
              strokeWidth="1.5"
              fill="none"
              opacity="0.5"
            />
            <path
              d={`M ${treeCenterX + 50} ${trunkBottomY - 20}
                 C ${treeCenterX + 30} ${trunkBottomY - 100},
                   ${treeCenterX + 20} ${trunkTopY + 40},
                   ${treeCenterX + 15} ${trunkTopY}`}
              stroke="#2A1506"
              strokeWidth="1.5"
              fill="none"
              opacity="0.5"
            />

            {/* ===== الفروع ===== */}
            {renderBranches()}

            {/* ===== الأوراق ===== */}
            {renderLeaves()}
          </svg>
        </div>
      </div>

      {/* عداد */}
      <div className="absolute bottom-4 right-4 z-20 bg-dark-bg/90 backdrop-blur-md text-white px-4 py-2 rounded-xl shadow-xl border border-gold-500/30">
        <span className="text-xs text-gold-500">الأشخاص:</span>
        <span className="font-bold mr-2 text-lg">{layoutNodes.length}</span>
      </div>
    </div>
  );
}

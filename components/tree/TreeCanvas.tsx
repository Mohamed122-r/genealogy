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
// الإعدادات
// =====================================================
const LEAF_WIDTH = 90;
const LEAF_HEIGHT = 50;
const GENERATION_HEIGHT = 200;
const SIBLING_SPACING = 140;

// =====================================================
// خوارزمية تخطيط الشجرة بشكل طبيعي
// =====================================================
function calculateRealisticLayout(nodes: PersonNode[]): LayoutNode[] {
  if (nodes.length === 0) return [];
  const roots = nodes.filter((n) => !n.fatherId);
  if (roots.length === 0) return [];

  const layout: LayoutNode[] = [];

  function getDepth(person: PersonNode, d: number = 0): number {
    const children = nodes.filter((n) => n.fatherId === person.id);
    if (children.length === 0) return d;
    return Math.max(...children.map((c) => getDepth(c, d + 1)));
  }

  const maxDepth = Math.max(...roots.map((r) => getDepth(r)));

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
// ألوان الأوراق
// =====================================================
function getLeafColors(status: string) {
  switch (status) {
    case "ALIVE":
      return { fill: "#4A8B3F", fillDark: "#2D5A24", stroke: "#1F4218", vein: "#1A3814" };
    case "DECEASED":
      return { fill: "#D4A017", fillDark: "#A87B0F", stroke: "#8B6B0F", vein: "#6B4F0A" };
    case "DISCONNECTED":
      return { fill: "#8B7355", fillDark: "#5D4A2E", stroke: "#4A3A22", vein: "#3A2E1A" };
    default:
      return { fill: "#A8A8A8", fillDark: "#808080", stroke: "#707070", vein: "#505050" };
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "ALIVE": return "حي";
    case "DECEASED": return "متوفى";
    case "DISCONNECTED": return "منقطع";
    default: return "؟";
  }
}

function truncateName(name: string, max: number = 14) {
  if (name.length <= max) return name;
  return name.substring(0, max - 2) + "..";
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

  // ===== إحداثيات الجذع =====
  const centerX = (treeBounds.minX + treeBounds.maxX) / 2;
  const maxY = treeBounds.maxY;
  const minY = treeBounds.minY;

  // الجذع يبدأ من المنتصف السفلي ويمتد لأعلى
  const trunkBaseY = maxY + 60;
  const trunkMidY = maxY - 100; // منتصف الجذع
  const trunkTopY = minY + 50;  // قمة الجذع
  const trunkBaseWidth = 120;
  const trunkMidWidth = 70;

  // ===== رسم الجذع العضوي =====
  const renderTrunk = () => (
    <g>
      {/* ظل الجذع */}
      <path
        d={`M ${centerX - trunkBaseWidth / 2 + 4} ${trunkBaseY + 4}
           C ${centerX - trunkMidWidth / 2} ${trunkMidY},
             ${centerX - 30} ${trunkTopY + 100},
             ${centerX - 35} ${trunkTopY + 4}
           L ${centerX + 35} ${trunkTopY + 4}
           C ${centerX + 30} ${trunkTopY + 100},
             ${centerX + trunkMidWidth / 2} ${trunkMidY},
             ${centerX + trunkBaseWidth / 2 + 4} ${trunkBaseY + 4}`}
        fill="#2A1506"
        opacity="0.25"
      />

      {/* الجذع الرئيسي */}
      <path
        d={`M ${centerX - trunkBaseWidth / 2} ${trunkBaseY}
           C ${centerX - trunkMidWidth / 2} ${trunkMidY},
             ${centerX - 30} ${trunkTopY + 100},
             ${centerX - 35} ${trunkTopY}
           L ${centerX + 35} ${trunkTopY}
           C ${centerX + 30} ${trunkTopY + 100},
             ${centerX + trunkMidWidth / 2} ${trunkMidY},
             ${centerX + trunkBaseWidth / 2} ${trunkBaseY} Z`}
        fill="url(#trunkGrad)"
        stroke="#2A1506"
        strokeWidth="2"
      />

      {/* خطوط الجذع الداخلية (تفاصيل) */}
      <path
        d={`M ${centerX - 40} ${trunkBaseY - 20}
           C ${centerX - 30} ${trunkMidY + 40},
             ${centerX - 15} ${trunkTopY + 150},
             ${centerX - 20} ${trunkTopY + 20}`}
        stroke="#2A1506"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
      />
      <path
        d={`M ${centerX + 40} ${trunkBaseY - 20}
           C ${centerX + 30} ${trunkMidY + 40},
             ${centerX + 15} ${trunkTopY + 150},
             ${centerX + 20} ${trunkTopY + 20}`}
        stroke="#2A1506"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
      />
      <path
        d={`M ${centerX} ${trunkBaseY - 10} L ${centerX} ${trunkTopY + 20}`}
        stroke="#2A1506"
        strokeWidth="1"
        fill="none"
        opacity="0.3"
      />
    </g>
  );

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
            <path d={path} fill="none" stroke="#3D1F0A" strokeWidth={5} strokeLinecap="round" opacity={0.15} transform="translate(2,2)" />
            <path d={path} fill="none" stroke="#6B3E1E" strokeWidth={3.5} strokeLinecap="round" />
            <path d={path} fill="none" stroke="#8B5A2B" strokeWidth={1.5} strokeLinecap="round" opacity={0.5} />
          </g>
        );
      });
    });
  };

  // ===== رسم الأوراق =====
  const renderLeaves = () => {
    return layoutNodes.map((node) => {
      const colors = getLeafColors(node.status);
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
              : "drop-shadow(0 4px 6px rgba(0,0,0,0.25))",
            transition: "filter 0.3s ease",
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
          {/* تدرج داخلي */}
          <path
            d={`M ${LEAF_WIDTH / 2} 8
               C ${LEAF_WIDTH * 0.75} ${LEAF_HEIGHT * 0.3},
                 ${LEAF_WIDTH * 0.85} ${LEAF_HEIGHT * 0.5},
                 ${LEAF_WIDTH / 2} ${LEAF_HEIGHT - 8}`}
            fill={colors.fillDark}
            opacity="0.4"
          />
          {/* عرق مركزي */}
          <path
            d={`M ${LEAF_WIDTH / 2} 6 L ${LEAF_WIDTH / 2} ${LEAF_HEIGHT - 6}`}
            stroke={colors.vein}
            strokeWidth="1.2"
            opacity="0.7"
          />
          {/* عروق جانبية */}
          {[0.3, 0.5, 0.7].map((ratio, i) => (
            <g key={i}>
              <path
                d={`M ${LEAF_WIDTH / 2} ${LEAF_HEIGHT * ratio} L ${LEAF_WIDTH * 0.8} ${LEAF_HEIGHT * (ratio - 0.08)}`}
                stroke={colors.vein}
                strokeWidth="0.7"
                opacity="0.5"
              />
              <path
                d={`M ${LEAF_WIDTH / 2} ${LEAF_HEIGHT * ratio} L ${LEAF_WIDTH * 0.2} ${LEAF_HEIGHT * (ratio - 0.08)}`}
                stroke={colors.vein}
                strokeWidth="0.7"
                opacity="0.5"
              />
            </g>
          ))}
          {/* الاسم */}
          <text
            x={LEAF_WIDTH / 2}
            y={LEAF_HEIGHT / 2 - 2}
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="11"
            fontWeight="bold"
            style={{ fontFamily: "Amiri, serif", textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
            className="select-none pointer-events-none"
          >
            {truncateName(node.fullName, 14)}
          </text>
          {/* الحالة */}
          <text
            x={LEAF_WIDTH / 2}
            y={LEAF_HEIGHT / 2 + 12}
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="8"
            opacity="0.9"
            style={{ fontFamily: "Cairo, sans-serif", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
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
      {/* الإطار الذهبي المزدوج */}
      <div className="absolute inset-0 pointer-events-none z-10 m-3">
        <div className="absolute inset-0 border-2 border-gold-500/40 rounded-2xl" />
        <div className="absolute inset-2 border border-gold-500/20 rounded-xl" />
      </div>

      {/* شريط الأدوات */}
      <div className="absolute top-6 right-6 z-20 flex flex-col gap-2 bg-dark-bg/95 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-gold-500/30">
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
      <div className="absolute top-6 left-6 z-20 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-2 flex items-center gap-2 w-64 border border-gold-500/30">
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
            {/* ===== الخلفية الاحترافية ===== */}
            <defs>
              {/* تدرج ذهبي للخلفية */}
              <radialGradient id="bgGradient" cx="50%" cy="30%" r="80%">
                <stop offset="0%" stopColor="#FFFDF5" />
                <stop offset="50%" stopColor="#FDFBF3" />
                <stop offset="100%" stopColor="#F5EFE0" />
              </radialGradient>

              {/* زخرفة إسلامية */}
              <pattern id="islamicPattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M40 0 L80 40 L40 80 L0 40 Z" fill="none" stroke="#C9A227" strokeWidth="0.4" opacity="0.15" />
                <circle cx="40" cy="40" r="20" fill="none" stroke="#C9A227" strokeWidth="0.4" opacity="0.12" />
                <circle cx="40" cy="40" r="3" fill="#C9A227" opacity="0.15" />
              </pattern>

              {/* تدرج الجذع */}
              <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3D1F0A" />
                <stop offset="30%" stopColor="#6B3E1E" />
                <stop offset="50%" stopColor="#8B5A2B" />
                <stop offset="70%" stopColor="#6B3E1E" />
                <stop offset="100%" stopColor="#3D1F0A" />
              </linearGradient>

              {/* توهج خلفي */}
              <radialGradient id="glow" cx="50%" cy="70%" r="50%">
                <stop offset="0%" stopColor="#C9A227" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#C9A227" stopOpacity="0" />
              </radialGradient>

              {/* فلتر الظل */}
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.15" />
              </filter>
            </defs>

            {/* الخلفية */}
            <rect width="100%" height="100%" fill="url(#bgGradient)" />
            <rect width="100%" height="100%" fill="url(#islamicPattern)" />
            <rect width="100%" height="100%" fill="url(#glow)" />

            {/* شمس خفيفة في الأعلى */}
            <circle cx={centerX} cy={minY - 100} r="200" fill="#C9A227" opacity="0.04" />

            {/* ===== الجذع ===== */}
            {renderTrunk()}

            {/* ===== الفروع ===== */}
            {renderBranches()}

            {/* ===== الأوراق ===== */}
            {renderLeaves()}
          </svg>
        </div>
      </div>

      {/* عداد */}
      <div className="absolute bottom-6 right-6 z-20 bg-dark-bg/90 backdrop-blur-md text-white px-4 py-2 rounded-xl shadow-xl border border-gold-500/30">
        <span className="text-xs text-gold-500">الأشخاص:</span>
        <span className="font-bold mr-2 text-lg">{layoutNodes.length}</span>
      </div>
    </div>
  );
}

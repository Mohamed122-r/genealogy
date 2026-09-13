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
const LEAF_WIDTH = 95;
const LEAF_HEIGHT = 52;
const LEVEL_HEIGHT = 200;      // المسافة بين الأجيال
const SIBLING_SPACING = 110;   // المسافة بين الأخوة

// =====================================================
// خوارزمية التخطيط
// =====================================================
function calculateLayout(nodes: PersonNode[]): LayoutNode[] {
  if (nodes.length === 0) return [];
  const roots = nodes.filter((n) => !n.fatherId);
  if (roots.length === 0) return [];

  const layout: LayoutNode[] = [];

  function getMaxDepth(person: PersonNode, d: number = 0): number {
    const children = nodes.filter((n) => n.fatherId === person.id);
    if (children.length === 0) return d;
    return Math.max(...children.map((c) => getMaxDepth(c, d + 1)));
  }

  const maxDepth = Math.max(...roots.map((r) => getMaxDepth(r)));

  function layoutSubtree(person: PersonNode, depth: number, leftBound: number): number {
    const children = nodes.filter((n) => n.fatherId === person.id);
    const node: LayoutNode = {
      ...person,
      x: 0,
      y: (maxDepth - depth) * LEVEL_HEIGHT,
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
// الألوان
// =====================================================
function getLeafColors(status: string) {
  switch (status) {
    case "ALIVE":
      return { fill: "#4A8B3F", fillLight: "#6BBF59", stroke: "#2D5A24", vein: "#1F4218" };
    case "DECEASED":
      return { fill: "#E5B80B", fillLight: "#F5D547", stroke: "#A8841D", vein: "#7A5E0F" };
    case "DISCONNECTED":
      return { fill: "#8B7355", fillLight: "#A89078", stroke: "#5D4A2E", vein: "#3A2E1A" };
    default:
      return { fill: "#A8A8A8", fillLight: "#C0C0C0", stroke: "#707070", vein: "#505050" };
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

function truncateName(name: string, max: number = 15) {
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

  const layoutNodes = useMemo(() => calculateLayout(nodes), [nodes]);

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
      y: treeBounds.minY - padding * 2,
      width: treeBounds.maxX - treeBounds.minX + padding * 2,
      height: treeBounds.maxY - treeBounds.minY + padding * 4,
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
      y: treeBounds.minY - padding * 2,
      width: treeBounds.maxX - treeBounds.minX + padding * 2,
      height: treeBounds.maxY - treeBounds.minY + padding * 4,
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
  const rootNodes = layoutNodes.filter((n) => !n.fatherId);
  const rootX = rootNodes.length > 0
    ? rootNodes.reduce((sum, n) => sum + n.x, 0) / rootNodes.length
    : (treeBounds.minX + treeBounds.maxX) / 2;

  const rootY = rootNodes.length > 0 ? rootNodes[0].y : treeBounds.maxY;
  const trunkBottomY = rootY + LEAF_HEIGHT / 2 + 100;
  const trunkTopY = rootY + LEAF_HEIGHT / 2 - 20;
  const trunkHeight = trunkBottomY - trunkTopY;

  // ===== حساب الفروع الرئيسية (فرعين من الجذع) =====
  const mainBranches = useMemo(() => {
    const branches: { startX: number; startY: number; endX: number; endY: number; }[] = [];

    // الحصول على جميع العقد في الجيل الثاني (عمق 1)
    const gen1 = layoutNodes.filter((n) => n.depth === 1);

    // إذا كان هناك أكثر من ابن للجذر، نقسمهم بين فرعين
    if (gen1.length > 0) {
      // الفرع الأيسر - أول نصف من الجيل الأول
      const leftHalf = gen1.slice(0, Math.ceil(gen1.length / 2));
      const rightHalf = gen1.slice(Math.ceil(gen1.length / 2));

      // حساب متوسط X لكل فرع
      if (leftHalf.length > 0) {
        const avgX = leftHalf.reduce((sum, n) => sum + n.x, 0) / leftHalf.length;
        const avgY = leftHalf.reduce((sum, n) => sum + n.y, 0) / leftHalf.length;
        branches.push({
          startX: rootX,
          startY: trunkTopY + 40,
          endX: avgX,
          endY: avgY + LEAF_HEIGHT / 2,
        });
      }

      if (rightHalf.length > 0) {
        const avgX = rightHalf.reduce((sum, n) => sum + n.x, 0) / rightHalf.length;
        const avgY = rightHalf.reduce((sum, n) => sum + n.y, 0) / rightHalf.length;
        branches.push({
          startX: rootX,
          startY: trunkTopY + 40,
          endX: avgX,
          endY: avgY + LEAF_HEIGHT / 2,
        });
      }
    }

    return branches;
  }, [layoutNodes, rootX, trunkTopY]);

  // ===== رسم الجذع =====
  const renderTrunk = () => (
    <g>
      {/* ظل الجذع */}
      <ellipse cx={rootX} cy={trunkBottomY + 10} rx="130" ry="18" fill="#000" opacity="0.18" />

      {/* الجذور (في الأسفل) */}
      <path
        d={`M ${rootX - 100} ${trunkBottomY - 10}
           C ${rootX - 130} ${trunkBottomY + 15}, ${rootX - 100} ${trunkBottomY + 25}, ${rootX - 75} ${trunkBottomY - 5}
           L ${rootX - 50} ${trunkBottomY - 20} Z`}
        fill="#3D1F0A"
        stroke="#2A1506"
        strokeWidth="1.5"
      />
      <path
        d={`M ${rootX + 100} ${trunkBottomY - 10}
           C ${rootX + 130} ${trunkBottomY + 15}, ${rootX + 100} ${trunkBottomY + 25}, ${rootX + 75} ${trunkBottomY - 5}
           L ${rootX + 50} ${trunkBottomY - 20} Z`}
        fill="#3D1F0A"
        stroke="#2A1506"
        strokeWidth="1.5"
      />

      {/* الجذع الرئيسي - طبقات */}
      {/* الطبقة الخارجية (الظل) */}
      <path
        d={`M ${rootX - 110} ${trunkBottomY}
           C ${rootX - 100} ${trunkBottomY - 50},
             ${rootX - 55} ${trunkTopY + 60},
             ${rootX - 35} ${trunkTopY}
           L ${rootX + 35} ${trunkTopY}
           C ${rootX + 55} ${trunkTopY + 60},
             ${rootX + 100} ${trunkBottomY - 50},
             ${rootX + 110} ${trunkBottomY} Z`}
        fill="#2A1506"
        opacity="0.3"
        transform="translate(3, 3)"
      />

      {/* الجذع الرئيسي */}
      <path
        d={`M ${rootX - 110} ${trunkBottomY}
           C ${rootX - 100} ${trunkBottomY - 50},
             ${rootX - 55} ${trunkTopY + 60},
             ${rootX - 35} ${trunkTopY}
           L ${rootX + 35} ${trunkTopY}
           C ${rootX + 55} ${trunkTopY + 60},
             ${rootX + 100} ${trunkBottomY - 50},
             ${rootX + 110} ${trunkBottomY} Z`}
        fill="url(#trunkGrad)"
        stroke="#2A1506"
        strokeWidth="2"
      />

      {/* خطوط الجذع الداخلية (تفاصيل) */}
      {[...Array(5)].map((_, i) => {
        const yOffset = (trunkHeight / 6) * (i + 1);
        const xOff = 40 - i * 5;
        return (
          <path
            key={i}
            d={`M ${rootX - xOff} ${trunkBottomY - yOffset}
               Q ${rootX - xOff / 2} ${trunkBottomY - yOffset - 10} ${rootX} ${trunkBottomY - yOffset - 5}`}
            stroke="#2A1506"
            strokeWidth="1"
            fill="none"
            opacity="0.4"
          />
        );
      })}

      {/* الخط العمودي في المنتصف */}
      <path
        d={`M ${rootX} ${trunkBottomY - 10} L ${rootX} ${trunkTopY + 10}`}
        stroke="#2A1506"
        strokeWidth="1"
        fill="none"
        opacity="0.3"
      />

      {/* نقطة التقاء الفروع في قمة الجذع */}
      <ellipse cx={rootX} cy={trunkTopY + 20} rx="50" ry="20" fill="#5D3A1A" />
      <ellipse cx={rootX} cy={trunkTopY + 20} rx="50" ry="20" fill="none" stroke="#2A1506" strokeWidth="1" />
    </g>
  );

  // ===== رسم الفروع الرئيسية =====
  const renderMainBranches = () => {
    return mainBranches.map((branch, i) => {
      const path = `M ${branch.startX} ${branch.startY}
                   C ${branch.startX} ${branch.startY - 30},
                     ${branch.endX} ${branch.endY + 30},
                     ${branch.endX} ${branch.endY}`;
      return (
        <g key={`main-branch-${i}`}>
          {/* الظل */}
          <path d={path} fill="none" stroke="#2A1506" strokeWidth={12} strokeLinecap="round" opacity={0.2} transform="translate(2,2)" />
          {/* الفرع */}
          <path d={path} fill="none" stroke="#5D3A1A" strokeWidth={10} strokeLinecap="round" />
          {/* إضاءة */}
          <path d={path} fill="none" stroke="#8B5A2B" strokeWidth={4} strokeLinecap="round" opacity={0.6} />
        </g>
      );
    });
  };

  // ===== رسم الفروع الثانوية (بين الأجيال) =====
  const renderBranches = () => {
    return layoutNodes.flatMap((node) => {
      const children = layoutNodes.filter((child) => child.fatherId === node.id);
      return children.map((child) => {
        const startX = node.x;
        const startY = node.y + LEAF_HEIGHT / 2;
        const endX = child.x;
        const endY = child.y - LEAF_HEIGHT / 2;

        const ctrl1Y = startY + (endY - startY) * 0.3;
        const ctrl2Y = startY + (endY - startY) * 0.7;

        const path = `M ${startX} ${startY}
                     C ${startX} ${ctrl1Y},
                       ${endX} ${ctrl2Y},
                       ${endX} ${endY}`;

        return (
          <g key={`${node.id}-${child.id}`}>
            <path d={path} fill="none" stroke="#2A1506" strokeWidth={6} strokeLinecap="round" opacity={0.2} transform="translate(2,2)" />
            <path d={path} fill="none" stroke="#5D3A1A" strokeWidth={4} strokeLinecap="round" />
            <path d={path} fill="none" stroke="#8B5A2B" strokeWidth={1.5} strokeLinecap="round" opacity={0.6} />
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
              : "drop-shadow(0 3px 5px rgba(0,0,0,0.3))",
            transition: "filter 0.3s ease",
          }}
        >
          {/* شكل الورقة (بيضاوي مدبب كالصورة) */}
          <path
            d={`M ${LEAF_WIDTH / 2} 2
               C ${LEAF_WIDTH * 0.85} ${LEAF_HEIGHT * 0.15},
                 ${LEAF_WIDTH - 2} ${LEAF_HEIGHT * 0.5},
                 ${LEAF_WIDTH / 2} ${LEAF_HEIGHT - 2}
               C 2 ${LEAF_HEIGHT * 0.5},
                 ${LEAF_WIDTH * 0.15} ${LEAF_HEIGHT * 0.15},
                 ${LEAF_WIDTH / 2} 2 Z`}
            fill={colors.fill}
            stroke={isSelected ? "#FFD700" : colors.stroke}
            strokeWidth={isSelected ? 3 : 1.5}
          />

          {/* لمعة علوية */}
          <path
            d={`M ${LEAF_WIDTH / 2} 6
               C ${LEAF_WIDTH * 0.7} ${LEAF_HEIGHT * 0.25},
                 ${LEAF_WIDTH * 0.8} ${LEAF_HEIGHT * 0.4},
                 ${LEAF_WIDTH / 2} ${LEAF_HEIGHT * 0.5}
               C ${LEAF_WIDTH * 0.3} ${LEAF_HEIGHT * 0.4},
                 ${LEAF_WIDTH * 0.25} ${LEAF_HEIGHT * 0.25},
                 ${LEAF_WIDTH / 2} 6 Z`}
            fill={colors.fillLight}
            opacity="0.4"
          />

          {/* عرق مركزي */}
          <path
            d={`M ${LEAF_WIDTH / 2} 5 L ${LEAF_WIDTH / 2} ${LEAF_HEIGHT - 5}`}
            stroke={colors.vein}
            strokeWidth="1"
            opacity="0.6"
          />

          {/* عروق جانبية */}
          {[0.35, 0.55, 0.75].map((ratio, i) => (
            <g key={i}>
              <path
                d={`M ${LEAF_WIDTH / 2} ${LEAF_HEIGHT * ratio} L ${LEAF_WIDTH * 0.78} ${LEAF_HEIGHT * (ratio - 0.08)}`}
                stroke={colors.vein}
                strokeWidth="0.6"
                opacity="0.4"
              />
              <path
                d={`M ${LEAF_WIDTH / 2} ${LEAF_HEIGHT * ratio} L ${LEAF_WIDTH * 0.22} ${LEAF_HEIGHT * (ratio - 0.08)}`}
                stroke={colors.vein}
                strokeWidth="0.6"
                opacity="0.4"
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
            style={{
              fontFamily: "Amiri, serif",
              textShadow: "0 1px 3px rgba(0,0,0,0.7)",
              paintOrder: "stroke",
            }}
            className="select-none pointer-events-none"
          >
            {truncateName(node.fullName, 15)}
          </text>

          {/* الحالة */}
          <text
            x={LEAF_WIDTH / 2}
            y={LEAF_HEIGHT / 2 + 13}
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="8"
            opacity="0.9"
            style={{
              fontFamily: "Cairo, sans-serif",
              textShadow: "0 1px 2px rgba(0,0,0,0.6)",
            }}
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
      {/* الإطار الذهبي المزدوج مع الزخارف */}
      <div className="absolute inset-0 pointer-events-none z-10 m-3">
        <div className="absolute inset-0 border-4 border-double border-gold-500/50 rounded-2xl" />
        <div className="absolute inset-3 border border-gold-500/30 rounded-xl" />
        {/* زخارف في الزوايا */}
        <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-gold-500 rounded-tl-lg" />
        <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-gold-500 rounded-tr-lg" />
        <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-gold-500 rounded-bl-lg" />
        <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-gold-500 rounded-br-lg" />
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
            {/* الخلفية */}
            <defs>
              <radialGradient id="bgGradient" cx="50%" cy="40%" r="80%">
                <stop offset="0%" stopColor="#FFFDF5" />
                <stop offset="50%" stopColor="#FDFBF3" />
                <stop offset="100%" stopColor="#F5EFE0" />
              </radialGradient>

              {/* زخرفة إسلامية */}
              <pattern id="islamicPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M50 0 L100 50 L50 100 L0 50 Z" fill="none" stroke="#C9A227" strokeWidth="0.5" opacity="0.15" />
                <circle cx="50" cy="50" r="25" fill="none" stroke="#C9A227" strokeWidth="0.5" opacity="0.12" />
                <circle cx="50" cy="50" r="4" fill="#C9A227" opacity="0.15" />
                <path d="M50 25 L50 75 M25 50 L75 50" stroke="#C9A227" strokeWidth="0.3" opacity="0.1" />
              </pattern>

              {/* تدرج الجذع */}
              <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2A1506" />
                <stop offset="20%" stopColor="#5D3A1A" />
                <stop offset="50%" stopColor="#8B5A2B" />
                <stop offset="80%" stopColor="#5D3A1A" />
                <stop offset="100%" stopColor="#2A1506" />
              </linearGradient>

              {/* توهج ذهبي */}
              <radialGradient id="glow" cx="50%" cy="70%" r="50%">
                <stop offset="0%" stopColor="#C9A227" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#C9A227" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* الخلفية */}
            <rect width="100%" height="100%" fill="url(#bgGradient)" />
            <rect width="100%" height="100%" fill="url(#islamicPattern)" />
            <rect width="100%" height="100%" fill="url(#glow)" />

            {/* الخط الأفقي (الأرض) */}
            <rect
              x={treeBounds.minX - 200}
              y={trunkBottomY + 5}
              width={treeBounds.maxX - treeBounds.minX + 400}
              height="4"
              fill="#8B7355"
              opacity="0.3"
            />

            {/* ===== الجذع ===== */}
            {renderTrunk()}

            {/* ===== الفروع الرئيسية ===== */}
            {renderMainBranches()}

            {/* ===== الفروع الثانوية ===== */}
            {renderBranches()}

            {/* ===== الأوراق ===== */}
            {renderLeaves()}
          </svg>
        </div>
      </div>

      {/* عداد الأشخاص */}
      <div className="absolute bottom-6 right-6 z-20 bg-dark-bg/90 backdrop-blur-md text-white px-4 py-2 rounded-xl shadow-xl border border-gold-500/30">
        <span className="text-xs text-gold-500">الأشخاص:</span>
        <span className="font-bold mr-2 text-lg">{layoutNodes.length}</span>
      </div>
    </div>
  );
}

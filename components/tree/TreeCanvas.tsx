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
const LEVEL_HEIGHT = 200;
const SIBLING_SPACING = 110;

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
  const groundY = trunkBottomY + 20; // خط الأرض (النجيلة)

  // ===== حساب الفروع الرئيسية (شعبة لكل ابن من أبناء الجذر) =====
  const mainBranches = useMemo(() => {
    const branches: { startX: number; startY: number; endX: number; endY: number; }[] = [];

    // الحصول على أبناء الجذر
    const root = layoutNodes.find((n) => !n.fatherId);
    if (!root) return branches;

    const rootChildren = layoutNodes.filter((n) => n.fatherId === root.id);

    // شعبة لكل ابن
    rootChildren.forEach((child) => {
      branches.push({
        startX: rootX,
        startY: trunkTopY + 20,
        endX: child.x,
        endY: child.y + LEAF_HEIGHT / 2,
      });
    });

    return branches;
  }, [layoutNodes, rootX, trunkTopY]);

  // ===== رسم النجيلة (خط الأرض) =====
  const renderGround = () => (
    <g>
      {/* الأرض الخضراء */}
      <rect
        x={treeBounds.minX - 300}
        y={groundY}
        width={treeBounds.maxX - treeBounds.minX + 600}
        height="200"
        fill="url(#groundGrad)"
      />
      {/* موجة العشب */}
      <path
        d={`M ${treeBounds.minX - 300} ${groundY}
           Q ${treeBounds.minX - 150} ${groundY - 8}, ${treeBounds.minX} ${groundY}
           Q ${treeBounds.minX + 150} ${groundY + 8}, ${treeBounds.minX + 300} ${groundY}
           Q ${treeBounds.minX + 450} ${groundY - 8}, ${treeBounds.minX + 600} ${groundY}
           L ${treeBounds.maxX + 300} ${groundY}
           L ${treeBounds.maxX + 300} ${groundY + 200}
           L ${treeBounds.minX - 300} ${groundY + 200} Z`}
        fill="url(#groundGrad)"
      />
      {/* خطوط العشب */}
      {[...Array(60)].map((_, i) => {
        const x = treeBounds.minX - 300 + i * 60;
        return (
          <path
            key={i}
            d={`M ${x} ${groundY} Q ${x + 5} ${groundY - 10}, ${x + 10} ${groundY - 15}`}
            stroke="#4A7D3F"
            strokeWidth="1.5"
            fill="none"
            opacity="0.5"
          />
        );
      })}
    </g>
  );

  // ===== رسم الجذع =====
  const renderTrunk = () => (
    <g>
      {/* ظل الجذع على الأرض */}
      <ellipse cx={rootX} cy={groundY - 5} rx="140" ry="25" fill="#2A1506" opacity="0.2" />

      {/* الجذور */}
      <path
        d={`M ${rootX - 110} ${trunkBottomY - 10}
           C ${rootX - 145} ${trunkBottomY + 15}, ${rootX - 115} ${trunkBottomY + 30}, ${rootX - 85} ${trunkBottomY - 5}
           L ${rootX - 55} ${trunkBottomY - 20} Z`}
        fill="#3D1F0A"
        stroke="#2A1506"
        strokeWidth="1.5"
      />
      <path
        d={`M ${rootX + 110} ${trunkBottomY - 10}
           C ${rootX + 145} ${trunkBottomY + 15}, ${rootX + 115} ${trunkBottomY + 30}, ${rootX + 85} ${trunkBottomY - 5}
           L ${rootX + 55} ${trunkBottomY - 20} Z`}
        fill="#3D1F0A"
        stroke="#2A1506"
        strokeWidth="1.5"
      />

      {/* ظل الجذع */}
      <path
        d={`M ${rootX - 115} ${trunkBottomY}
           C ${rootX - 105} ${trunkBottomY - 50},
             ${rootX - 60} ${trunkTopY + 60},
             ${rootX - 40} ${trunkTopY}
           L ${rootX + 40} ${trunkTopY}
           C ${rootX + 60} ${trunkTopY + 60},
             ${rootX + 105} ${trunkBottomY - 50},
             ${rootX + 115} ${trunkBottomY} Z`}
        fill="#2A1506"
        opacity="0.3"
        transform="translate(4, 4)"
      />

      {/* الجذع الرئيسي */}
      <path
        d={`M ${rootX - 115} ${trunkBottomY}
           C ${rootX - 105} ${trunkBottomY - 50},
             ${rootX - 60} ${trunkTopY + 60},
             ${rootX - 40} ${trunkTopY}
           L ${rootX + 40} ${trunkTopY}
           C ${rootX + 60} ${trunkTopY + 60},
             ${rootX + 105} ${trunkBottomY - 50},
             ${rootX + 115} ${trunkBottomY} Z`}
        fill="url(#trunkGrad)"
        stroke="#2A1506"
        strokeWidth="2"
      />

      {/* خطوط الجذع الداخلية */}
      {[...Array(6)].map((_, i) => {
        const yOffset = (trunkHeight / 7) * (i + 1);
        const xOff = 50 - i * 6;
        return (
          <path
            key={i}
            d={`M ${rootX - xOff} ${trunkBottomY - yOffset}
               Q ${rootX - xOff / 2} ${trunkBottomY - yOffset - 12} ${rootX} ${trunkBottomY - yOffset - 6}`}
            stroke="#2A1506"
            strokeWidth="1.2"
            fill="none"
            opacity="0.35"
          />
        );
      })}
      <path
        d={`M ${rootX} ${trunkBottomY - 10} L ${rootX} ${trunkTopY + 10}`}
        stroke="#2A1506"
        strokeWidth="1"
        fill="none"
        opacity="0.3"
      />

      {/* نقطة التقاء الفروع */}
      <ellipse cx={rootX} cy={trunkTopY + 20} rx="55" ry="22" fill="#5D3A1A" />
      <ellipse cx={rootX} cy={trunkTopY + 20} rx="55" ry="22" fill="none" stroke="#2A1506" strokeWidth="1.5" />
      <ellipse cx={rootX} cy={trunkTopY + 15} rx="35" ry="12" fill="#7A4F28" opacity="0.6" />
    </g>
  );

  // ===== رسم الفروع الرئيسية (شعبة لكل ابن) =====
  const renderMainBranches = () => {
    return mainBranches.map((branch, i) => {
      // منحنى بيزير لكل فرع
      const midX = (branch.startX + branch.endX) / 2;
      const midY = (branch.startY + branch.endY) / 2;
      const path = `M ${branch.startX} ${branch.startY}
                   Q ${midX} ${midY - 30}, ${branch.endX} ${branch.endY}`;

      // سماكة الفرع حسب عدد الأحفاد
      const thickness = 8;

      return (
        <g key={`main-branch-${i}`}>
          {/* الظل */}
          <path d={path} fill="none" stroke="#2A1506" strokeWidth={thickness + 4} strokeLinecap="round" opacity={0.2} transform="translate(3,3)" />
          {/* الفرع */}
          <path d={path} fill="none" stroke="#5D3A1A" strokeWidth={thickness} strokeLinecap="round" />
          {/* إضاءة */}
          <path d={path} fill="none" stroke="#8B5A2B" strokeWidth={thickness / 3} strokeLinecap="round" opacity={0.6} />
        </g>
      );
    });
  };

  // ===== رسم الفروع الثانوية =====
  const renderBranches = () => {
    return layoutNodes.flatMap((node) => {
      const children = layoutNodes.filter((child) => child.fatherId === node.id);
      // استبعاد أبناء الجذر (لأنهم لهم فروع رئيسية)
      if (!node.fatherId) return [];

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
          {/* شكل الورقة */}
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
          {/* لمعة */}
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
          <path d={`M ${LEAF_WIDTH / 2} 5 L ${LEAF_WIDTH / 2} ${LEAF_HEIGHT - 5}`} stroke={colors.vein} strokeWidth="1" opacity="0.6" />
          {/* عروق جانبية */}
          {[0.35, 0.55, 0.75].map((ratio, i) => (
            <g key={i}>
              <path d={`M ${LEAF_WIDTH / 2} ${LEAF_HEIGHT * ratio} L ${LEAF_WIDTH * 0.78} ${LEAF_HEIGHT * (ratio - 0.08)}`} stroke={colors.vein} strokeWidth="0.6" opacity="0.4" />
              <path d={`M ${LEAF_WIDTH / 2} ${LEAF_HEIGHT * ratio} L ${LEAF_WIDTH * 0.22} ${LEAF_HEIGHT * (ratio - 0.08)}`} stroke={colors.vein} strokeWidth="0.6" opacity="0.4" />
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
            style={{ fontFamily: "Amiri, serif", textShadow: "0 1px 3px rgba(0,0,0,0.7)", paintOrder: "stroke" }}
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
            style={{ fontFamily: "Cairo, sans-serif", textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}
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
              {/* تدرج الخلفية (كريمي فاتح مثل الصورة) */}
              <radialGradient id="bgGradient" cx="50%" cy="30%" r="90%">
                <stop offset="0%" stopColor="#FFFEF8" />
                <stop offset="50%" stopColor="#FDFBF3" />
                <stop offset="100%" stopColor="#F5EFE0" />
              </radialGradient>

              {/* زخرفة إسلامية (كما في الصورة) */}
              <pattern id="islamicPattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                <path d="M60 0 L120 60 L60 120 L0 60 Z" fill="none" stroke="#C9A227" strokeWidth="0.4" opacity="0.12" />
                <circle cx="60" cy="60" r="30" fill="none" stroke="#C9A227" strokeWidth="0.4" opacity="0.1" />
                <circle cx="60" cy="60" r="5" fill="#C9A227" opacity="0.12" />
                <path d="M60 30 L60 90 M30 60 L90 60" stroke="#C9A227" strokeWidth="0.3" opacity="0.08" />
                <path d="M60 30 L90 60 L60 90 L30 60 Z" fill="none" stroke="#C9A227" strokeWidth="0.3" opacity="0.1" />
              </pattern>

              {/* تدرج الجذع */}
              <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2A1506" />
                <stop offset="20%" stopColor="#5D3A1A" />
                <stop offset="50%" stopColor="#8B5A2B" />
                <stop offset="80%" stopColor="#5D3A1A" />
                <stop offset="100%" stopColor="#2A1506" />
              </linearGradient>

              {/* تدرج الأرض (النجيلة) */}
              <linearGradient id="groundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#7BC96F" />
                <stop offset="40%" stopColor="#5DA84F" />
                <stop offset="100%" stopColor="#3D7A2F" />
              </linearGradient>

              {/* توهج ذهبي */}
              <radialGradient id="glow" cx="50%" cy="70%" r="50%">
                <stop offset="0%" stopColor="#C9A227" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#C9A227" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* الخلفية */}
            <rect width="100%" height="100%" fill="url(#bgGradient)" />
            <rect width="100%" height="100%" fill="url(#islamicPattern)" />
            <rect width="100%" height="100%" fill="url(#glow)" />

            {/* ===== النجيلة (خط الأرض) ===== */}
            {renderGround()}

            {/* ===== الجذع ===== */}
            {renderTrunk()}

            {/* ===== الفروع الرئيسية (شعبة لكل ابن) ===== */}
            {renderMainBranches()}

            {/* ===== الفروع الثانوية ===== */}
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

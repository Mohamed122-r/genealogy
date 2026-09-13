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
const LEAF_HEIGHT = 55;
const LEVEL_HEIGHT = 190;
const SIBLING_SPACING = 105;

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
      return { fill: "#4A8B3F", fillLight: "#6BBF59", fillDark: "#2D5A24", stroke: "#1F4218", vein: "#1A3814" };
    case "DECEASED":
      return { fill: "#E5B80B", fillLight: "#F5D547", fillDark: "#A8841D", stroke: "#8B6B0F", vein: "#6B4F0A" };
    case "DISCONNECTED":
      return { fill: "#8B7355", fillLight: "#A89078", fillDark: "#5D4A2E", stroke: "#4A3A22", vein: "#3A2E1A" };
    default:
      return { fill: "#A8A8A8", fillLight: "#C0C0C0", fillDark: "#808080", stroke: "#707070", vein: "#505050" };
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
    const padding = 250;
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
        setViewBox((prev) => ({ ...prev, x: found.x - prev.width / 2, y: found.y - prev.height / 2 }));
        onSelectPerson(found.id);
      }
    }
  };

  const resetView = () => {
    const padding = 250;
    setZoomLevel(1);
    setViewBox({
      x: treeBounds.minX - padding,
      y: treeBounds.minY - padding * 2,
      width: treeBounds.maxX - treeBounds.minX + padding * 2,
      height: treeBounds.maxY - treeBounds.minY + padding * 4,
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => { setIsPanning(true); setStartPan({ x: e.clientX, y: e.clientY }); };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - startPan.x;
    const dy = e.clientY - startPan.y;
    setViewBox((prev) => ({ ...prev, x: prev.x - dx * (prev.width / (svgRef.current?.clientWidth || 1)), y: prev.y - dy * (prev.height / (svgRef.current?.clientHeight || 1)) }));
    setStartPan({ x: e.clientX, y: e.clientY });
  };
  const handleMouseUp = () => setIsPanning(false);

  const touchStartRef = useRef({ x: 0, y: 0, dist: 0 });
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) { setIsPanning(true); setStartPan({ x: e.touches[0].clientX, y: e.touches[0].clientY }); }
    else if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      touchStartRef.current = { x: 0, y: 0, dist };
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isPanning) handleMouseMove(e.touches[0] as any);
    else if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (touchStartRef.current.dist > 0) handleZoom(dist > touchStartRef.current.dist ? "in" : "out");
      touchStartRef.current.dist = dist;
    }
  };

  // ===== إحداثيات الجذع =====
  const rootNodes = layoutNodes.filter((n) => !n.fatherId);
  const rootX = rootNodes.length > 0 ? rootNodes.reduce((sum, n) => sum + n.x, 0) / rootNodes.length : (treeBounds.minX + treeBounds.maxX) / 2;
  const rootY = rootNodes.length > 0 ? rootNodes[0].y : treeBounds.maxY;
  
  const trunkTopY = rootY + LEAF_HEIGHT / 2 - 10;
  const trunkBottomY = rootY + LEAF_HEIGHT / 2 + 140;
  const groundLineY = trunkBottomY + 10;

  // ===== رسم النجيلة (3 طبقات) =====
  const renderGrass = () => (
    <g>
      {/* الطبقة الأولى (الأغمق - خلفية) */}
      <path
        d={`M ${treeBounds.minX - 400} ${groundLineY + 40}
           Q ${treeBounds.minX} ${groundLineY + 20}, ${centerX(treeBounds)} ${groundLineY + 30}
           Q ${treeBounds.maxX} ${groundLineY + 20}, ${treeBounds.maxX + 400} ${groundLineY + 40}
           L ${treeBounds.maxX + 400} ${groundLineY + 300}
           L ${treeBounds.minX - 400} ${groundLineY + 300} Z`}
        fill="#3D7A2F"
      />
      {/* الطبقة الثانية */}
      <path
        d={`M ${treeBounds.minX - 400} ${groundLineY + 20}
           Q ${treeBounds.minX} ${groundLineY}, ${centerX(treeBounds)} ${groundLineY + 10}
           Q ${treeBounds.maxX} ${groundLineY}, ${treeBounds.maxX + 400} ${groundLineY + 20}
           L ${treeBounds.maxX + 400} ${groundLineY + 300}
           L ${treeBounds.minX - 400} ${groundLineY + 300} Z`}
        fill="#5DA84F"
      />
      {/* الطبقة الثالثة (الأفتح - أمامية) */}
      <path
        d={`M ${treeBounds.minX - 400} ${groundLineY + 5}
           Q ${treeBounds.minX} ${groundLineY - 15}, ${centerX(treeBounds)} ${groundLineY - 5}
           Q ${treeBounds.maxX} ${groundLineY - 15}, ${treeBounds.maxX + 400} ${groundLineY + 5}
           L ${treeBounds.maxX + 400} ${groundLineY + 300}
           L ${treeBounds.minX - 400} ${groundLineY + 300} Z`}
        fill="#7BC96F"
      />
      {/* خطوط العشب */}
      {[...Array(80)].map((_, i) => {
        const x = treeBounds.minX - 400 + i * 80;
        return (
          <path
            key={i}
            d={`M ${x} ${groundLineY} Q ${x + 8} ${groundLineY - 15}, ${x + 15} ${groundLineY - 25}`}
            stroke="#3D7A2F"
            strokeWidth="1.5"
            fill="none"
            opacity="0.6"
          />
        );
      })}
    </g>
  );

  // دالة مساعدة
  function centerX(bounds: { minX: number; maxX: number }) {
    return (bounds.minX + bounds.maxX) / 2;
  }

  // ===== رسم الجذع =====
  const renderTrunk = () => (
    <g>
      {/* ظل الجذع على العشب */}
      <ellipse cx={rootX} cy={groundLineY + 20} rx="180" ry="30" fill="#2A1506" opacity="0.25" />

      {/* الجذور */}
      <path
        d={`M ${rootX - 140} ${trunkBottomY - 5}
           C ${rootX - 200} ${trunkBottomY + 25}, ${rootX - 150} ${trunkBottomY + 45}, ${rootX - 100} ${trunkBottomY + 5}
           L ${rootX - 60} ${trunkBottomY - 20} Z`}
        fill="#3D1F0A"
        stroke="#2A1506"
        strokeWidth="1.5"
      />
      <path
        d={`M ${rootX + 140} ${trunkBottomY - 5}
           C ${rootX + 200} ${trunkBottomY + 25}, ${rootX + 150} ${trunkBottomY + 45}, ${rootX + 100} ${trunkBottomY + 5}
           L ${rootX + 60} ${trunkBottomY - 20} Z`}
        fill="#3D1F0A"
        stroke="#2A1506"
        strokeWidth="1.5"
      />

      {/* ظل الجذع */}
      <path
        d={`M ${rootX - 140} ${trunkBottomY}
           C ${rootX - 120} ${trunkBottomY - 100},
             ${rootX - 80} ${trunkTopY + 100},
             ${rootX - 50} ${trunkTopY}
           L ${rootX + 50} ${trunkTopY}
           C ${rootX + 80} ${trunkTopY + 100},
             ${rootX + 120} ${trunkBottomY - 100},
             ${rootX + 140} ${trunkBottomY} Z`}
        fill="#2A1506"
        opacity="0.3"
        transform="translate(5, 5)"
      />

      {/* الجذع الرئيسي */}
      <path
        d={`M ${rootX - 140} ${trunkBottomY}
           C ${rootX - 120} ${trunkBottomY - 100},
             ${rootX - 80} ${trunkTopY + 100},
             ${rootX - 50} ${trunkTopY}
           L ${rootX + 50} ${trunkTopY}
           C ${rootX + 80} ${trunkTopY + 100},
             ${rootX + 120} ${trunkBottomY - 100},
             ${rootX + 140} ${trunkBottomY} Z`}
        fill="url(#trunkGrad)"
        stroke="#2A1506"
        strokeWidth="2.5"
      />

      {/* خطوط الجذع (تفاصيل) */}
      {[...Array(8)].map((_, i) => {
        const totalH = trunkBottomY - trunkTopY;
        const yOff = (totalH / 9) * (i + 1);
        const xOff = 90 - i * 8;
        return (
          <path
            key={i}
            d={`M ${rootX - xOff} ${trunkBottomY - yOff}
               Q ${rootX - xOff / 2} ${trunkBottomY - yOff - 15} ${rootX} ${trunkBottomY - yOff - 8}`}
            stroke="#2A1506"
            strokeWidth="1.5"
            fill="none"
            opacity="0.35"
          />
        );
      })}
      <path d={`M ${rootX} ${trunkBottomY - 10} L ${rootX} ${trunkTopY + 10}`} stroke="#2A1506" strokeWidth="1.5" fill="none" opacity="0.4" />

      {/* نقطة التقاء الفروع في قمة الجذع */}
      <ellipse cx={rootX} cy={trunkTopY + 25} rx="70" ry="28" fill="#5D3A1A" />
      <ellipse cx={rootX} cy={trunkTopY + 25} rx="70" ry="28" fill="none" stroke="#2A1506" strokeWidth="2" />
      <ellipse cx={rootX} cy={trunkTopY + 18} rx="45" ry="14" fill="#7A4F28" opacity="0.7" />
    </g>
  );

  // ===== رسم الفروع الرئيسية (لكل ابن من أبناء الجذر) =====
  const mainBranches = useMemo(() => {
    const branches: { startX: number; startY: number; endX: number; endY: number; childDepth: number }[] = [];
    const root = layoutNodes.find((n) => !n.fatherId);
    if (!root) return branches;

    const rootChildren = layoutNodes.filter((n) => n.fatherId === root.id);

    rootChildren.forEach((child) => {
      branches.push({
        startX: rootX,
        startY: trunkTopY + 20,
        endX: child.x,
        endY: child.y + LEAF_HEIGHT / 2,
        childDepth: child.depth,
      });
    });

    return branches;
  }, [layoutNodes, rootX, trunkTopY]);

  const renderMainBranches = () => {
    return mainBranches.map((branch, i) => {
      const midX = (branch.startX + branch.endX) / 2;
      const midY = (branch.startY + branch.endY) / 2;
      // منحنى بيزير طبيعي
      const path = `M ${branch.startX} ${branch.startY}
                   C ${branch.startX} ${midY}, ${branch.endX} ${midY}, ${branch.endX} ${branch.endY}`;

      return (
        <g key={`main-branch-${i}`}>
          <path d={path} fill="none" stroke="#2A1506" strokeWidth={14} strokeLinecap="round" opacity={0.25} transform="translate(3,3)" />
          <path d={path} fill="none" stroke="#5D3A1A" strokeWidth={10} strokeLinecap="round" />
          <path d={path} fill="none" stroke="#8B5A2B" strokeWidth={4} strokeLinecap="round" opacity={0.6} />
        </g>
      );
    });
  };

  // ===== رسم الفروع الثانوية =====
  const renderBranches = () => {
    return layoutNodes.flatMap((node) => {
      const children = layoutNodes.filter((child) => child.fatherId === node.id);
      if (!node.fatherId) return []; // استبعاد أبناء الجذر

      return children.map((child) => {
        const startX = node.x;
        const startY = node.y + LEAF_HEIGHT / 2 + 8; // يبدأ من نهاية ساق الأب
        const endX = child.x;
        const endY = child.y - LEAF_HEIGHT / 2 - 8; // ينتهي عند ساق الابن
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

  // ===== رسم الأوراق (بيضاوية مدببة + ساق) =====
  const renderLeaves = () => {
    return layoutNodes.map((node) => {
      const colors = getLeafColors(node.status);
      const isSelected = selectedPersonId === node.id;

      return (
        <g key={node.id}>
          {/* ساق الورقة (يصل بين الفرع والورقة) */}
          <line
            x1={node.x}
            y1={node.y + LEAF_HEIGHT / 2 + 5}
            x2={node.x}
            y2={node.y + LEAF_HEIGHT / 2 + 15}
            stroke="#5D3A1A"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          <g
            transform={`translate(${node.x - LEAF_WIDTH / 2}, ${node.y - LEAF_HEIGHT / 2})`}
            className="cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onSelectPerson(node.id); }}
            style={{
              filter: isSelected
                ? "drop-shadow(0 0 18px #FFD700) drop-shadow(0 0 6px #C9A227)"
                : "drop-shadow(0 4px 6px rgba(0,0,0,0.3))",
              transition: "filter 0.3s ease",
            }}
          >
            {/* شكل الورقة البيضاوية المدببة (مثل الصورة) */}
            <path
              d={`M ${LEAF_WIDTH / 2} 0
                 C ${LEAF_WIDTH * 0.7} ${LEAF_HEIGHT * 0.1},
                   ${LEAF_WIDTH} ${LEAF_HEIGHT * 0.35},
                   ${LEAF_WIDTH * 0.95} ${LEAF_HEIGHT * 0.5}
                 C ${LEAF_WIDTH} ${LEAF_HEIGHT * 0.65},
                   ${LEAF_WIDTH * 0.7} ${LEAF_HEIGHT * 0.9},
                   ${LEAF_WIDTH / 2} ${LEAF_HEIGHT}
                 C ${LEAF_WIDTH * 0.3} ${LEAF_HEIGHT * 0.9},
                   0 ${LEAF_HEIGHT * 0.65},
                   ${LEAF_WIDTH * 0.05} ${LEAF_HEIGHT * 0.5}
                 C 0 ${LEAF_HEIGHT * 0.35},
                   ${LEAF_WIDTH * 0.3} ${LEAF_HEIGHT * 0.1},
                   ${LEAF_WIDTH / 2} 0 Z`}
              fill={colors.fill}
              stroke={isSelected ? "#FFD700" : colors.stroke}
              strokeWidth={isSelected ? 3 : 1.5}
            />

            {/* لمعة داخلية */}
            <path
              d={`M ${LEAF_WIDTH / 2} 6
                 C ${LEAF_WIDTH * 0.65} ${LEAF_HEIGHT * 0.25},
                   ${LEAF_WIDTH * 0.75} ${LEAF_HEIGHT * 0.4},
                   ${LEAF_WIDTH / 2} ${LEAF_HEIGHT * 0.45}
                 C ${LEAF_WIDTH * 0.35} ${LEAF_HEIGHT * 0.4},
                   ${LEAF_WIDTH * 0.3} ${LEAF_HEIGHT * 0.25},
                   ${LEAF_WIDTH / 2} 6 Z`}
              fill={colors.fillLight}
              opacity="0.5"
            />

            {/* الجزء السفلي الغامق */}
            <path
              d={`M ${LEAF_WIDTH / 2} ${LEAF_HEIGHT - 6}
                 C ${LEAF_WIDTH * 0.65} ${LEAF_HEIGHT * 0.75},
                   ${LEAF_WIDTH * 0.75} ${LEAF_HEIGHT * 0.6},
                   ${LEAF_WIDTH / 2} ${LEAF_HEIGHT * 0.55}
                 C ${LEAF_WIDTH * 0.35} ${LEAF_HEIGHT * 0.6},
                   ${LEAF_WIDTH * 0.3} ${LEAF_HEIGHT * 0.75},
                   ${LEAF_WIDTH / 2} ${LEAF_HEIGHT - 6} Z`}
              fill={colors.fillDark}
              opacity="0.35"
            />

            {/* العرق المركزي */}
            <path
              d={`M ${LEAF_WIDTH / 2} 4 L ${LEAF_WIDTH / 2} ${LEAF_HEIGHT - 4}`}
              stroke={colors.vein}
              strokeWidth="1"
              opacity="0.55"
            />

            {/* عروق جانبية */}
            {[0.3, 0.5, 0.7].map((ratio, i) => (
              <g key={i}>
                <path d={`M ${LEAF_WIDTH / 2} ${LEAF_HEIGHT * ratio} L ${LEAF_WIDTH * 0.8} ${LEAF_HEIGHT * (ratio - 0.07)}`} stroke={colors.vein} strokeWidth="0.6" opacity="0.4" />
                <path d={`M ${LEAF_WIDTH / 2} ${LEAF_HEIGHT * ratio} L ${LEAF_WIDTH * 0.2} ${LEAF_HEIGHT * (ratio - 0.07)}`} stroke={colors.vein} strokeWidth="0.6" opacity="0.4" />
              </g>
            ))}

            {/* الاسم */}
            <text
              x={LEAF_WIDTH / 2}
              y={LEAF_HEIGHT / 2 - 2}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="10.5"
              fontWeight="bold"
              style={{ fontFamily: "Amiri, serif", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
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
              fontSize="7.5"
              opacity="0.9"
              style={{ fontFamily: "Cairo, sans-serif", textShadow: "0 1px 2px rgba(0,0,0,0.7)" }}
              className="select-none pointer-events-none"
            >
              {getStatusLabel(node.status)}
            </text>
          </g>
        </g>
      );
    });
  };

  return (
    <div className="w-full h-[600px] md:h-[800px] bg-[#FDFBF3] relative overflow-hidden rounded-2xl">
      {/* الإطار الذهبي */}
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
        <button onClick={() => handleZoom("in")} className="p-2 text-white hover:bg-gold-500 hover:text-dark-bg rounded-xl transition-all" title="تكبير"><ZoomIn className="w-5 h-5" /></button>
        <button onClick={() => handleZoom("out")} className="p-2 text-white hover:bg-gold-500 hover:text-dark-bg rounded-xl transition-all" title="تصغير"><ZoomOut className="w-5 h-5" /></button>
        <button onClick={resetView} className="p-2 text-white hover:bg-gold-500 hover:text-dark-bg rounded-xl transition-all" title="إعادة ضبط"><RotateCcw className="w-5 h-5" /></button>
        <button onClick={() => svgRef.current?.requestFullscreen()} className="p-2 text-white hover:bg-gold-500 hover:text-dark-bg rounded-xl transition-all" title="ملء الشاشة"><Maximize2 className="w-5 h-5" /></button>
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
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center", transition: "transform 0.3s ease-out" }}
          className="w-full h-full"
        >
          <svg ref={svgRef} viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`} className="w-full h-full">
            {/* الخلفية */}
            <defs>
              {/* خلفية كريمية */}
              <radialGradient id="bgGradient" cx="50%" cy="30%" r="90%">
                <stop offset="0%" stopColor="#FFFEF5" />
                <stop offset="50%" stopColor="#FDFBF3" />
                <stop offset="100%" stopColor="#F0E9D8" />
              </radialGradient>

              {/* زخرفة إسلامية هندسية */}
              <pattern id="islamicPattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                <path d="M60 0 L120 60 L60 120 L0 60 Z" fill="none" stroke="#C9A227" strokeWidth="0.4" opacity="0.15" />
                <path d="M60 20 L100 60 L60 100 L20 60 Z" fill="none" stroke="#C9A227" strokeWidth="0.3" opacity="0.1" />
                <circle cx="60" cy="60" r="30" fill="none" stroke="#C9A227" strokeWidth="0.3" opacity="0.1" />
                <circle cx="60" cy="60" r="5" fill="#C9A227" opacity="0.15" />
              </pattern>

              {/* تدرج الجذع */}
              <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2A1506" />
                <stop offset="15%" stopColor="#5D3A1A" />
                <stop offset="50%" stopColor="#8B5A2B" />
                <stop offset="85%" stopColor="#5D3A1A" />
                <stop offset="100%" stopColor="#2A1506" />
              </linearGradient>

              <radialGradient id="glow" cx="50%" cy="70%" r="50%">
                <stop offset="0%" stopColor="#C9A227" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#C9A227" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* الخلفية */}
            <rect width="100%" height="100%" fill="url(#bgGradient)" />
            <rect width="100%" height="100%" fill="url(#islamicPattern)" />
            <rect width="100%" height="100%" fill="url(#glow)" />

            {/* ===== النجيلة ===== */}
            {renderGrass()}

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

      {/* عداد */}
      <div className="absolute bottom-6 right-6 z-20 bg-dark-bg/90 backdrop-blur-md text-white px-4 py-2 rounded-xl shadow-xl border border-gold-500/30">
        <span className="text-xs text-gold-500">الأشخاص:</span>
        <span className="font-bold mr-2 text-lg">{layoutNodes.length}</span>
      </div>
    </div>
  );
}

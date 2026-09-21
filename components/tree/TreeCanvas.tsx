"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { PersonNode, LayoutNode } from "@/types/tree";
import { calculateTreeLayout, getTreeBounds } from "@/lib/tree/tree-layout";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Search } from "lucide-react";
import { TreeLeaf } from "./TreeLeaf";
import { Tooltip } from "./Tooltip";

interface TreeCanvasProps {
  nodes: PersonNode[];
  selectedPersonId?: string;
  onSelectPerson: (id: string) => void;
  svgRef: React.RefObject<SVGSVGElement>;
  onExport?: (format: "svg" | "pdf" | "png") => void;
}

const LEAF_WIDTH = 75;
const LEAF_HEIGHT = 70;

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
  const [hoveredNode, setHoveredNode] = useState<LayoutNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // ===== Layout =====
  const layoutNodes = useMemo(
    () =>
      calculateTreeLayout(nodes, {
        leafWidth: LEAF_WIDTH,
        leafHeight: LEAF_HEIGHT,
        horizontalGap: 40,
        verticalGap: 150,
      }),
    [nodes]
  );

  const treeBounds = useMemo(() => getTreeBounds(layoutNodes), [layoutNodes]);

  useEffect(() => {
    const padding = 200;
    setViewBox({
      x: treeBounds.minX - padding,
      y: treeBounds.minY - padding * 2,
      width: treeBounds.width + padding * 2,
      height: treeBounds.height + padding * 4,
    });
  }, [treeBounds]);

  // ===== حساب العقد المُضاءة (الشخص + آبائه + أبنائه) =====
  const highlightedNodeIds = useMemo(() => {
    if (!searchTerm.trim()) return new Set<string>();

    const searchLower = searchTerm.trim().toLowerCase();
    const found = layoutNodes.find((node) =>
      node.fullName.toLowerCase().includes(searchLower)
    );

    if (!found) return new Set<string>();

    const highlighted = new Set<string>();
    highlighted.add(found.id);

    // إضافة كل الآباء (صعوداً)
    let currentFatherId = found.fatherId;
    while (currentFatherId) {
      highlighted.add(currentFatherId);
      const father = layoutNodes.find((n) => n.id === currentFatherId);
      currentFatherId = father?.fatherId || null;
    }

    // إضافة كل الأبناء (نزولاً)
    function addDescendants(nodeId: string) {
      const children = layoutNodes.filter((n) => n.fatherId === nodeId);
      children.forEach((child) => {
        highlighted.add(child.id);
        addDescendants(child.id);
      });
    }
    addDescendants(found.id);

    return highlighted;
  }, [searchTerm, layoutNodes]);

  // ===== دوال التحكم =====
  const handleZoom = (direction: "in" | "out") => {
    setZoomLevel((prev) => Math.min(5, Math.max(0.5, direction === "in" ? prev * 1.2 : prev / 1.2)));
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      const found = layoutNodes.find((node) =>
        node.fullName.toLowerCase().includes(term.trim().toLowerCase())
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

  const resetView = () => {
    const padding = 200;
    setZoomLevel(1);
    setViewBox({
      x: treeBounds.minX - padding,
      y: treeBounds.minY - padding * 2,
      width: treeBounds.width + padding * 2,
      height: treeBounds.height + padding * 4,
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
  const rootX = rootNodes.length > 0 ? rootNodes.reduce((sum, n) => sum + n.x, 0) / rootNodes.length : (treeBounds.minX + treeBounds.maxX) / 2;
  const rootY = rootNodes.length > 0 ? rootNodes[0].y : treeBounds.maxY;
  const trunkTopY = rootY + LEAF_HEIGHT / 2 - 10;
  const trunkBottomY = rootY + LEAF_HEIGHT / 2 + 120;
  const groundLineY = trunkBottomY + 15;
  const trunkHeight = trunkBottomY - trunkTopY;

  // ===== الأدوات المساعدة =====
  const handleLeafHover = (e: React.MouseEvent, node: LayoutNode) => {
    setHoveredNode(node);
    setTooltipPos({ x: e.clientX, y: e.clientY - 20 });
  };
  const handleLeafLeave = () => setHoveredNode(null);

  // ===== رسم العشب =====
  const renderGrass = () => (
    <g>
      <path d={`M ${treeBounds.minX - 500} ${groundLineY + 30} Q ${treeBounds.minX - 200} ${groundLineY + 15}, ${rootX - 300} ${groundLineY + 20} Q ${rootX} ${groundLineY + 5}, ${rootX + 300} ${groundLineY + 20} Q ${treeBounds.maxX + 200} ${groundLineY + 15}, ${treeBounds.maxX + 500} ${groundLineY + 30} L ${treeBounds.maxX + 500} ${groundLineY + 400} L ${treeBounds.minX - 500} ${groundLineY + 400} Z`} fill="#2D5A24" />
      <path d={`M ${treeBounds.minX - 500} ${groundLineY + 15} Q ${treeBounds.minX - 200} ${groundLineY}, ${rootX - 300} ${groundLineY + 10} Q ${rootX} ${groundLineY - 5}, ${rootX + 300} ${groundLineY + 10} Q ${treeBounds.maxX + 200} ${groundLineY}, ${treeBounds.maxX + 500} ${groundLineY + 15} L ${treeBounds.maxX + 500} ${groundLineY + 400} L ${treeBounds.minX - 500} ${groundLineY + 400} Z`} fill="#4A8B3F" />
      <path d={`M ${treeBounds.minX - 500} ${groundLineY} Q ${treeBounds.minX - 200} ${groundLineY - 15}, ${rootX - 300} ${groundLineY - 5} Q ${rootX} ${groundLineY - 20}, ${rootX + 300} ${groundLineY - 5} Q ${treeBounds.maxX + 200} ${groundLineY - 15}, ${treeBounds.maxX + 500} ${groundLineY} L ${treeBounds.maxX + 500} ${groundLineY + 400} L ${treeBounds.minX - 500} ${groundLineY + 400} Z`} fill="#7BC96F" />
    </g>
  );

  // ===== رسم الجذع =====
  const renderTrunk = () => (
    <g>
      <ellipse cx={rootX} cy={groundLineY + 20} rx="200" ry="35" fill="#1A3814" opacity="0.35" />
      <path d={`M ${rootX - 160} ${trunkBottomY - 10} C ${rootX - 230} ${trunkBottomY + 30}, ${rootX - 180} ${trunkBottomY + 55}, ${rootX - 110} ${trunkBottomY + 15} L ${rootX - 70} ${trunkBottomY - 15} Z`} fill="#3D1F0A" stroke="#2A1506" strokeWidth="2" />
      <path d={`M ${rootX + 160} ${trunkBottomY - 10} C ${rootX + 230} ${trunkBottomY + 30}, ${rootX + 180} ${trunkBottomY + 55}, ${rootX + 110} ${trunkBottomY + 15} L ${rootX + 70} ${trunkBottomY - 15} Z`} fill="#3D1F0A" stroke="#2A1506" strokeWidth="2" />
      <path d={`M ${rootX - 145} ${trunkBottomY} C ${rootX - 125} ${trunkBottomY - 100}, ${rootX - 85} ${trunkTopY + 100}, ${rootX - 55} ${trunkTopY} L ${rootX + 55} ${trunkTopY} C ${rootX + 85} ${trunkTopY + 100}, ${rootX + 125} ${trunkBottomY - 100}, ${rootX + 145} ${trunkBottomY} Z`} fill="url(#trunkGrad)" stroke="#2A1506" strokeWidth="2.5" />
      {[...Array(8)].map((_, i) => {
        const yOff = (trunkHeight / 9) * (i + 1);
        const xOff = 90 - i * 8;
        return (
          <path
            key={i}
            d={`M ${rootX - xOff} ${trunkBottomY - yOff} Q ${rootX - xOff / 2} ${trunkBottomY - yOff - 15} ${rootX} ${trunkBottomY - yOff - 8}`}
            stroke="#2A1506"
            strokeWidth="1.5"
            fill="none"
            opacity="0.4"
          />
        );
      })}
    </g>
  );

  // ===== رسم الفروع =====
  const renderBranches = () => {
    return layoutNodes.flatMap((node) => {
      const children = layoutNodes.filter((child) => child.fatherId === node.id);
      if (children.length === 0) return [];

      const isRoot = !node.fatherId;

      const startX = isRoot ? rootX : node.x;
      const startY = isRoot ? trunkTopY + 20 : node.y + LEAF_HEIGHT / 2 + 5;

      return children.map((child) => {
        const endX = child.x;
        const endY = child.y - LEAF_HEIGHT / 2 - 5;

        const dy = endY - startY;
        const curveHeight = dy * 0.4;

        const ctrl1X = startX;
        const ctrl1Y = startY + curveHeight;
        const ctrl2X = endX;
        const ctrl2Y = endY - curveHeight;

        const path = `M ${startX} ${startY} C ${ctrl1X} ${ctrl1Y}, ${ctrl2X} ${ctrl2Y}, ${endX} ${endY}`;

        // هل الفرع مُضاء؟
        const isBranchHighlighted =
          highlightedNodeIds.has(node.id) && highlightedNodeIds.has(child.id);

        const isBranchDimmed =
          highlightedNodeIds.size > 0 && !isBranchHighlighted;

        let branchColor = "#5D3A1A";
        let branchLight = "#8B5A2B";
        let opacity = 1;

        if (isBranchHighlighted) {
          branchColor = "#C9A227";
          branchLight = "#FFD700";
        } else if (isBranchDimmed) {
          opacity = 0.25;
        }

        const thickness = isRoot ? 12 : 5;

        return (
          <g key={`${node.id}-${child.id}`} opacity={opacity}>
            <path d={path} fill="none" stroke="#2A1506" strokeWidth={thickness + 3} strokeLinecap="round" opacity={0.2} transform="translate(3,3)" />
            <path d={path} fill="none" stroke={branchColor} strokeWidth={thickness} strokeLinecap="round" />
            <path d={path} fill="none" stroke={branchLight} strokeWidth={thickness / 2.5} strokeLinecap="round" opacity={0.7} />
          </g>
        );
      });
    });
  };

  // ===== رسم الأوراق =====
  const renderLeaves = () => {
    return layoutNodes.map((node) => (
      <TreeLeaf
        key={node.id}
        node={node}
        isSelected={selectedPersonId === node.id}
        isHighlighted={highlightedNodeIds.has(node.id) && selectedPersonId !== node.id}
        isDimmed={highlightedNodeIds.size > 0 && !highlightedNodeIds.has(node.id) && selectedPersonId !== node.id}
        onClick={() => onSelectPerson(node.id)}
        onMouseEnter={handleLeafHover}
        onMouseLeave={handleLeafLeave}
      />
    ));
  };

  return (
    <div className="w-full h-[600px] md:h-[800px] bg-[#FDFBF3] relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0 pointer-events-none z-10 m-3">
        <div className="absolute inset-0 border-4 border-double border-gold-500/50 rounded-2xl" />
        <div className="absolute inset-3 border border-gold-500/30 rounded-xl" />
      </div>

      {/* أدوات التحكم */}
      <div className="absolute top-6 right-6 z-20 flex flex-col gap-2 bg-dark-bg/95 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-gold-500/30">
        <button onClick={() => handleZoom("in")} className="p-2 text-white hover:bg-gold-500 hover:text-dark-bg rounded-xl transition-all"><ZoomIn className="w-5 h-5" /></button>
        <button onClick={() => handleZoom("out")} className="p-2 text-white hover:bg-gold-500 hover:text-dark-bg rounded-xl transition-all"><ZoomOut className="w-5 h-5" /></button>
        <button onClick={resetView} className="p-2 text-white hover:bg-gold-500 hover:text-dark-bg rounded-xl transition-all"><RotateCcw className="w-5 h-5" /></button>
        <button onClick={() => svgRef.current?.requestFullscreen()} className="p-2 text-white hover:bg-gold-500 hover:text-dark-bg rounded-xl transition-all"><Maximize2 className="w-5 h-5" /></button>
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
            <defs>
              <radialGradient id="bgGradient" cx="50%" cy="30%" r="90%">
                <stop offset="0%" stopColor="#FFFEF5" />
                <stop offset="50%" stopColor="#FDFBF3" />
                <stop offset="100%" stopColor="#F0E9D8" />
              </radialGradient>
              <pattern id="islamicPattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                <path d="M60 0 L120 60 L60 120 L0 60 Z" fill="none" stroke="#C9A227" strokeWidth="0.4" opacity="0.15" />
                <circle cx="60" cy="60" r="30" fill="none" stroke="#C9A227" strokeWidth="0.3" opacity="0.1" />
              </pattern>
              <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2A1506" />
                <stop offset="50%" stopColor="#8B5A2B" />
                <stop offset="100%" stopColor="#2A1506" />
              </linearGradient>
            </defs>

            <rect width="100%" height="100%" fill="url(#bgGradient)" />
            <rect width="100%" height="100%" fill="url(#islamicPattern)" />

            {renderGrass()}
            {renderTrunk()}
            {renderBranches()}
            {renderLeaves()}
          </svg>
        </div>
      </div>

      {/* عداد */}
      <div className="absolute bottom-6 right-6 z-20 bg-dark-bg/90 backdrop-blur-md text-white px-4 py-2 rounded-xl shadow-xl border border-gold-500/30">
        <span className="text-xs text-gold-500">الأشخاص:</span>
        <span className="font-bold mr-2 text-lg">{layoutNodes.length}</span>
      </div>

      {/* البالونة المنبثقة */}
      <Tooltip node={hoveredNode} position={tooltipPos} allNodes={layoutNodes} />
    </div>
  );
}

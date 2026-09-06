/**
 * TAILORIX AI — PROFESSIONAL CAD CANVAS
 * High-precision vector garment CAD drafting canvas.
 * Off-white technical paper aesthetic with accurate CTM mouse transforms,
 * interactive vertex editing, bezier curve handles, grainlines, notches, and seam offsets.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { updatePiecePoint } from '../../models/patternGeometry';

export default function ProfessionalCADCanvas({
  pieces = [],
  selectedPieceId = null,
  onSelectPiece = () => {},
  onUpdatePiece = () => {},
  activeTool = 'select', // 'select' | 'node' | 'tape' | 'notch' | 'pan'
  showSeamAllowance = true,
  showGrainlines = true,
  showNotches = true,
  showGrid = true,
  snapToGrid = false,
  activeSizes = ['M'],
  gradedLayers = [],
}) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  // Viewport Transform (Pan & Zoom)
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 1000, height: 750 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Interactive Dragging of Vertex Nodes
  const [draggingNode, setDraggingNode] = useState(null); // { pieceId, pointIndex }

  // Precision Digital Tape Measurement State
  const [tapePoints, setTapePoints] = useState([]);

  // Converts screen MouseEvent to exact SVG CAD coordinates via ScreenCTM
  const getSVGCoordinates = useCallback((e) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const transformed = pt.matrixTransform(ctm.inverse());
    
    // Optional Snap to Grid (0.25" = 3px increments)
    if (snapToGrid) {
      const snapStep = 6;
      return {
        x: Math.round(transformed.x / snapStep) * snapStep,
        y: Math.round(transformed.y / snapStep) * snapStep,
      };
    }
    return { x: transformed.x, y: transformed.y };
  }, [snapToGrid]);

  // Handle Zoom via Wheel
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    setViewBox((prev) => {
      const newWidth = Math.max(Math.min(prev.width * zoomFactor, 3000), 300);
      const newHeight = Math.max(Math.min(prev.height * zoomFactor, 2250), 225);
      const dx = (newWidth - prev.width) / 2;
      const dy = (newHeight - prev.height) / 2;
      return {
        x: prev.x - dx,
        y: prev.y - dy,
        width: newWidth,
        height: newHeight,
      };
    });
    setZoomLevel((prev) => (e.deltaY > 0 ? prev * 0.9 : prev * 1.1));
  };

  // Canvas Mouse Down
  const handleMouseDown = (e) => {
    if (e.button === 1 || activeTool === 'pan') {
      // Middle click or Pan tool
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (activeTool === 'tape') {
      const coords = getSVGCoordinates(e);
      if (tapePoints.length === 2) {
        setTapePoints([coords]);
      } else {
        setTapePoints((prev) => [...prev, coords]);
      }
    }
  };

  // Canvas Mouse Move
  const handleMouseMove = (e) => {
    if (isPanning) {
      const dx = (e.clientX - panStart.x) * (viewBox.width / containerRef.current.clientWidth);
      const dy = (e.clientY - panStart.y) * (viewBox.height / containerRef.current.clientHeight);
      setViewBox((prev) => ({
        ...prev,
        x: prev.x - dx,
        y: prev.y - dy,
      }));
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (draggingNode && activeTool === 'node') {
      const coords = getSVGCoordinates(e);
      const piece = pieces.find((p) => p.id === draggingNode.pieceId);
      if (piece) {
        const updated = updatePiecePoint(piece, draggingNode.pointIndex, coords);
        onUpdatePiece(updated);
      }
    }
  };

  // Canvas Mouse Up
  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNode(null);
  };

  // Reset / Fit to Screen
  const handleFitToScreen = () => {
    setViewBox({ x: -20, y: -20, width: 900, height: 700 });
    setZoomLevel(1);
  };

  const selectedPiece = pieces.find((p) => p.id === selectedPieceId);

  // Distance for digital tape in inches (12px = 1")
  const tapeDistanceInches = tapePoints.length === 2
    ? (Math.hypot(tapePoints[1].x - tapePoints[0].x, tapePoints[1].y - tapePoints[0].y) / 12).toFixed(2)
    : null;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#f8fafc] overflow-hidden select-none border border-slate-200 rounded-xl shadow-inner"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ cursor: isPanning || activeTool === 'pan' ? 'grab' : activeTool === 'node' ? 'crosshair' : 'default' }}
    >
      <svg
        id="cad-pattern-svg-interactive"
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        className="w-full h-full"
      >
        <defs>
          {/* Technical CAD Grid Pattern (1 inch = 12px, major grid = 60px / 5 inches) */}
          <pattern id="cad-small-grid" width="12" height="12" patternUnits="userSpaceOnUse">
            <path d="M 12 0 L 0 0 0 12" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
          </pattern>
          <pattern id="cad-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <rect width="60" height="60" fill="url(#cad-small-grid)" />
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#cbd5e1" strokeWidth="1" />
          </pattern>

          {/* Grainline Arrowhead Marker */}
          <marker id="grain-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#b45309" />
          </marker>
        </defs>

        {/* Technical Paper Grid */}
        {showGrid && (
          <rect
            x={viewBox.x - 2000}
            y={viewBox.y - 2000}
            width={viewBox.width + 4000}
            height={viewBox.height + 4000}
            fill="url(#cad-grid)"
          />
        )}

        {/* Graded Nesting Layers (if active) */}
        {gradedLayers.map((layer) => (
          <g key={layer.sizeKey} opacity={0.6}>
            {layer.pieces.map((p) => (
              <path
                key={p.id}
                d={p.path}
                fill="none"
                stroke={layer.color}
                strokeWidth="1.2"
                strokeDasharray="2,2"
              />
            ))}
          </g>
        ))}

        {/* Main Pattern Pieces */}
        {pieces.map((piece) => {
          const isSelected = piece.id === selectedPieceId;
          const strokeColor = isSelected ? '#d97706' : '#0f172a';
          const fillColor = isSelected ? 'rgba(245, 158, 11, 0.04)' : 'rgba(255, 255, 255, 0.7)';

          return (
            <g
              key={piece.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPiece(piece.id);
              }}
              className="cursor-pointer"
            >
              {/* Outer Cut Boundary (Seam Allowance) */}
              {showSeamAllowance && piece.seamAllowancePath && (
                <path
                  d={piece.seamAllowancePath}
                  fill="none"
                  stroke={isSelected ? '#d97706' : '#475569'}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Inner Seam (Stitch) Line */}
              <path
                d={piece.path}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={piece.seamAllowancePath ? '1.0' : '2.0'}
                strokeDasharray={piece.seamAllowancePath ? '3,3' : 'none'}
              />

              {/* Internal Lines (Dart Fold, Placket, Crease) */}
              {(piece.internalLines || []).map((line, idx) => (
                <line
                  key={idx}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="#64748b"
                  strokeWidth="1"
                  strokeDasharray="4,2"
                />
              ))}

              {/* Darts */}
              {(piece.darts || []).map((dart, idx) => (
                <g key={idx}>
                  <line x1={dart.left.x} y1={dart.left.y} x2={dart.apex.x} y2={dart.apex.y} stroke="#64748b" strokeWidth="1" />
                  <line x1={dart.right.x} y1={dart.right.y} x2={dart.apex.x} y2={dart.apex.y} stroke="#64748b" strokeWidth="1" />
                </g>
              ))}

              {/* Grainline */}
              {showGrainlines && piece.grainline && (
                <g>
                  <line
                    x1={piece.grainline.x1}
                    y1={piece.grainline.y1}
                    x2={piece.grainline.x2}
                    y2={piece.grainline.y2}
                    stroke="#b45309"
                    strokeWidth="1.5"
                    markerStart="url(#grain-arrow)"
                    markerEnd="url(#grain-arrow)"
                  />
                  <text
                    x={(piece.grainline.x1 + piece.grainline.x2) / 2 + 6}
                    y={(piece.grainline.y1 + piece.grainline.y2) / 2}
                    fill="#b45309"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                  >
                    GRAIN
                  </text>
                </g>
              )}

              {/* Notches */}
              {showNotches && (piece.notches || []).map((notch, idx) => (
                <circle
                  key={idx}
                  cx={notch.x}
                  cy={notch.y}
                  r="3.5"
                  fill="#ef4444"
                  stroke="#ffffff"
                  strokeWidth="1"
                />
              ))}

              {/* Center Piece Label & Cut Qty */}
              {piece.bounds && (
                <text
                  x={piece.bounds.centerX}
                  y={piece.bounds.centerY}
                  textAnchor="middle"
                  fill="#334155"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="sans-serif"
                >
                  <tspan x={piece.bounds.centerX} dy="0">{piece.name}</tspan>
                  <tspan x={piece.bounds.centerX} dy="14" fontSize="9" fill="#64748b">{piece.cutQuantity}</tspan>
                </text>
              )}
            </g>
          );
        })}

        {/* Editable Vertex Handles (When Node Tool is Active on Selected Piece) */}
        {activeTool === 'node' && selectedPiece && (selectedPiece.points || []).map((pt, idx) => (
          <g key={pt.id || idx}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r="5.5"
              fill={pt.type === 'smooth' ? '#38bdf8' : '#d97706'}
              stroke="#ffffff"
              strokeWidth="2"
              className="cursor-move hover:scale-125 transition-transform"
              onMouseDown={(e) => {
                e.stopPropagation();
                setDraggingNode({ pieceId: selectedPiece.id, pointIndex: idx });
              }}
            />
            {/* Control Point Handles if smooth bezier */}
            {pt.cp1 && (
              <>
                <line x1={pt.x} y1={pt.y} x2={pt.cp1.x} y2={pt.cp1.y} stroke="#38bdf8" strokeWidth="1" strokeDasharray="2,2" />
                <circle cx={pt.cp1.x} cy={pt.cp1.y} r="3.5" fill="#0284c7" stroke="#ffffff" strokeWidth="1" />
              </>
            )}
          </g>
        ))}

        {/* Digital Precision Tape Measurement */}
        {tapePoints.length > 0 && (
          <g>
            {tapePoints.map((pt, idx) => (
              <circle key={idx} cx={pt.x} cy={pt.y} r="4" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
            ))}
            {tapePoints.length === 2 && (
              <>
                <line
                  x1={tapePoints[0].x}
                  y1={tapePoints[0].y}
                  x2={tapePoints[1].x}
                  y2={tapePoints[1].y}
                  stroke="#0284c7"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                />
                <rect
                  x={(tapePoints[0].x + tapePoints[1].x) / 2 - 35}
                  y={(tapePoints[0].y + tapePoints[1].y) / 2 - 18}
                  width="70"
                  height="22"
                  rx="6"
                  fill="#0f172a"
                  opacity="0.9"
                />
                <text
                  x={(tapePoints[0].x + tapePoints[1].x) / 2}
                  y={(tapePoints[0].y + tapePoints[1].y) / 2 - 4}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="bold"
                >
                  {tapeDistanceInches}"
                </text>
              </>
            )}
          </g>
        )}
      </svg>

      {/* Viewport Floating Controls */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl p-1.5 shadow-md flex items-center gap-1.5 text-xs text-slate-700">
        <button
          onClick={() => setViewBox((v) => ({ ...v, width: v.width * 0.85, height: v.height * 0.85 }))}
          className="px-2.5 py-1 hover:bg-slate-100 rounded-lg font-bold"
          title="Zoom In"
        >
          +
        </button>
        <span className="font-mono text-[11px] px-1">{Math.round(100 / (viewBox.width / 900))}%</span>
        <button
          onClick={() => setViewBox((v) => ({ ...v, width: v.width * 1.15, height: v.height * 1.15 }))}
          className="px-2.5 py-1 hover:bg-slate-100 rounded-lg font-bold"
          title="Zoom Out"
        >
          -
        </button>
        <div className="w-px h-4 bg-slate-200 mx-0.5"></div>
        <button
          onClick={handleFitToScreen}
          className="px-2.5 py-1 hover:bg-slate-100 rounded-lg font-medium text-[11px]"
        >
          Fit View
        </button>
      </div>

      {/* Active Mode Banner */}
      {activeTool === 'node' && (
        <div className="absolute top-3 left-4 bg-amber-500/10 border border-amber-500/30 text-amber-800 text-xs px-3 py-1.5 rounded-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
          <span>Node Edit Mode: Click and drag vertex nodes to reshape piece geometry.</span>
        </div>
      )}
      {activeTool === 'tape' && (
        <div className="absolute top-3 left-4 bg-sky-500/10 border border-sky-500/30 text-sky-800 text-xs px-3 py-1.5 rounded-lg flex items-center gap-2">
          <span>Digital Tape: Click two points on the canvas to measure exact linear distance.</span>
        </div>
      )}
    </div>
  );
}

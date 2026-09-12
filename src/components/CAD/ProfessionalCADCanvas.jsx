/**
 * TAILORIX AI — PROFESSIONAL CAD CANVAS
 * High-precision vector garment CAD drafting canvas.
 * Refined warm off-white technical drafting surface with accurate CTM mouse transforms,
 * dark charcoal pattern outlines, restrained champagne gold selection highlight,
 * subtle gray drafting grid, grainlines, notches, and floating controls.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { updatePiecePoint } from '../../models/patternGeometry';
import { ZoomIn, ZoomOut, Maximize2, Move, Ruler } from 'lucide-react';

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
      const dx = (e.clientX - panStart.x) * (viewBox.width / (containerRef.current?.clientWidth || 1000));
      const dy = (e.clientY - panStart.y) * (viewBox.height / (containerRef.current?.clientHeight || 750));
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
      className="relative w-full h-full bg-[#F3F3F0] overflow-hidden select-none"
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
          {/* Refined subtle CAD Grid: Minor grid 12px, Major grid 60px */}
          <pattern id="cad-small-grid" width="12" height="12" patternUnits="userSpaceOnUse">
            <path d="M 12 0 L 0 0 0 12" fill="none" stroke="#E5E5DF" strokeWidth="0.5" />
          </pattern>
          <pattern id="cad-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <rect width="60" height="60" fill="url(#cad-small-grid)" />
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#D3D3CB" strokeWidth="0.8" />
          </pattern>

          {/* Grainline Arrowhead Marker */}
          <marker id="grain-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 2 L 10 5 L 0 8 z" fill="#9B7B38" />
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
          <g key={layer.sizeKey} opacity={0.65}>
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
          const strokeColor = isSelected ? '#C5A059' : '#1A1B1D';
          const fillColor = isSelected ? 'rgba(197, 160, 89, 0.08)' : 'rgba(255, 255, 255, 0.75)';

          return (
            <g
              key={piece.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPiece(piece.id);
              }}
              className="cursor-pointer group"
            >
              {/* Outer Cut Boundary (Seam Allowance) */}
              {showSeamAllowance && piece.seamAllowancePath && (
                <path
                  d={piece.seamAllowancePath}
                  fill="none"
                  stroke={isSelected ? '#C5A059' : '#5E6068'}
                  strokeWidth={isSelected ? '2.0' : '1.5'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Inner Seam (Stitch) Line */}
              <path
                d={piece.path}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={piece.seamAllowancePath ? '1.0' : '1.8'}
                strokeDasharray={piece.seamAllowancePath ? '3,3' : 'none'}
              />

              {/* Internal Lines (Crease, Fold, Placket) */}
              {(piece.internalLines || []).map((line, idx) => (
                <line
                  key={idx}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="#7A7C85"
                  strokeWidth="0.9"
                  strokeDasharray="4,2"
                />
              ))}

              {/* Darts */}
              {(piece.darts || []).map((dart, idx) => (
                <g key={idx}>
                  <line x1={dart.left.x} y1={dart.left.y} x2={dart.apex.x} y2={dart.apex.y} stroke="#7A7C85" strokeWidth="0.9" />
                  <line x1={dart.right.x} y1={dart.right.y} x2={dart.apex.x} y2={dart.apex.y} stroke="#7A7C85" strokeWidth="0.9" />
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
                    stroke="#9B7B38"
                    strokeWidth="1.2"
                    markerStart="url(#grain-arrow)"
                    markerEnd="url(#grain-arrow)"
                  />
                  <text
                    x={(piece.grainline.x1 + piece.grainline.x2) / 2 + 5}
                    y={(piece.grainline.y1 + piece.grainline.y2) / 2}
                    fill="#9B7B38"
                    fontSize="8.5"
                    fontWeight="600"
                    fontFamily="sans-serif"
                    letterSpacing="0.05em"
                  >
                    FABRIC DIRECTION
                  </text>
                </g>
              )}

              {/* Notches */}
              {showNotches && (piece.notches || []).map((notch, idx) => (
                <circle
                  key={idx}
                  cx={notch.x}
                  cy={notch.y}
                  r="3"
                  fill="#D14545"
                  stroke="#FFFFFF"
                  strokeWidth="1"
                />
              ))}

              {/* Professional Annotation Labels */}
              {piece.bounds && (
                <text
                  x={piece.bounds.centerX}
                  y={piece.bounds.centerY}
                  textAnchor="middle"
                  fill={isSelected ? '#1A1B1D' : '#32343A'}
                  fontSize="10"
                  fontWeight="600"
                  fontFamily="sans-serif"
                >
                  <tspan x={piece.bounds.centerX} dy="-2">{piece.name}</tspan>
                  <tspan x={piece.bounds.centerX} dy="12" fontSize="8" fill="#6B6D75">{piece.cutQuantity}</tspan>
                </text>
              )}
            </g>
          );
        })}

        {/* Editable Vertex Handles (When Node Tool is Active) */}
        {activeTool === 'node' && selectedPiece && (selectedPiece.points || []).map((pt, idx) => (
          <g key={pt.id || idx}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r="5"
              fill={pt.type === 'smooth' ? '#38BDF8' : '#C5A059'}
              stroke="#101112"
              strokeWidth="1.5"
              className="cursor-move hover:scale-125 transition-transform"
              onMouseDown={(e) => {
                e.stopPropagation();
                setDraggingNode({ pieceId: selectedPiece.id, pointIndex: idx });
              }}
            />
            {pt.cp1 && (
              <>
                <line x1={pt.x} y1={pt.y} x2={pt.cp1.x} y2={pt.cp1.y} stroke="#38BDF8" strokeWidth="0.8" strokeDasharray="2,2" />
                <circle cx={pt.cp1.x} cy={pt.cp1.y} r="3" fill="#0284C7" stroke="#101112" strokeWidth="1" />
              </>
            )}
          </g>
        ))}

        {/* Digital Precision Tape Measurement */}
        {tapePoints.length > 0 && (
          <g>
            {tapePoints.map((pt, idx) => (
              <circle key={idx} cx={pt.x} cy={pt.y} r="3.5" fill="#0284C7" stroke="#FFFFFF" strokeWidth="1.5" />
            ))}
            {tapePoints.length === 2 && (
              <>
                <line
                  x1={tapePoints[0].x}
                  y1={tapePoints[0].y}
                  x2={tapePoints[1].x}
                  y2={tapePoints[1].y}
                  stroke="#0284C7"
                  strokeWidth="1.5"
                  strokeDasharray="4,3"
                />
                <rect
                  x={(tapePoints[0].x + tapePoints[1].x) / 2 - 32}
                  y={(tapePoints[0].y + tapePoints[1].y) / 2 - 16}
                  width="64"
                  height="20"
                  rx="5"
                  fill="#101112"
                  opacity="0.92"
                />
                <text
                  x={(tapePoints[0].x + tapePoints[1].x) / 2}
                  y={(tapePoints[0].y + tapePoints[1].y) / 2 - 3}
                  textAnchor="middle"
                  fill="#E5C07B"
                  fontSize="10"
                  fontWeight="600"
                  fontFamily="monospace"
                >
                  {tapeDistanceInches}"
                </text>
              </>
            )}
          </g>
        )}
      </svg>

      {/* Viewport Floating Controls (Compact Creative Dock) */}
      <div className="absolute bottom-4 right-4 bg-[#141517]/90 backdrop-blur-md border border-[#2B2D31] rounded-xl p-1 shadow-floating flex items-center gap-1 text-xs text-[#EDEDF0] z-20">
        <button
          onClick={() => setViewBox((v) => ({ ...v, width: v.width * 0.85, height: v.height * 0.85 }))}
          className="w-7 h-7 rounded-lg hover:bg-[#202226] text-[#EDEDF0] flex items-center justify-center transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <span className="font-mono text-[11px] text-[#C5A059] px-1 select-none">
          {Math.round(100 / (viewBox.width / 900))}%
        </span>
        <button
          onClick={() => setViewBox((v) => ({ ...v, width: v.width * 1.15, height: v.height * 1.15 }))}
          className="w-7 h-7 rounded-lg hover:bg-[#202226] text-[#EDEDF0] flex items-center justify-center transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-3.5 bg-[#2B2D31] mx-0.5" />
        <button
          onClick={handleFitToScreen}
          className="px-2.5 h-7 rounded-lg hover:bg-[#202226] text-[#EDEDF0] text-[11px] font-medium transition-colors"
          title="Reset to full pattern extents"
        >
          Fit View
        </button>
      </div>

      {/* Active Mode Floating Banner */}
      {activeTool === 'node' && (
        <div className="absolute top-3 left-4 bg-[#141517]/90 backdrop-blur-md border border-[#C5A059]/40 text-[#E5C07B] text-xs px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-floating z-20">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-ping"></span>
          <span>Drag & Adjust Points: Click and move points to shape the pattern</span>
        </div>
      )}
      {activeTool === 'tape' && (
        <div className="absolute top-3 left-4 bg-[#141517]/90 backdrop-blur-md border border-sky-500/40 text-sky-300 text-xs px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-floating z-20">
          <Ruler className="w-3.5 h-3.5 text-sky-400" />
          <span>Tape Measure: Click two points to measure distance</span>
        </div>
      )}
    </div>
  );
}

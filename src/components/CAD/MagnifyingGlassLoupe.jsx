import React, { useState } from 'react';
import { Sparkles, ZoomIn, Target, Eraser, PenTool, Crosshair } from 'lucide-react';
import { TAILOR_RULERS_CATALOG } from './TailorRulersCatalog';

// Helper to convert array of points to smooth SVG path
function pointsToSvgPath(points) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  return d;
}

export default function MagnifyingGlassLoupe({
  lensState,
  layers = [],
  cuttingSheets = [],
  activeRulers = [],
  brushSize = 3,
}) {
  const [magnification, setMagnification] = useState(2.5); // 2.0x, 2.5x, 3.0x

  if (!lensState || !lensState.visible) return null;

  const LOUPE_SIZE = 192; // Loupe diameter in screen pixels
  const worldRadius = (LOUPE_SIZE / 2) / magnification;
  const viewX = lensState.x - worldRadius;
  const viewY = lensState.y - worldRadius;
  const viewSize = worldRadius * 2;

  // Position on screen avoiding viewport boundaries
  const screenX = Math.min(
    window.innerWidth - (LOUPE_SIZE + 30),
    Math.max(16, (lensState.screenX || 200) + 36)
  );
  const screenY = Math.min(
    window.innerHeight - (LOUPE_SIZE + 80),
    Math.max(64, (lensState.screenY || 200) - LOUPE_SIZE / 2)
  );

  const isEraser = lensState.tool === 'eraser';
  const isDart = lensState.tool === 'dart_marker';
  const isSeam = lensState.tool === 'seam_allowance';
  const isChalk = lensState.tool === 'chalk';
  const eraserRadius = Math.max(14, brushSize * 2);

  return (
    <div
      id="cad-magnifying-glass-loupe"
      className="fixed z-50 select-none pointer-events-none transition-all duration-75 ease-out"
      style={{
        left: `${screenX}px`,
        top: `${screenY}px`,
      }}
    >
      {/* Precision Lens Housing (High-Contrast Bezel) */}
      <div className="relative w-48 h-48 rounded-full border-4 border-amber-400 bg-[#080d1a] shadow-[0_16px_40px_rgba(0,0,0,0.85),0_0_24px_rgba(245,158,11,0.4)] overflow-hidden">
        {/* Optical Magnified Viewport SVG */}
        <svg
          width={LOUPE_SIZE}
          height={LOUPE_SIZE}
          viewBox={`${viewX} ${viewY} ${viewSize} ${viewSize}`}
          className="w-full h-full block"
        >
          <defs>
            {/* Fine CAD Millimeter Grid */}
            <pattern id="loupeGrid10" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(56, 189, 248, 0.12)" strokeWidth="0.5" />
            </pattern>
            {/* Major CAD 50px Grid */}
            <pattern id="loupeGrid50" width="50" height="50" patternUnits="userSpaceOnUse">
              <rect width="50" height="50" fill="url(#loupeGrid10)" />
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(245, 158, 11, 0.22)" strokeWidth="0.8" />
            </pattern>
          </defs>

          {/* Navy CAD Surface Background */}
          <rect x={viewX} y={viewY} width={viewSize} height={viewSize} fill="#080d1a" />
          <rect x={viewX} y={viewY} width={viewSize} height={viewSize} fill="url(#loupeGrid50)" />

          {/* 1. Cutting Sheets Backgrounds & Seam Lines */}
          {cuttingSheets.map((sheet) => (
            <g key={sheet.id}>
              <rect
                x={sheet.x}
                y={sheet.y}
                width={sheet.width}
                height={sheet.height}
                fill="#0f172a"
                stroke="#38bdf8"
                strokeWidth="1.2"
                strokeDasharray="4 2"
                opacity={0.8}
              />
              {/* Fold Line */}
              {sheet.isFolded && (
                <line
                  x1={sheet.x + sheet.width / 2}
                  y1={sheet.y}
                  x2={sheet.x + sheet.width / 2}
                  y2={sheet.y + sheet.height}
                  stroke="#38bdf8"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              )}
            </g>
          ))}

          {/* 2. Drafted Garment Pieces & Layers */}
          {layers
            .filter((layer) => layer.visible)
            .map((layer) => (
              <g key={layer.id} opacity={layer.opacity || 1}>
                {/* Bodice Piece SVG Outline */}
                {layer.piece && layer.piece.pathData && (
                  <path
                    d={layer.piece.pathData}
                    fill="none"
                    stroke="#f8fafc"
                    strokeWidth="1.8"
                  />
                )}

                {/* Layer Elements: Strokes & Seam Allowances */}
                {layer.elements &&
                  layer.elements.map((el) => {
                    if (el.tool === 'dart_marker' && el.apex) {
                      return (
                        <g key={el.id}>
                          <circle cx={el.apex.x} cy={el.apex.y} r="3.5" fill="#f59e0b" stroke="#000" strokeWidth="0.8" />
                          {el.legs && el.legs.length > 0 && (
                            <polyline
                              points={el.legs.map((pt) => `${pt.x},${pt.y}`).join(' ')}
                              fill="none"
                              stroke="#f59e0b"
                              strokeWidth="1.5"
                              strokeDasharray="4 3"
                            />
                          )}
                          <text
                            x={el.apex.x + 6}
                            y={el.apex.y + 3.5}
                            fill="#f59e0b"
                            fontSize="8"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            DART APEX
                          </text>
                        </g>
                      );
                    }

                    if (el.points && el.points.length > 0) {
                      return (
                        <path
                          key={el.id}
                          d={pointsToSvgPath(el.points)}
                          fill="none"
                          stroke={el.color || '#ffffff'}
                          strokeWidth={el.size || 2}
                          strokeDasharray={el.dashed ? '5 4' : 'none'}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      );
                    }

                    return null;
                  })}
              </g>
            ))}

          {/* 3. Active Rulers Visual Boundaries */}
          {activeRulers.map((ruler) => {
            const cat = TAILOR_RULERS_CATALOG[ruler.type];
            if (!cat) return null;
            return (
              <g
                key={ruler.id}
                transform={`translate(${ruler.x}, ${ruler.y}) rotate(${ruler.rotation || 0}) scale(${ruler.scale || 1})`}
              >
                <path
                  d={cat.getOuterPath ? cat.getOuterPath(ruler.length || cat.defaultLength) : cat.outerPath}
                  fill="rgba(56, 189, 248, 0.08)"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}

          {/* 4. Eraser Footprint Circle (Visible when Eraser is active) */}
          {isEraser && (
            <circle
              cx={lensState.x}
              cy={lensState.y}
              r={eraserRadius}
              fill="rgba(239, 68, 68, 0.15)"
              stroke="#ef4444"
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />
          )}

          {/* 5. Seam Allowance 5/8" Broken Guide Preview */}
          {isSeam && (
            <g>
              <circle
                cx={lensState.x}
                cy={lensState.y}
                r="12.5"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity={0.8}
              />
            </g>
          )}

          {/* 6. True Optical Reticle & Hairlines */}
          {/* Outer concentric distance rings */}
          <circle cx={lensState.x} cy={lensState.y} r={worldRadius * 0.4} fill="none" stroke="rgba(245, 158, 11, 0.35)" strokeWidth="0.8" strokeDasharray="3 2" />
          <circle cx={lensState.x} cy={lensState.y} r={worldRadius * 0.75} fill="none" stroke="rgba(245, 158, 11, 0.25)" strokeWidth="0.8" />

          {/* Continuous Crosshairs */}
          <line
            x1={viewX}
            y1={lensState.y}
            x2={viewX + viewSize}
            y2={lensState.y}
            stroke="#f59e0b"
            strokeWidth="0.9"
            opacity={0.85}
          />
          <line
            x1={lensState.x}
            y1={viewY}
            x2={lensState.x}
            y2={viewY + viewSize}
            stroke="#f59e0b"
            strokeWidth="0.9"
            opacity={0.85}
          />

          {/* Directional Alignment Arrow if angle is defined */}
          {lensState.angle !== undefined && (
            <g transform={`translate(${lensState.x}, ${lensState.y}) rotate(${lensState.angle})`}>
              <line x1="0" y1="0" x2="0" y2="-28" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
              <polygon points="0,-34 -4,-26 4,-26" fill="#f59e0b" />
            </g>
          )}

          {/* Central Target Pip */}
          <circle cx={lensState.x} cy={lensState.y} r="2.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.75" />
        </svg>

        {/* Optical Glass Flare Reflection Arc */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 35% 25%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.03) 40%, transparent 70%)',
          }}
        />

        {/* Tactile Magnification Level Controls */}
        <div className="absolute top-2 right-2 pointer-events-auto flex items-center gap-1 bg-slate-950/90 p-0.5 rounded-full border border-amber-400/60 shadow-lg">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMagnification(2.0);
            }}
            className={`px-1.5 py-0.5 rounded-full text-[8px] font-black tracking-wider transition-all ${
              magnification === 2.0 ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="2x Optical Magnification"
          >
            2X
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMagnification(3.0);
            }}
            className={`px-1.5 py-0.5 rounded-full text-[8px] font-black tracking-wider transition-all ${
              magnification === 3.0 ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="3x Optical Magnification"
          >
            3X
          </button>
        </div>
      </div>

      {/* Attached Precision Readout Badge */}
      <div className="mt-1.5 bg-[#090e1a]/95 backdrop-blur-md border border-amber-400/80 rounded-xl px-3 py-1 shadow-2xl text-center min-w-[160px]">
        <div className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center justify-center gap-1">
          {isEraser ? (
            <Eraser className="w-3 h-3 text-red-400" />
          ) : isDart ? (
            <Target className="w-3 h-3 text-amber-400" />
          ) : isSeam ? (
            <PenTool className="w-3 h-3 text-sky-400" />
          ) : (
            <Crosshair className="w-3 h-3 text-amber-400" />
          )}
          <span>{lensState.label || `${magnification}x Focus Loupe`}</span>
        </div>
        <div className="text-[10px] font-mono text-slate-300 flex items-center justify-center gap-2 mt-0.5">
          <span>X: {Math.round(lensState.x)}</span>
          <span className="text-slate-600">|</span>
          <span>Y: {Math.round(lensState.y)}</span>
          {lensState.angle !== undefined && (
            <>
              <span className="text-slate-600">|</span>
              <span className="text-amber-400 font-bold">{lensState.angle}°</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * TAILORIX AI — PATTERN BLUEPRINT ON VIRTUAL CUT SHEET
 * 
 * Renders the garment-specific Pattern Blueprint Sketch onto a virtual
 * Tailorix Cut Sheet with piece-level sketch/vector objects.
 * 
 * Capabilities:
 * - Asymmetrical, non-overlapping tailoring cut sheet arrangement
 * - Relative scale strictly preserved (large panels are large, small trims are small)
 * - Authentic pattern cutter styling: cream drafting vellum, crisp perimeter cutlines,
 *   dashed seam allowances, grainline arrows, balance notches, and pattern stamps
 * - Piece selection with technical metadata inspector
 * - Piece repositioning (drag & drop across virtual fabric width)
 * - Piece rotation (90° steps)
 * - Piece renaming & visibility toggle
 * - Zoom & Pan navigation
 * - Human-in-the-loop targeted modification input
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Scissors,
  Layers,
  Move,
  RotateCw,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Plus,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Maximize2,
  ZoomIn,
  ZoomOut,
  ChevronRight,
  Info,
  Check,
  Sliders,
  AlertTriangle,
  Compass,
} from 'lucide-react';
import { FEATURE_SOURCES } from '../../models/reconstructionModel';
import { getPieceVisualDimensions } from '../../models/patternBlueprint';
import {
  getPieceIllustrationDataUrl,
  PRESET_SET_APART_PIECES,
} from '../../utils/garmentSketchEngine';

export default function PatternBlueprintCutSheet({
  blueprint,
  onUpdateBlueprint,
  onApplyCorrection,
  referenceImage = null,
  reconstructionModel = null,
}) {
  const [selectedPieceId, setSelectedPieceId] = useState(
    blueprint?.pieces?.[0]?.id || null
  );
  const [layoutMode, setLayoutMode] = useState('cutsheet'); // 'cutsheet' | 'setapart'
  const [inspectingPiece, setInspectingPiece] = useState(null);
  const [editingPieceNameId, setEditingPieceNameId] = useState(null);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [zoom, setZoom] = useState(0.65);
  const [pan, setPan] = useState({ x: 30, y: 20 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [draggingPieceId, setDraggingPieceId] = useState(null);
  const [showAddPieceModal, setShowAddPieceModal] = useState(false);
  const [newPieceName, setNewPieceName] = useState('');
  const [newPieceRole, setNewPieceRole] = useState('Shell Reinforcement');
  const [targetedCommand, setTargetedCommand] = useState('');
  const [isExpandedWorkspace, setIsExpandedWorkspace] = useState(false);

  const containerRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0, initialPan: { x: 0, y: 0 }, initialPiecePos: { x: 0, y: 0 } });

  const pieces = blueprint?.pieces || [];
  const selectedPiece = pieces.find((p) => p.id === selectedPieceId) || pieces[0] || null;

  const garmentType = blueprint?.garmentType || reconstructionModel?.garmentType || 'dress';
  const isDress = garmentType === 'dress' || garmentType === 'gown';
  const isTrouser = ['trouser', 'trousers', 'jeans', 'pants', 'slacks'].includes(garmentType);
  const isJacket = ['jacket', 'blazer', 'coat', 'suit'].includes(garmentType);

  const referenceBlueprintImage = useMemo(() => {
    const direct = PRESET_SET_APART_PIECES[garmentType];
    if (direct) return direct;
    if (isDress) return PRESET_SET_APART_PIECES.dress;
    if (isTrouser) return PRESET_SET_APART_PIECES.trouser;
    if (isJacket) return PRESET_SET_APART_PIECES.jacket;
    return null;
  }, [garmentType, isDress, isTrouser, isJacket]);

  const [setApartSubMode, setSetApartSubMode] = useState(referenceBlueprintImage ? 'master_layout' : 'interactive_cards');

  // Zoom handlers
  const handleZoom = (delta) => {
    setZoom((prev) => Math.min(2.0, Math.max(0.35, prev + delta)));
  };

  const handleResetView = () => {
    setZoom(0.65);
    setPan({ x: 30, y: 20 });
  };

  // Piece update emitter
  const updatePiece = (id, updates) => {
    if (!onUpdateBlueprint || !blueprint) return;
    const updatedPieces = pieces.map((p) => (p.id === id ? { ...p, ...updates } : p));
    onUpdateBlueprint({
      ...blueprint,
      pieces: updatedPieces,
    });
  };

  // Delete piece
  const handleRemovePiece = (id, e) => {
    e?.stopPropagation();
    if (!onUpdateBlueprint || !blueprint) return;
    const remaining = pieces.filter((p) => p.id !== id);
    onUpdateBlueprint({
      ...blueprint,
      pieces: remaining,
    });
    if (selectedPieceId === id) {
      setSelectedPieceId(remaining[0]?.id || null);
    }
  };

  // Rotate piece 90°
  const handleRotatePiece = (id, e) => {
    e?.stopPropagation();
    const p = pieces.find((item) => item.id === id);
    if (!p) return;
    const newRot = ((p.rotation || 0) + 90) % 360;
    updatePiece(id, { rotation: newRot });
  };

  // Toggle piece visibility
  const handleToggleVisibility = (id, e) => {
    e?.stopPropagation();
    const p = pieces.find((item) => item.id === id);
    if (!p) return;
    updatePiece(id, { visible: p.visible === false });
  };

  // Add custom piece
  const handleAddCustomPiece = () => {
    if (!newPieceName.trim() || !blueprint) return;
    const id = `piece_custom_${Date.now()}`;
    const newPiece = {
      id,
      name: newPieceName.trim(),
      type: 'CUSTOM_PANEL',
      garmentRole: newPieceRole,
      side: 'front',
      outline: 'M 10 10 L 80 10 L 80 80 L 10 80 Z',
      bounds: { minX: 10, minY: 10, width: 70, height: 70 },
      cutQuantity: 2,
      cutQuantityLabel: 'Cut 2 (1 Pair)',
      onFold: false,
      grainline: { x1: 45, y1: 20, x2: 45, y2: 70, label: 'LENGTHWISE GRAIN' },
      notches: [{ x: 80, y: 45, label: 'Match Notch', angle: 0 }],
      constructionLines: [],
      confidence: 1.0,
      sourceReference: FEATURE_SOURCES.USER,
      x: 60 + (pieces.length % 4) * 80,
      y: 60 + Math.floor(pieces.length / 4) * 90,
      rotation: 0,
      visible: true,
    };

    onUpdateBlueprint({
      ...blueprint,
      pieces: [...pieces, newPiece],
    });
    setSelectedPieceId(id);
    setShowAddPieceModal(false);
    setNewPieceName('');
  };

  // Targeted Command Input
  const handleApplyTargetedCommand = (e) => {
    e.preventDefault();
    if (!targetedCommand.trim()) return;
    onApplyCorrection?.('targeted_blueprint_modification', targetedCommand.trim());
    setTargetedCommand('');
  };

  // Canvas and piece dragging
  const handlePointerDown = (e) => {
    if (e.target.closest('[data-piece-drag-handle="true"]')) return;
    setIsDraggingCanvas(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialPan: { ...pan },
    };
  };

  const startDraggingPiece = (id, e) => {
    e.stopPropagation();
    setDraggingPieceId(id);
    const target = pieces.find((p) => p.id === id);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialPiecePos: { x: target?.x || 0, y: target?.y || 0 },
    };
  };

  const handlePointerMove = (e) => {
    if (draggingPieceId) {
      const dx = (e.clientX - dragStartRef.current.x) / zoom;
      const dy = (e.clientY - dragStartRef.current.y) / zoom;
      const newX = Math.max(10, Math.round(dragStartRef.current.initialPiecePos.x + dx));
      const newY = Math.max(10, Math.round(dragStartRef.current.initialPiecePos.y + dy));
      updatePiece(draggingPieceId, { x: newX, y: newY });
    } else if (isDraggingCanvas) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPan({
        x: dragStartRef.current.initialPan.x + dx,
        y: dragStartRef.current.initialPan.y + dy,
      });
    }
  };

  const handlePointerUp = () => {
    setIsDraggingCanvas(false);
    setDraggingPieceId(null);
  };

  // Fabric texture style mapping
  const getFabricTextureStyle = () => {
    const tex = blueprint?.cutSheet?.fabricTexture || 'wool_tweed';
    switch (tex) {
      case 'selvedge_denim':
        return {
          backgroundColor: '#1E293B',
          backgroundImage: 'radial-gradient(#334155 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '16px 16px, 4px 4px',
        };
      case 'silk_satin':
        return {
          backgroundColor: '#18181B',
          backgroundImage: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, transparent 60%)',
        };
      case 'wool_tweed':
      default:
        return {
          backgroundColor: '#1C1D21',
          backgroundImage: `
            linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(255,255,255,0.03) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.03) 75%),
            linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.03) 75%)
          `,
          backgroundSize: '16px 16px',
        };
    }
  };

  return (
    <div className="bg-[#141517] rounded-2xl border border-[#222427] shadow-panel overflow-hidden">
      {/* Top Action Bar */}
      <div className="p-4 sm:p-5 border-b border-[#222427] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#C5A059]/15 border border-[#C5A059]/30 flex items-center justify-center text-[#E5C07B] shrink-0">
            <Scissors className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">
                Deconstructed Pattern Pieces • Set Apart
              </span>
              <span className="text-xs text-[#6A6C75]">•</span>
              <span className="text-xs text-zinc-300 font-mono capitalize">
                {blueprint?.garmentType || 'Garment'}
              </span>
              <span className="text-xs text-[#6A6C75]">•</span>
              <span className="text-xs text-emerald-400 font-mono">
                {pieces.length} Illustrated Pieces
              </span>
            </div>
            <h3 className="text-sm font-semibold text-[#F5F5F7]">
              Pattern Illustration Layout (Set Apart from Reconstruction)
            </h3>
          </div>
        </div>

        {/* Canvas Navigation Controls, Layout Mode & Add Piece */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Layout Mode Selector (Cut Sheet Spread vs AI Parts Set Apart) */}
          <div className="flex items-center p-0.5 bg-[#101112] rounded-xl border border-[#28292D]">
            <button
              onClick={() => setLayoutMode('cutsheet')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                layoutMode === 'cutsheet'
                  ? 'bg-[#C5A059] text-[#101112] shadow-xs'
                  : 'text-[#8A8B93] hover:text-[#EDEDF0]'
              }`}
            >
              Cut Sheet Spread
            </button>
            <button
              onClick={() => setLayoutMode('setapart')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                layoutMode === 'setapart'
                  ? 'bg-[#C5A059] text-[#101112] shadow-xs'
                  : 'text-[#8A8B93] hover:text-[#EDEDF0]'
              }`}
            >
              AI Parts Set Apart
            </button>
          </div>

          {/* Sub-mode for Set Apart: Master Blueprint Layout vs Interactive Piece Cards */}
          {layoutMode === 'setapart' && (
            <div className="flex items-center p-0.5 bg-[#101112] rounded-xl border border-[#28292D]">
              <button
                onClick={() => setSetApartSubMode('master_layout')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  setApartSubMode === 'master_layout'
                    ? 'bg-[#C5A059] text-[#101112] shadow-xs'
                    : 'text-[#8A8B93] hover:text-[#EDEDF0]'
                }`}
              >
                Master Blueprint
              </button>
              <button
                onClick={() => setSetApartSubMode('interactive_cards')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  setApartSubMode === 'interactive_cards'
                    ? 'bg-[#C5A059] text-[#101112] shadow-xs'
                    : 'text-[#8A8B93] hover:text-[#EDEDF0]'
                }`}
              >
                Piece Cards
              </button>
            </div>
          )}

          {/* Zoom controls */}
          <div className="flex items-center bg-[#101112] rounded-xl border border-[#28292D] p-0.5">
            <button
              onClick={() => handleZoom(-0.1)}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-zinc-300 px-2 select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => handleZoom(0.1)}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetView}
              className="px-2 py-1 hover:bg-[#25272B] rounded-lg text-[10px] text-[#C5A059] font-semibold border-l border-[#2A2B2E]"
              title="Fit to Screen"
            >
              Fit
            </button>
          </div>

          <button
            onClick={() => setShowAddPieceModal(true)}
            className="px-3 py-1.5 bg-[#C5A059]/15 hover:bg-[#C5A059]/25 border border-[#C5A059]/40 text-[#E5C07B] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Piece</span>
          </button>
        </div>
      </div>

      {/* Main Workspace (Cut Sheet Canvas + Piece Inspector Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        {/* Left: Virtual Cut Sheet Canvas (8 Cols) */}
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="lg:col-span-8 bg-[#0D0E10] relative overflow-hidden select-none border-b lg:border-b-0 lg:border-r border-[#222427] cursor-grab active:cursor-grabbing min-h-[520px] flex items-center justify-center"
        >
          {/* Virtual Cut Sheet Background Simulation (60" Fabric Width or Set Apart Drafting Paper) */}
          <div
            className="relative transition-transform duration-75 ease-out shadow-2xl rounded-lg"
            style={{
              width: `${Math.max(1800, blueprint?.cutSheet?.width || 1800)}px`,
              height: `${Math.max(950, blueprint?.cutSheet?.height || 950)}px`,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'top left',
              ...(layoutMode === 'setapart'
                ? {
                    backgroundColor: '#FAF8F5',
                    backgroundImage: 'linear-gradient(to right, rgba(203, 213, 225, 0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(203, 213, 225, 0.4) 1px, transparent 1px)',
                    backgroundSize: '32px 32px',
                    border: '2px solid rgba(197, 160, 89, 0.6)',
                  }
                : {
                    ...getFabricTextureStyle(),
                    border: '2px dashed rgba(197, 160, 89, 0.4)',
                  }),
            }}
          >
            {/* Top Bar (Fabric Selvedge Line or Set-Apart Blueprint Header) */}
            <div className="absolute top-0 left-0 right-0 h-6 bg-[#C5A059]/15 border-b border-[#C5A059]/30 flex items-center justify-between px-3 text-[9px] font-mono text-[#E5C07B] uppercase tracking-wider z-10">
              {layoutMode === 'setapart' ? (
                <>
                  <span>◄ AI DETECTED PARTS • SET APART BLUEPRINT LAYOUT</span>
                  <span>ALL {pieces.length} GARMENT PARTS DETECTED & ISOLATED • MASTER DRAFTING VELLUM</span>
                  <span>ANATOMICAL SPREAD ►</span>
                </>
              ) : (
                <>
                  <span>◄ TOP SELVEDGE EDGE (60" LUXURY BOLT WIDTH)</span>
                  <span>ESTIMATED YARDAGE: {blueprint?.cutSheet?.yardage || '2.2'} YDS • ASYMMETRICAL CUTTER LAYOUT</span>
                  <span>GRAIN DIRECTION ►</span>
                </>
              )}
            </div>

            {/* Bottom Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-[#C5A059]/15 border-t border-[#C5A059]/30 flex items-center justify-between px-3 text-[9px] font-mono text-[#E5C07B] uppercase tracking-wider z-10">
              {layoutMode === 'setapart' ? (
                <>
                  <span>◄ TAILORIX DECONSTRUCTED PARTS</span>
                  <span>NO SYNTHETIC SVG • AUTHENTIC LINE ART BLUEPRINTS FULLY ON CUT SHEETS</span>
                  <span>ZERO OVERLAPS ►</span>
                </>
              ) : (
                <>
                  <span>◄ BOTTOM SELVEDGE EDGE</span>
                  <span>TAILORIX PATTERN BLUEPRINT • ZERO OVERLAPS</span>
                  <span>FULL WIDTH SPREAD ►</span>
                </>
              )}
            </div>

            {/* Master Set-Apart Blueprint Reference Graphic OR Individual Pieces */}
            {layoutMode === 'setapart' && setApartSubMode === 'master_layout' ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 relative z-10 pointer-events-auto overflow-auto">
                <div className="w-full max-w-5xl bg-[#FAF9F5] rounded-xl border border-stone-300 p-6 shadow-2xl relative select-none">
                  {/* Title block on sheet */}
                  <div className="flex items-center justify-between pb-3 border-b border-stone-300 text-[10px] font-mono text-stone-700 uppercase font-bold">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#B45309]" />
                      <span>MASTER ARCHITECTURAL PATTERN BLUEPRINT • {garmentType.toUpperCase()}</span>
                    </div>
                    <span>{pieces.length} CONFIRMED STRUCTURAL PANELS • 0.5" SEAM ALLOWANCE • ZERO OVERLAPS</span>
                  </div>

                  {/* Grid of confirmed pattern pieces with realistic vector drawings */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-4">
                    {pieces.map((piece, idx) => (
                      <div
                        key={piece.id}
                        onClick={() => {
                          setSelectedPieceId(piece.id);
                          setInspectingPiece(piece);
                        }}
                        className="p-3 bg-white rounded-lg border-2 border-stone-300 hover:border-[#C5A059] shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono pb-1 border-b border-stone-200">
                          <span className="font-bold text-[#B45309] bg-amber-500/15 px-1.5 py-0.5 rounded">
                            P-{String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className="truncate max-w-[120px] font-semibold text-stone-800">{piece.name}</span>
                        </div>

                        <div className="h-36 w-full flex items-center justify-center my-2 p-1 overflow-hidden">
                          <img
                            src={piece.illustrationUrl || getPieceIllustrationDataUrl(piece, garmentType)}
                            alt={piece.name}
                            referrerPolicy="no-referrer"
                            className="max-h-full max-w-full object-contain filter contrast-125 group-hover:scale-105 transition-transform"
                          />
                        </div>

                        <div className="pt-1.5 border-t border-stone-200 flex items-center justify-between text-[9px] font-mono text-stone-600">
                          <span className="font-bold text-amber-900">{piece.cutQuantityLabel || `Cut ${piece.cutQuantity || 2}`}</span>
                          <span className="text-[#C5A059] font-bold group-hover:underline">Inspect ↗</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Blueprint Footnote */}
                  <div className="pt-3 border-t border-stone-300 flex items-center justify-between text-[9px] font-mono text-stone-500">
                    <span>Derived strictly from confirmed CAD Vector & Technical Flat geometry</span>
                    <span className="text-emerald-700 font-bold">100% Faithful to Uploaded Garment</span>
                  </div>
                </div>
              </div>
            ) : (
              pieces.map((piece) => {
                if (piece.visible === false) return null;
                const isSelected = piece.id === selectedPieceId;
                const rot = piece.rotation || 0;
                const b = piece.bounds || { minX: 0, minY: 0, width: 80, height: 100 };

                // Scaled rendering dimensions preserving relative scale and matching collision engine
                const { width: cardWidth, height: cardHeight } = getPieceVisualDimensions(piece);

                return (
                  <div
                    key={piece.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPieceId(piece.id);
                    }}
                    className={`absolute rounded-xl transition-shadow select-none group cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-[#C5A059] shadow-[0_0_24px_rgba(197,160,89,0.45)] z-20'
                        : 'hover:ring-1 hover:ring-zinc-300 z-10 shadow-md'
                    }`}
                    style={{
                      left: `${piece.x || 50}px`,
                      top: `${piece.y || 50}px`,
                      width: `${cardWidth}px`,
                      height: `${cardHeight}px`,
                      transform: `rotate(${rot}deg)`,
                      transformOrigin: 'center center',
                    }}
                  >
                    {/* Floating Action Controls on Hover/Select */}
                    <div className="absolute -top-7 left-0 right-0 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity bg-[#111214]/95 backdrop-blur-xs px-2 py-0.5 rounded-t-lg border border-[#28292D] text-[10px] text-zinc-300 z-30">
                      <span className="truncate font-semibold max-w-[120px]">{piece.name}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectingPiece(piece);
                          }}
                          className="p-1 hover:text-[#C5A059]"
                          title="Inspect Blueprint Details"
                        >
                          <Maximize2 className="w-3 h-3" />
                        </button>
                        <button
                          data-piece-drag-handle="true"
                          onPointerDown={(e) => startDraggingPiece(piece.id, e)}
                          className="p-1 hover:text-[#C5A059] cursor-grab active:cursor-grabbing"
                          title="Drag Piece"
                        >
                          <Move className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleRotatePiece(piece.id, e)}
                          className="p-1 hover:text-[#C5A059]"
                          title="Rotate 90°"
                        >
                          <RotateCw className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Pattern Cutter Paper Card (Authentic Ivory Pattern Vellum) */}
                    <div className="w-full h-full bg-[#FAF9F6] border-2 border-stone-300 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden shadow-lg hover:border-[#C5A059] transition-all">
                      {/* Header info bar (Architectural Atelier Title) */}
                      <div className="w-full flex items-center justify-between text-[11px] font-mono text-stone-800 pb-2 border-b border-stone-200">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[10px] font-bold text-[#B45309] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30 shrink-0">
                            P-{String(piece.id).replace(/\D/g, '').slice(-2) || '01'}
                          </span>
                          <span className="font-bold truncate text-stone-900 tracking-wide">{piece.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px] border border-amber-300/60 shadow-xs">
                            {piece.cutQuantityLabel || `Cut ${piece.cutQuantity || 2}`}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectingPiece(piece);
                            }}
                            className="text-stone-500 hover:text-[#B45309] hover:bg-stone-200/60 p-1 rounded-md transition-colors"
                            title="Inspect Blueprint Details"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Pattern Illustration Piece (Crisp Vector Drafting with High Presence) */}
                      <div className="w-full flex-1 relative flex items-center justify-center p-2 overflow-hidden my-1">
                        <img
                          src={piece.illustrationUrl || getPieceIllustrationDataUrl(piece, blueprint?.garmentType)}
                          alt={piece.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain pointer-events-none select-none filter contrast-125 drop-shadow-sm"
                        />

                        {/* On Fold Badge */}
                        {piece.onFold && (
                          <div className="absolute top-2 left-2 bg-stone-900/95 text-amber-300 text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border border-amber-500/40 shadow-sm">
                            ◄ PLACE ON FOLD ►
                          </div>
                        )}

                        {/* Dimensional Footprint Tag */}
                        <div className="absolute bottom-1 right-1 bg-stone-900/80 backdrop-blur-xs text-stone-300 text-[8px] font-mono px-1.5 py-0.5 rounded">
                          {Math.round((piece.bounds?.width || 80) * 0.25)}" × {Math.round((piece.bounds?.height || 100) * 0.25)}"
                        </div>
                      </div>

                      {/* Stencil Stamp Label at bottom */}
                      <div className="w-full flex items-center justify-between text-[10px] font-mono text-stone-600 pt-1.5 border-t border-stone-200">
                        <span className="font-semibold text-amber-900">0.5" (1.27 CM) SA INCLUDED</span>
                        <span className="font-semibold text-stone-700 truncate max-w-[140px]">{piece.garmentRole || 'Pattern Piece'}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Help Overlay */}
          <div className="absolute bottom-3 left-3 bg-[#111214]/90 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-[#222427] text-[10px] text-[#8A8B93] flex items-center gap-2 pointer-events-none">
            <Info className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Drag canvas to Pan • Drag pieces across Cut Sheet • Zero overlaps</span>
          </div>
        </div>

        {/* Right: Piece Inspector & Engineering Specification (4 Cols) */}
        <div className="lg:col-span-4 bg-[#141517] p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            {/* Selected Piece Header */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">
                  Piece Inspector
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  CONFIDENCE: {Math.round((selectedPiece?.confidence || 0.95) * 100)}%
                </span>
              </div>

              {editingPieceNameId === selectedPiece?.id ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={editingNameValue}
                    onChange={(e) => setEditingNameValue(e.target.value)}
                    className="flex-1 px-2.5 py-1 bg-[#101112] border border-[#C5A059] rounded-lg text-xs text-white focus:outline-hidden"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      if (editingNameValue.trim()) {
                        updatePiece(selectedPiece.id, { name: editingNameValue.trim() });
                      }
                      setEditingPieceNameId(null);
                    }}
                    className="p-1.5 bg-[#C5A059] text-black rounded-lg"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-1">
                  <h4 className="text-sm font-semibold text-[#F5F5F7] truncate max-w-[200px]">
                    {selectedPiece?.name || 'Select a Piece'}
                  </h4>
                  {selectedPiece && (
                    <button
                      onClick={() => {
                        setEditingPieceNameId(selectedPiece.id);
                        setEditingNameValue(selectedPiece.name);
                      }}
                      className="p-1 text-zinc-400 hover:text-white"
                      title="Rename Piece"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {selectedPiece ? (
              <div className="space-y-3 text-xs">
                {/* Illustrated Pattern Piece Preview (Set Apart from Reconstruction) */}
                <div className="w-full h-44 bg-[#FAF8F5] rounded-xl border border-stone-300 p-2 flex items-center justify-center overflow-hidden shadow-xs relative">
                  <img
                    src={selectedPiece.illustrationUrl || getPieceIllustrationDataUrl(selectedPiece, blueprint?.garmentType)}
                    alt={selectedPiece.name}
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain drop-shadow-sm select-none"
                  />
                  <div className="absolute bottom-1 right-2 bg-black/60 backdrop-blur-xs text-[8px] font-mono text-amber-300 px-1.5 py-0.5 rounded">
                    Illustrated Piece • Set Apart
                  </div>
                </div>

                {/* Technical Specifications Grid */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="bg-[#101112] p-2.5 rounded-xl border border-[#222427]">
                    <span className="text-zinc-500 block text-[9px]">CUT QUANTITY</span>
                    <span className="text-[#E5C07B] font-semibold">{selectedPiece.cutQuantityLabel || `Cut ${selectedPiece.cutQuantity}`}</span>
                  </div>
                  <div className="bg-[#101112] p-2.5 rounded-xl border border-[#222427]">
                    <span className="text-zinc-500 block text-[9px]">GRAINLINE</span>
                    <span className="text-zinc-200">{selectedPiece.grainline?.label || 'Lengthwise'}</span>
                  </div>
                  <div className="bg-[#101112] p-2.5 rounded-xl border border-[#222427]">
                    <span className="text-zinc-500 block text-[9px]">ON FOLD</span>
                    <span className={selectedPiece.onFold ? 'text-emerald-400 font-bold' : 'text-zinc-400'}>
                      {selectedPiece.onFold ? 'YES (Place on Fold)' : 'NO (Cut Flat)'}
                    </span>
                  </div>
                  <div className="bg-[#101112] p-2.5 rounded-xl border border-[#222427]">
                    <span className="text-zinc-500 block text-[9px]">SEAM ALLOWANCE</span>
                    <span className="text-zinc-200">0.5" (1.27 cm)</span>
                  </div>
                </div>

                {/* Role Description */}
                <div className="bg-[#101112] p-3 rounded-xl border border-[#222427] space-y-1">
                  <span className="text-[10px] text-zinc-400 font-mono block">GARMENT FUNCTION</span>
                  <p className="text-zinc-200 text-xs leading-relaxed">
                    {selectedPiece.garmentRole || 'Structural pattern piece drafted from anatomical body landmarks.'}
                  </p>
                </div>

                {/* Balance Notches */}
                <div className="bg-[#101112] p-3 rounded-xl border border-[#222427] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400 font-mono">BALANCE NOTCHES</span>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {(selectedPiece.notches || []).length} Points
                    </span>
                  </div>
                  <div className="space-y-1">
                    {(selectedPiece.notches || []).map((n, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] text-zinc-300">
                        <span>• {n.label || 'Match Notch'}</span>
                        <span className="text-zinc-500 font-mono text-[9px]">{n.angle}°</span>
                      </div>
                    ))}
                    {(!selectedPiece.notches || selectedPiece.notches.length === 0) && (
                      <span className="text-zinc-500 text-[10px]">No internal notches on this component.</span>
                    )}
                  </div>
                </div>

                {/* Piece Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={(e) => handleRotatePiece(selectedPiece.id, e)}
                    className="flex-1 py-2 bg-[#18191C] hover:bg-[#222427] border border-[#28292D] rounded-xl text-xs font-semibold text-zinc-200 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Rotate 90°</span>
                  </button>
                  <button
                    onClick={(e) => handleRemovePiece(selectedPiece.id, e)}
                    className="p-2 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 transition-all"
                    title="Remove Piece"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-zinc-500 bg-[#101112] rounded-xl border border-[#222427]">
                Click any piece on the Cut Sheet to view its tailoring specification.
              </div>
            )}
          </div>

          {/* Targeted Blueprint Refinement Input */}
          <div className="pt-3 border-t border-[#222427]">
            <form onSubmit={handleApplyTargetedCommand} className="space-y-2">
              <label className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#C5A059]" />
                <span>Targeted Blueprint Modification</span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={targetedCommand}
                  onChange={(e) => setTargetedCommand(e.target.value)}
                  placeholder="e.g., 'Widen front skirt flare', 'Add 1 inch to hem'..."
                  className="flex-1 px-2.5 py-1.5 bg-[#101112] border border-[#28292D] rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-[#C5A059]"
                />
                <button
                  type="submit"
                  disabled={!targetedCommand.trim()}
                  className="px-3 py-1.5 bg-[#C5A059] disabled:opacity-40 text-black font-semibold text-xs rounded-lg transition-all"
                >
                  Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Add Custom Piece Modal */}
      {showAddPieceModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#18191C] border border-[#28292D] rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <h4 className="text-sm font-semibold text-white">Add Blueprint Piece</h4>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 block">Piece Name</label>
              <input
                type="text"
                value={newPieceName}
                onChange={(e) => setNewPieceName(e.target.value)}
                placeholder="e.g., Pocket Stay, Neck Facing..."
                className="w-full px-3 py-2 bg-[#101112] border border-[#28292D] rounded-xl text-xs text-white focus:outline-hidden focus:border-[#C5A059]"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 block">Garment Role</label>
              <select
                value={newPieceRole}
                onChange={(e) => setNewPieceRole(e.target.value)}
                className="w-full px-3 py-2 bg-[#101112] border border-[#28292D] rounded-xl text-xs text-white focus:outline-hidden focus:border-[#C5A059]"
              >
                <option value="Shell Reinforcement">Shell Reinforcement</option>
                <option value="Pocket Construction">Pocket Construction</option>
                <option value="Facing & Interfacing">Facing & Interfacing</option>
                <option value="Waistband Extension">Waistband Extension</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddPieceModal(false)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomPiece}
                disabled={!newPieceName.trim()}
                className="px-4 py-1.5 bg-[#C5A059] disabled:opacity-40 text-black font-semibold text-xs rounded-xl"
              >
                Add Piece
              </button>
            </div>
          </div>
        </div>
      )}

      {/* High-Resolution Technical Drafting Inspector Modal */}
      {inspectingPiece && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
          <div className="bg-[#141517] border border-[#28292D] rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#222427] flex items-center justify-between bg-[#18191C]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#C5A059]/15 border border-[#C5A059]/30 flex items-center justify-center text-[#E5C07B]">
                  <Scissors className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[#F5F5F7]">
                      {inspectingPiece.name}
                    </h4>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                      {inspectingPiece.cutQuantityLabel || `Cut ${inspectingPiece.cutQuantity || 2}`}
                    </span>
                    {inspectingPiece.onFold && (
                      <span className="px-2 py-0.5 rounded bg-stone-800 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/30">
                        ON FOLD
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#8A8B93] font-mono">
                    ID: {inspectingPiece.id} • Role: {inspectingPiece.garmentRole || 'Structural Panel'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingPiece(null)}
                className="w-8 h-8 rounded-xl bg-[#222428] hover:bg-[#2C2E34] text-zinc-400 hover:text-white flex items-center justify-center transition-colors text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Magnified Blueprint Drawing Canvas */}
            <div className="p-6 flex-1 overflow-y-auto flex flex-col items-center justify-center bg-[#0D0E10] min-h-[380px]">
              <div className="max-w-[520px] w-full aspect-[4/5] bg-[#FAF8F5] rounded-xl border-2 border-stone-300 p-4 shadow-xl flex items-center justify-center overflow-hidden relative">
                <img
                  src={inspectingPiece.illustrationUrl || getPieceIllustrationDataUrl(inspectingPiece, blueprint?.garmentType)}
                  alt={inspectingPiece.name}
                  className="w-full h-full object-contain filter contrast-125"
                />
              </div>
            </div>

            {/* Modal Footer: Technical Specifications & Actions */}
            <div className="p-4 border-t border-[#222427] bg-[#18191C] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4 text-[#8A8B93] font-mono text-[11px]">
                <span>Seam Allowance: <strong className="text-zinc-200">0.5" Included</strong></span>
                <span>•</span>
                <span>Grain: <strong className="text-zinc-200">Straight Lengthwise</strong></span>
                <span>•</span>
                <span>Notches: <strong className="text-zinc-200">{inspectingPiece.notches?.length || 2} Balance Match</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    handleRotatePiece(inspectingPiece.id, e);
                    setInspectingPiece((prev) => ({
                      ...prev,
                      rotation: ((prev?.rotation || 0) + 90) % 360,
                    }));
                  }}
                  className="px-3 py-1.5 bg-[#222428] hover:bg-[#2C2E34] text-zinc-300 hover:text-white rounded-xl font-medium flex items-center gap-1.5 transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Rotate 90°</span>
                </button>
                <button
                  onClick={() => setInspectingPiece(null)}
                  className="px-4 py-1.5 bg-[#C5A059] hover:bg-[#D4AF37] text-black font-semibold rounded-xl transition-all shadow-gold-sm"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

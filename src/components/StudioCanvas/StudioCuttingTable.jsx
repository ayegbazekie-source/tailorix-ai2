/**
 * TAILORIX AI — STUDIO CANVAS: INTERACTIVE DIGITAL CUTTING TABLE & WORKPLACE
 * Feature A: The main interactive cutting board, drafting playground, and pre-sewing digital workplace.
 * - Customizable Fabric Canvases (Linen, Denim, Silk, Wool, Poplin, Cutting Mat, Custom Swatches)
 * - Interactive Board Actions (Pan, Zoom, Drag, Rotate, Mirror/Flip, Place on Fold)
 * - Pattern Manipulation (Seam Allowance Overlay, Grainline Alignment, Darts, Notches, Measuring Tape)
 * - Freehand Tailor Chalk & Shears Tracing Tools
 * - Real-Time Fabric Consumption & Efficiency Calculator
 * - Direct Integration Hook accepting pattern payloads from Garment Deconstruct
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Scissors,
  Ruler,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  Pencil,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Download,
  Upload,
  Palette,
  Eye,
  EyeOff,
  Compass,
  Sparkles,
  RefreshCw,
  Sliders,
  Move,
  Info,
  ChevronDown,
} from 'lucide-react';
import { DECONSTRUCT_BENCHMARK_SAMPLES } from '../../data/deconstructSamples';
import { generatePattern } from '../../utils/patternEngine/patternRegistry';
import { getDefaultMeasurementsForGarment } from '../../models/measurementDefinitions';

// Fabric Texture Presets
const FABRIC_PRESETS = [
  {
    id: 'silk_satin',
    name: 'Mulberry Silk Satin Charmeuse',
    category: 'Silk & Luxury',
    baseColor: '#334155',
    textureCss: 'radial-gradient(ellipse at 50% 20%, rgba(255,255,255,0.12), transparent 70%), linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    grainDirection: 'warp',
    weight: '19 Momme (82 GSM)',
  },
  {
    id: 'selvedge_denim',
    name: 'Organic Raw Selvedge Denim',
    category: 'Cotton & Twill',
    baseColor: '#1e3a8a',
    textureCss: 'repeating-linear-gradient(45deg, #172554, #172554 2px, #1e3a8a 2px, #1e3a8a 4px)',
    grainDirection: 'warp',
    weight: '14.5 oz Right-Hand Twill',
  },
  {
    id: 'pure_linen',
    name: 'Natural Pure Irish Linen',
    category: 'Linen & Slub',
    baseColor: '#78716c',
    textureCss: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 4px), repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 4px), linear-gradient(to bottom, #44403c, #292524)',
    grainDirection: 'warp',
    weight: '210 GSM Medium Weight',
  },
  {
    id: 'wool_tweed',
    name: 'Savile Row Wool Flannel',
    category: 'Wool & Suiting',
    baseColor: '#475569',
    textureCss: 'repeating-linear-gradient(60deg, #334155, #334155 3px, #1e293b 3px, #1e293b 6px)',
    grainDirection: 'warp',
    weight: '340 GSM 11 oz Suiting',
  },
  {
    id: 'poplin_cotton',
    name: 'Crisp Poplin Cotton Shirting',
    category: 'Cotton & Woven',
    baseColor: '#0f172a',
    textureCss: 'linear-gradient(to right, #1e293b, #0f172a)',
    grainDirection: 'warp',
    weight: '120 GSM Plain Weave',
  },
  {
    id: 'cutting_mat',
    name: 'Self-Healing Cutting Mat (1" Grid)',
    category: 'Workbench Tool',
    baseColor: '#064e3b',
    textureCss: 'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, #064e3b, #022c22)',
    textureSize: '24px 24px',
    grainDirection: 'warp',
    weight: 'Heavy-Duty 3mm Vinyl',
  },
];

// Helper to generate sample pieces if no payload imported yet
function getSamplePatternSet(sampleId = 'sample_gown') {
  const sample = DECONSTRUCT_BENCHMARK_SAMPLES.find((s) => s.id === sampleId) || DECONSTRUCT_BENCHMARK_SAMPLES[0];
  const measurements = getDefaultMeasurementsForGarment(sample.category);
  const pattern = generatePattern(
    { garmentType: sample.category, silhouette: sample.specs.silhouette, name: sample.name },
    measurements,
    { seamAllowance: 0.5 }
  );

  return {
    garmentType: sample.name,
    fabricCanvasUrl: sample.defaultFabric || 'silk_satin',
    patternPieces: (pattern.pieces || []).map((p, idx) => ({
      id: p.id || `piece_${idx}`,
      name: p.name,
      cutQuantity: typeof p.cutQuantity === 'number' ? p.cutQuantity : (String(p.cutQuantity || '').includes('1') ? 1 : 2),
      cutQuantityLabel: typeof p.cutQuantity === 'string' ? p.cutQuantity : (p.cutQuantityLabel || (p.onFold ? 'Cut 1 on Fold' : 'Cut 2 (1 Pair)')),
      svgPath: p.path,
      isFold: Boolean(p.onFold),
      seamAllowance: p.seamAllowance ?? 0.5,
      seamAllowancePath: p.seamAllowancePath || null,
      bounds: p.bounds || { width: 140, height: 180, minX: 0, minY: 0 },
      grainline: p.grainline || { label: p.onFold ? 'CENTER FOLD' : 'LENGTHWISE GRAIN' },
      notches: p.notches || [],
      darts: p.darts || [],
      x: 60 + (idx % 3) * 260,
      y: 80 + Math.floor(idx / 3) * 320,
      rotation: 0,
      flipH: false,
      flipV: false,
    })),
  };
}

export default function StudioCuttingTable() {
  const location = useLocation();
  const navigate = useNavigate();

  // -------------------------------------------------------------
  // 1. Fabric Canvas State
  // -------------------------------------------------------------
  const [selectedFabric, setSelectedFabric] = useState(FABRIC_PRESETS[0]);
  const [customFabricImage, setCustomFabricImage] = useState(null);
  const [fabricWidthInches, setFabricWidthInches] = useState(58); // Standard 58" bolt
  const [fabricLengthYards, setFabricLengthYards] = useState(3.0); // 3 yards default
  const [foldMode, setFoldMode] = useState('lengthwise_fold'); // 'lengthwise_fold' | 'open_width' | 'crosswise_fold'
  const [grainDirection, setGrainDirection] = useState('warp'); // 'warp' | 'weft' | 'bias'

  // -------------------------------------------------------------
  // 2. Pattern Pieces State (Interactive Canvas Objects)
  // -------------------------------------------------------------
  const [garmentTitle, setGarmentTitle] = useState('Fitted Princess-Seam Sweetheart Midi Gown');
  const [pieces, setPieces] = useState([]);
  const [selectedPieceId, setSelectedPieceId] = useState(null);
  const [importedBannerNotice, setImportedBannerNotice] = useState(null);

  // -------------------------------------------------------------
  // 3. View & Navigation (Pan, Zoom, Rulers)
  // -------------------------------------------------------------
  const [zoom, setZoom] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 40, y: 40 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPos, setStartPanPos] = useState({ x: 0, y: 0 });

  // -------------------------------------------------------------
  // 4. Pattern Toggles & Manipulation Tools
  // -------------------------------------------------------------
  const [showSeamAllowance, setShowSeamAllowance] = useState(true);
  const [showGrainlineArrows, setShowGrainlineArrows] = useState(true);
  const [showDarts, setShowDarts] = useState(true);
  const [showNotches, setShowNotches] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [activeTool, setActiveTool] = useState('select'); // 'select' | 'chalk' | 'measure' | 'shears'

  // Chalk Drawing Tool State
  const [chalkColor, setChalkColor] = useState('#FFFFFF');
  const [chalkDrawings, setChalkDrawings] = useState([]);
  const [isDrawingChalk, setIsDrawingChalk] = useState(false);
  const [currentChalkPath, setCurrentChalkPath] = useState([]);

  // Measuring Tape State
  const [measuringTapePoints, setMeasuringTapePoints] = useState([]);

  // Dragging piece state
  const [draggingPieceId, setDraggingPieceId] = useState(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [pieceInitialPos, setPieceInitialPos] = useState({ x: 0, y: 0 });

  const tableContainerRef = useRef(null);

  // -------------------------------------------------------------
  // Integration Hook: Detect imported payload from Deconstruct
  // -------------------------------------------------------------
  useEffect(() => {
    let payload = location.state?.importedPayload;

    if (!payload) {
      // Check localStorage for saved payload
      try {
        const stored = localStorage.getItem('tailorix_studio_payload');
        if (stored) {
          payload = JSON.parse(stored);
        }
      } catch (err) {
        console.warn('Error reading stored payload:', err);
      }
    }

    if (payload && payload.patternPieces?.length) {
      setGarmentTitle(payload.garmentType || 'Imported Deconstruct Garment');
      if (payload.fabricCanvasUrl) {
        const found = FABRIC_PRESETS.find((f) => f.id === payload.fabricCanvasUrl);
        if (found) setSelectedFabric(found);
      }

      // Initialize pieces with coordinates
      const initialized = payload.patternPieces.map((p, idx) => ({
        ...p,
        x: p.x ?? (60 + (idx % 3) * 260),
        y: p.y ?? (80 + Math.floor(idx / 3) * 320),
        rotation: p.rotation ?? 0,
        flipH: p.flipH ?? false,
        flipV: p.flipV ?? false,
      }));

      setPieces(initialized);
      setSelectedPieceId(initialized[0]?.id || null);
      setImportedBannerNotice(
        `Imported ${initialized.length} pattern pieces from Deconstruct: ${payload.garmentType}`
      );
    } else {
      // Load standard default sample set
      const defaultSet = getSamplePatternSet('sample_gown');
      setGarmentTitle(defaultSet.garmentType);
      setPieces(defaultSet.patternPieces);
      setSelectedPieceId(defaultSet.patternPieces[0]?.id || null);
    }
  }, [location.state]);

  // Selected active piece object
  const selectedPiece = pieces.find((p) => p.id === selectedPieceId) || null;

  // -------------------------------------------------------------
  // Interactive Cutting Board Actions: Drag, Rotate, Flip, Fold Snap
  // -------------------------------------------------------------
  const handlePieceMouseDown = (e, piece) => {
    if (activeTool !== 'select') return;
    e.stopPropagation();
    setSelectedPieceId(piece.id);
    setDraggingPieceId(piece.id);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setPieceInitialPos({ x: piece.x, y: piece.y });
  };

  const handleTableMouseMove = (e) => {
    if (draggingPieceId && activeTool === 'select') {
      const dx = (e.clientX - dragStartPos.x) / zoom;
      const dy = (e.clientY - dragStartPos.y) / zoom;
      setPieces((prev) =>
        prev.map((p) =>
          p.id === draggingPieceId
            ? { ...p, x: Math.max(10, pieceInitialPos.x + dx), y: Math.max(10, pieceInitialPos.y + dy) }
            : p
        )
      );
    } else if (isPanning) {
      const dx = e.clientX - startPanPos.x;
      const dy = e.clientY - startPanPos.y;
      setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setStartPanPos({ x: e.clientX, y: e.clientY });
    } else if (isDrawingChalk && activeTool === 'chalk') {
      const rect = tableContainerRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - panOffset.x) / zoom;
        const y = (e.clientY - rect.top - panOffset.y) / zoom;
        setCurrentChalkPath((prev) => [...prev, { x, y }]);
      }
    }
  };

  const handleTableMouseUp = () => {
    setDraggingPieceId(null);
    setIsPanning(false);
    if (isDrawingChalk && currentChalkPath.length > 1) {
      setChalkDrawings((prev) => [
        ...prev,
        { id: `chalk_${Date.now()}`, points: currentChalkPath, color: chalkColor },
      ]);
    }
    setIsDrawingChalk(false);
    setCurrentChalkPath([]);
  };

  // Start Canvas Pan
  const handleTableMouseDown = (e) => {
    if (activeTool === 'chalk') {
      const rect = tableContainerRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - panOffset.x) / zoom;
        const y = (e.clientY - rect.top - panOffset.y) / zoom;
        setIsDrawingChalk(true);
        setCurrentChalkPath([{ x, y }]);
      }
      return;
    }

    if (activeTool === 'measure') {
      const rect = tableContainerRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - panOffset.x) / zoom;
        const y = (e.clientY - rect.top - panOffset.y) / zoom;
        if (measuringTapePoints.length >= 2) {
          setMeasuringTapePoints([{ x, y }]);
        } else {
          setMeasuringTapePoints((prev) => [...prev, { x, y }]);
        }
      }
      return;
    }

    // Default pan
    if (e.target === tableContainerRef.current || e.target.closest('.fabric-board-surface')) {
      setIsPanning(true);
      setStartPanPos({ x: e.clientX, y: e.clientY });
      setSelectedPieceId(null);
    }
  };

  // Rotate piece (clockwise)
  const handleRotatePiece = (angleDelta) => {
    if (!selectedPieceId) return;
    setPieces((prev) =>
      prev.map((p) =>
        p.id === selectedPieceId ? { ...p, rotation: (p.rotation + angleDelta + 360) % 360 } : p
      )
    );
  };

  // Realign piece to parallel grainline (0 deg)
  const handleAlignToGrain = (pieceId) => {
    setPieces((prev) => prev.map((p) => (p.id === pieceId ? { ...p, rotation: 0 } : p)));
  };

  // Flip Horizontal
  const handleFlipH = () => {
    if (!selectedPieceId) return;
    setPieces((prev) =>
      prev.map((p) => (p.id === selectedPieceId ? { ...p, flipH: !p.flipH } : p))
    );
  };

  // Flip Vertical
  const handleFlipV = () => {
    if (!selectedPieceId) return;
    setPieces((prev) =>
      prev.map((p) => (p.id === selectedPieceId ? { ...p, flipV: !p.flipV } : p))
    );
  };

  // Place on Fold Snap
  const handlePlaceOnFold = () => {
    if (!selectedPieceId) return;
    // Align flush against top fold edge (Y = 16px) with 0 rotation
    setPieces((prev) =>
      prev.map((p) =>
        p.id === selectedPieceId ? { ...p, y: 18, rotation: 0 } : p
      )
    );
  };

  // Duplicate Piece
  const handleDuplicatePiece = () => {
    if (!selectedPiece) return;
    const newPiece = {
      ...selectedPiece,
      id: `${selectedPiece.id}_copy_${Date.now()}`,
      name: `${selectedPiece.name} (Copy)`,
      x: selectedPiece.x + 30,
      y: selectedPiece.y + 30,
    };
    setPieces((prev) => [...prev, newPiece]);
    setSelectedPieceId(newPiece.id);
  };

  // Delete Piece
  const handleDeletePiece = () => {
    if (!selectedPieceId) return;
    setPieces((prev) => prev.filter((p) => p.id !== selectedPieceId));
    setSelectedPieceId(null);
  };

  // Custom Fabric Upload
  const handleFabricUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomFabricImage(url);
    }
  };

  // Load Preset Pattern Set
  const handleLoadSampleSet = (sampleId) => {
    const s = getSamplePatternSet(sampleId);
    setGarmentTitle(s.garmentType);
    setPieces(s.patternPieces);
    setSelectedPieceId(s.patternPieces[0]?.id || null);
    setImportedBannerNotice(`Loaded pattern slopers: ${s.garmentType}`);
  };

  // -------------------------------------------------------------
  // Real-Time Fabric Consumption & Layout Efficiency
  // -------------------------------------------------------------
  const markerMetrics = useMemo(() => {
    const PIXELS_PER_INCH = 12; // 12px = 1 inch
    const fabricPixelWidth = fabricWidthInches * PIXELS_PER_INCH;
    const fabricPixelLength = fabricLengthYards * 36 * PIXELS_PER_INCH;

    let maxX = 0;
    let maxY = 0;
    let totalPieceArea = 0;
    let piecesOffGrainCount = 0;
    let piecesOverflowWidth = false;

    pieces.forEach((p) => {
      const b = p.bounds || { width: 120, height: 160 };
      const right = p.x + b.width;
      const bottom = p.y + b.height;
      if (right > maxX) maxX = right;
      if (bottom > maxY) maxY = bottom;
      totalPieceArea += b.width * b.height;

      // Off grain check (if rotated > 5 degrees from 0 or 180)
      const rot = Math.abs(p.rotation % 180);
      if (rot > 5 && rot < 175) {
        piecesOffGrainCount++;
      }

      // Check width overflow
      if (p.x + b.width > fabricPixelWidth) {
        piecesOverflowWidth = true;
      }
    });

    const usedInches = Math.max(12, Math.ceil(maxX / PIXELS_PER_INCH));
    const usedYards = (usedInches / 36).toFixed(2);
    const usedMeters = ((usedInches * 0.0254)).toFixed(2);

    const activeFabricArea = Math.max(1, maxX * fabricPixelWidth);
    const efficiency = Math.min(96, Math.round((totalPieceArea / activeFabricArea) * 100));

    return {
      usedInches,
      usedYards,
      usedMeters,
      efficiency: Math.max(12, efficiency),
      piecesOffGrainCount,
      piecesOverflowWidth,
      totalPieces: pieces.length,
    };
  }, [pieces, fabricWidthInches, fabricLengthYards]);

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] bg-slate-950 text-slate-100 flex flex-col select-none overflow-hidden font-sans">
      {/* ========================================================================= */}
      {/* TOP CONTROL BAR: TITLE, FABRIC SELECTOR, TOOLS & STATS                    */}
      {/* ========================================================================= */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-30 shrink-0">
        {/* Left: Garment Title & Status */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Scissors className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-sm text-slate-100 tracking-tight truncate max-w-[220px] sm:max-w-xs">
                {garmentTitle}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 text-[10px] font-mono border border-slate-700">
                {pieces.length} Pieces
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block font-mono">
              Digital Cutting Board // 1:1 Scale Table
            </span>
          </div>
        </div>

        {/* Center: Interactive Tool Rail */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTool('select')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTool === 'select'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Move className="w-3.5 h-3.5" />
            <span>Select & Arrange</span>
          </button>

          <button
            onClick={() => setActiveTool('chalk')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTool === 'chalk'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Tailor's Chalk</span>
          </button>

          {activeTool === 'chalk' && (
            <div className="flex items-center gap-1 border-l border-slate-800 pl-1.5 ml-1">
              {[
                { name: 'White', hex: '#FFFFFF' },
                { name: 'Yellow', hex: '#FACC15' },
                { name: 'Blue', hex: '#38BDF8' },
                { name: 'Red', hex: '#F87171' },
              ].map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setChalkColor(c.hex)}
                  className={`w-4 h-4 rounded-full border border-slate-700 ${
                    chalkColor === c.hex ? 'ring-2 ring-amber-400 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={`${c.name} Chalk`}
                />
              ))}
              {chalkDrawings.length > 0 && (
                <button
                  onClick={() => setChalkDrawings([])}
                  className="p-1 text-slate-500 hover:text-red-400 rounded text-[10px] ml-1"
                  title="Clear Chalk Marks"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => {
              setActiveTool('measure');
              setMeasuringTapePoints([]);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTool === 'measure'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Tape Guide</span>
          </button>
        </div>

        {/* Right: Fabric Consumption Yardage & Export CTA */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-500 block">FABRIC YIELD</span>
              <span className="font-bold text-amber-400">{markerMetrics.usedYards} yds ({markerMetrics.usedMeters}m)</span>
            </div>
            <div className="border-l border-slate-800 pl-3">
              <span className="text-[10px] text-slate-500 block">EFFICIENCY</span>
              <span className="font-bold text-emerald-400">{markerMetrics.efficiency}%</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/deconstruct')}
            className="px-3 py-1.5 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">Deconstruct Tool</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECONDARY TOOLBAR: FABRIC SETTINGS, GRAINLINES & OVERLAYS                 */}
      {/* ========================================================================= */}
      <div className="h-11 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between text-xs z-20 overflow-x-auto gap-4">
        {/* Left: Fabric Swatch Preset Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <Palette className="w-3 h-3 text-amber-400" />
            Fabric:
          </span>

          <select
            value={selectedFabric.id}
            onChange={(e) => {
              const found = FABRIC_PRESETS.find((f) => f.id === e.target.value);
              if (found) {
                setSelectedFabric(found);
                setCustomFabricImage(null);
              }
            }}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            {FABRIC_PRESETS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.weight})
              </option>
            ))}
          </select>

          {/* Upload Custom Fabric Pattern Swatch */}
          <label className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 cursor-pointer transition-colors" title="Upload Custom Fabric Pattern Image">
            <input type="file" accept="image/*" onChange={handleFabricUpload} className="hidden" />
            <Upload className="w-3.5 h-3.5" />
          </label>

          {/* Bolt Width */}
          <div className="flex items-center gap-1 ml-2 border-l border-slate-800 pl-2">
            <span className="text-slate-500 text-[11px]">Bolt:</span>
            {[45, 54, 58, 60].map((w) => (
              <button
                key={w}
                onClick={() => setFabricWidthInches(w)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                  fabricWidthInches === w
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white bg-slate-800/60'
                }`}
              >
                {w}"
              </button>
            ))}
          </div>

          {/* Fold Mode */}
          <div className="flex items-center gap-1 ml-2 border-l border-slate-800 pl-2">
            <span className="text-slate-500 text-[11px]">Layout:</span>
            {[
              { id: 'lengthwise_fold', label: 'On Fold (Selvage-to-Selvage)' },
              { id: 'open_width', label: 'Open Flat (Single Layer)' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setFoldMode(m.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  foldMode === m.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Toggles for Seam Allowance, Grainlines, Darts */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowSeamAllowance(!showSeamAllowance)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              showSeamAllowance ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Seam Allowance Outer Offset"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Seam Allowance</span>
          </button>

          <button
            onClick={() => setShowGrainlineArrows(!showGrainlineArrows)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              showGrainlineArrows ? 'bg-slate-800 text-amber-400' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Grainline Alignment Indicators"
          >
            <Compass className="w-3 h-3 text-amber-400" />
            <span>Grainlines</span>
          </button>

          <button
            onClick={() => setShowDarts(!showDarts)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              showDarts ? 'bg-slate-800 text-sky-400' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Darts & Notches"
          >
            <span>Darts & Notches</span>
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
            <button
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[10px] text-slate-400 w-9 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setZoom(1.0);
                setPanOffset({ x: 40, y: 40 });
              }}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white ml-0.5"
              title="Reset View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Optional Banner Notice from Deconstruct Export */}
      {importedBannerNotice && (
        <div className="bg-emerald-950/80 border-b border-emerald-800/80 px-4 py-1.5 text-xs text-emerald-300 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="font-medium">{importedBannerNotice}</span>
          </div>
          <button
            onClick={() => setImportedBannerNotice(null)}
            className="text-emerald-400 hover:text-white text-[11px] underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN WORKSPACE: THE DIGITAL FABRIC CUTTING TABLE                           */}
      {/* ========================================================================= */}
      <div
        ref={tableContainerRef}
        onMouseDown={handleTableMouseDown}
        onMouseMove={handleTableMouseMove}
        onMouseUp={handleTableMouseUp}
        className={`relative flex-1 overflow-hidden bg-slate-950 select-none ${
          activeTool === 'chalk'
            ? 'cursor-crosshair'
            : activeTool === 'measure'
            ? 'cursor-cell'
            : isPanning
            ? 'cursor-grabbing'
            : 'cursor-grab'
        }`}
      >
        {/* Transform Stage (Panned & Zoomed) */}
        <div
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
          className="absolute inset-0 pointer-events-none"
        >
          {/* THE RAW PHYSICAL FABRIC CANVAS RECTANGLE */}
          <div
            className="fabric-board-surface relative pointer-events-auto rounded-xl shadow-2xl border border-slate-700/80 overflow-hidden"
            style={{
              width: `${fabricWidthInches * 12}px`, // 12px per inch
              height: `${fabricLengthYards * 36 * 12}px`, // 36 inches per yard * 12px
              backgroundColor: selectedFabric.baseColor,
              backgroundImage: customFabricImage
                ? `url(${customFabricImage})`
                : selectedFabric.textureCss,
              backgroundSize: selectedFabric.textureSize || 'auto',
            }}
          >
            {/* Lengthwise Grain Simulation Overlay lines */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(0deg, #FFFFFF 0px, #FFFFFF 1px, transparent 1px, transparent 32px)',
              }}
            />

            {/* Fold & Selvage Edge Guides */}
            {foldMode === 'lengthwise_fold' ? (
              <>
                {/* Top Fold Edge */}
                <div className="absolute top-0 left-0 right-0 h-8 bg-amber-500/10 border-b-2 border-dashed border-amber-400/80 flex items-center px-4 justify-between pointer-events-none">
                  <span className="text-[11px] font-black text-amber-300 font-mono tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    FOLD LINE — PLACE ON FOLD PIECES FLUSH HERE
                  </span>
                  <span className="text-[10px] text-amber-300/70 font-mono">NO SEAM ALLOWANCE AT FOLD</span>
                </div>

                {/* Bottom Selvage Edge */}
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-slate-900/60 border-t-2 border-slate-600/80 flex items-center px-4 justify-between pointer-events-none">
                  <span className="text-[11px] font-bold text-slate-400 font-mono tracking-wider">
                    SELVAGE EDGES (RAW FABRIC BOUNDARY)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Parallel to Lengthwise Warp Grain</span>
                </div>
              </>
            ) : (
              <div className="absolute top-0 left-0 right-0 h-6 bg-slate-900/40 border-b border-slate-700 flex items-center px-4 pointer-events-none">
                <span className="text-[10px] text-slate-400 font-mono">OPEN SINGLE LAYER CUTTING LAYOUT</span>
              </div>
            )}

            {/* Inch Grid Rule Indicators along left edge */}
            <div className="absolute top-0 left-0 bottom-0 w-8 bg-slate-950/40 border-r border-slate-700/60 pointer-events-none flex flex-col justify-between py-2 text-[9px] font-mono text-slate-400 px-1">
              <span>0"</span>
              <span>36" (1 yd)</span>
              <span>72" (2 yd)</span>
              <span>108" (3 yd)</span>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* PATTERN PIECES LYING ON THE FABRIC CUTTING TABLE              */}
            {/* ------------------------------------------------------------- */}
            {pieces.map((piece) => {
              const isSelected = selectedPieceId === piece.id;
              const b = piece.bounds || { width: 140, height: 180, minX: 0, minY: 0 };
              const rot = Math.abs(piece.rotation % 180);
              const isOffGrain = rot > 5 && rot < 175;

              return (
                <div
                  key={piece.id}
                  onMouseDown={(e) => handlePieceMouseDown(e, piece)}
                  style={{
                    position: 'absolute',
                    left: `${piece.x}px`,
                    top: `${piece.y}px`,
                    width: `${b.width}px`,
                    height: `${b.height}px`,
                    transform: `rotate(${piece.rotation}deg) scaleX(${piece.flipH ? -1 : 1}) scaleY(${piece.flipV ? -1 : 1})`,
                    transformOrigin: 'center center',
                  }}
                  className={`pointer-events-auto cursor-move transition-shadow ${
                    isSelected
                      ? 'ring-2 ring-amber-400 shadow-2xl z-20'
                      : 'hover:ring-1 hover:ring-amber-400/50 z-10'
                  }`}
                >
                  {/* SVG Line Art & Geometry Render */}
                  <svg
                    viewBox={`${b.minX - 10} ${b.minY - 10} ${b.width + 20} ${b.height + 20}`}
                    className="w-full h-full filter drop-shadow-md overflow-visible"
                  >
                    {/* Seam Allowance Offset Path (Dashed) */}
                    {showSeamAllowance && piece.seamAllowancePath && (
                      <path
                        d={piece.seamAllowancePath}
                        fill="none"
                        stroke="#94A3B8"
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                      />
                    )}

                    {/* Primary Cutline Geometry Path */}
                    <path
                      d={piece.svgPath}
                      fill={isSelected ? '#0284C7' : '#0F172A'}
                      fillOpacity={isSelected ? 0.35 : 0.25}
                      stroke={isSelected ? '#38BDF8' : '#F1F5F9'}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Grainline Arrow Indicator */}
                    {showGrainlineArrows && piece.grainline && (
                      <g stroke="#FACC15" strokeWidth="2">
                        <line
                          x1={piece.grainline.x1}
                          y1={piece.grainline.y1}
                          x2={piece.grainline.x2}
                          y2={piece.grainline.y2}
                        />
                        <polygon
                          points={`${piece.grainline.x2},${piece.grainline.y2} ${piece.grainline.x2 - 5},${piece.grainline.y2 + 8} ${piece.grainline.x2 + 5},${piece.grainline.y2 + 8}`}
                          fill="#FACC15"
                        />
                        <circle cx={piece.grainline.x1} cy={piece.grainline.y1} r="3.5" fill="#FACC15" />
                      </g>
                    )}
                  </svg>

                  {/* Piece Header Label Floating on Piece */}
                  <div className="absolute top-2 left-2 bg-slate-900/90 backdrop-blur-xs border border-slate-700/80 px-2 py-1 rounded-md text-[10px] pointer-events-none max-w-[150px] shadow-md">
                    <span className="font-extrabold text-slate-100 block truncate">
                      {piece.name}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] text-amber-400 font-mono font-bold">
                        {piece.cutQuantityLabel || (piece.isFold ? 'Cut 1 on Fold' : 'Cut 2 (Pair)')}
                      </span>
                      {piece.isFold && (
                        <span className="text-[8px] bg-emerald-500/20 text-emerald-300 font-extrabold px-1 rounded">
                          FOLD
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Off-Grain Warning Indicator */}
                  {isOffGrain && showGrainlineArrows && (
                    <div className="absolute bottom-2 right-2 bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded shadow flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-slate-950" />
                      <span>Off-Grain ({piece.rotation}°)</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* ------------------------------------------------------------- */}
            {/* TAILOR CHALK DRAWING LAYER OVERLAY                            */}
            {/* ------------------------------------------------------------- */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {chalkDrawings.map((draw) => (
                <polyline
                  key={draw.id}
                  points={draw.points.map((pt) => `${pt.x},${pt.y}`).join(' ')}
                  fill="none"
                  stroke={draw.color}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.85"
                />
              ))}
              {currentChalkPath.length > 1 && (
                <polyline
                  points={currentChalkPath.map((pt) => `${pt.x},${pt.y}`).join(' ')}
                  fill="none"
                  stroke={chalkColor}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.9"
                />
              )}
            </svg>

            {/* ------------------------------------------------------------- */}
            {/* INTERACTIVE MEASURING TAPE RULER OVERLAY                      */}
            {/* ------------------------------------------------------------- */}
            {activeTool === 'measure' && measuringTapePoints.length > 0 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {measuringTapePoints.length === 2 && (
                  <>
                    <line
                      x1={measuringTapePoints[0].x}
                      y1={measuringTapePoints[0].y}
                      x2={measuringTapePoints[1].x}
                      y2={measuringTapePoints[1].y}
                      stroke="#FACC15"
                      strokeWidth="2"
                      strokeDasharray="6 3"
                    />
                    <circle cx={measuringTapePoints[0].x} cy={measuringTapePoints[0].y} r="5" fill="#FACC15" />
                    <circle cx={measuringTapePoints[1].x} cy={measuringTapePoints[1].y} r="5" fill="#FACC15" />
                    {/* Measurement Callout Badge */}
                    <text
                      x={(measuringTapePoints[0].x + measuringTapePoints[1].x) / 2}
                      y={(measuringTapePoints[0].y + measuringTapePoints[1].y) / 2 - 10}
                      fill="#FACC15"
                      fontSize="12"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="font-mono bg-slate-900"
                    >
                      {(
                        Math.hypot(
                          measuringTapePoints[1].x - measuringTapePoints[0].x,
                          measuringTapePoints[1].y - measuringTapePoints[0].y
                        ) / 12
                      ).toFixed(2)}"
                    </text>
                  </>
                )}
              </svg>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FLOATING ACTION PANEL: SELECTED PIECE MANIPULATION CONTROLS               */}
        {/* ========================================================================= */}
        {selectedPiece && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-2 sm:p-2.5 shadow-2xl flex items-center gap-1.5 sm:gap-2 z-40 max-w-[95vw] overflow-x-auto ring-1 ring-white/10">
            <div className="px-2 border-r border-slate-800 shrink-0">
              <span className="font-extrabold text-xs text-amber-400 block truncate max-w-[140px]">
                {selectedPiece.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">
                Rotation: {selectedPiece.rotation}°
              </span>
            </div>

            {/* Quick Rotate 45° and 90° */}
            <button
              onClick={() => handleRotatePiece(45)}
              className="min-h-[44px] px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-all flex items-center gap-1 shrink-0"
              title="Rotate 45 degrees clockwise"
            >
              <RotateCw className="w-3.5 h-3.5 text-amber-400" />
              <span>45°</span>
            </button>

            <button
              onClick={() => handleRotatePiece(90)}
              className="min-h-[44px] px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-all flex items-center gap-1 shrink-0"
              title="Rotate 90 degrees clockwise"
            >
              <RotateCw className="w-3.5 h-3.5 text-amber-400" />
              <span>90°</span>
            </button>

            {/* Realign to Grain */}
            <button
              onClick={() => handleAlignToGrain(selectedPiece.id)}
              className="min-h-[44px] px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-all flex items-center gap-1 shrink-0"
              title="Realign grainline parallel to warp"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Grain</span>
            </button>

            {/* Mirror / Flip Horizontal */}
            <button
              onClick={handleFlipH}
              className={`min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
                selectedPiece.flipH
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
              title="Flip Horizontal (Mirror Pair)"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              <span>Flip H</span>
            </button>

            {/* Snap to Fold */}
            {selectedPiece.isFold && (
              <button
                onClick={handlePlaceOnFold}
                className="min-h-[44px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-black transition-all flex items-center gap-1 shrink-0 shadow-xs"
                title="Snap flush against top fold line"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Snap to Fold</span>
              </button>
            )}

            {/* Duplicate Piece */}
            <button
              onClick={handleDuplicatePiece}
              className="min-h-[44px] p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white shrink-0"
              title="Duplicate piece"
            >
              <Copy className="w-4 h-4" />
            </button>

            {/* Delete Piece */}
            <button
              onClick={handleDeletePiece}
              className="min-h-[44px] p-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 hover:text-red-100 border border-red-800/60 shrink-0"
              title="Delete piece from cutting board"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Floating Quick Yardage Meter (Mobile & Tablet) */}
        <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl shadow-xl z-20 text-[11px] font-mono flex items-center gap-3">
          <div>
            <span className="text-[10px] text-slate-500 block">TABLE REQ</span>
            <span className="font-bold text-amber-400">{markerMetrics.usedYards} yds</span>
          </div>
          <div className="border-l border-slate-800 pl-3">
            <span className="text-[10px] text-slate-500 block">PIECES</span>
            <span className="font-bold text-slate-200">{pieces.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  X,
  Trash2,
  Layers,
  Scissors,
  Sparkles,
  Box,
  FlipHorizontal,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { useCanvas } from '../../context/CanvasContext';

export default function LayerPanel({ isOpen, onClose }) {
  const {
    isLayerPanelOpen,
    setIsLayerPanelOpen,
    layers,
    activeLayerId,
    setActiveLayerId,
    toggleLayerVisibility,
    toggleLayerLock,
    addLayer,
    deleteLayer,
    addSheet,
    sheets,
    fabricCanvasInstance,
    toggleSheetMirror,
    shiftFabricOnTable,
  } = useCanvas();

  const [newLayerName, setNewLayerName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Enforce default collapsed state
  const shouldRender = isOpen !== undefined ? isOpen : isLayerPanelOpen;
  if (!shouldRender) return null;

  const handleClose = () => {
    if (onClose) onClose();
    if (setIsLayerPanelOpen) setIsLayerPanelOpen(false);
  };

  const activeLayer = layers?.find((l) => l.id === activeLayerId);
  const activeObj = fabricCanvasInstance?.getActiveObject?.();
  const isPatternOrDraftActive = Boolean(
    activeLayer?.isPattern ||
    activeLayer?.isDraft ||
    activeLayer?.type?.includes('bodice') ||
    activeLayer?.origin === 'drafting_board' ||
    activeObj ||
    sheets?.some((s) => s.id === activeLayerId)
  );

  // Requirement 3: Mirror Active Layer horizontally
  const handleMirrorActiveObject = () => {
    if (fabricCanvasInstance) {
      const active = fabricCanvasInstance.getActiveObject();
      if (active) {
        active.set('flipX', !active.flipX);
        fabricCanvasInstance.renderAll();
      }
    }
    const activeSheet = sheets?.find((s) => s.id === activeLayerId || s.layerId === activeLayerId);
    if (activeSheet && toggleSheetMirror) {
      toggleSheetMirror(activeSheet.id);
    }
  };

  // Bodice section presets with corresponding customizable cutting sheets
  const bodiceSectionPresets = [
    {
      label: '+ Front Bodice',
      layerName: 'Front Bodice Panel',
      sheetName: 'Front Bodice Sheet',
      type: 'bodice_front',
      width: 320,
      height: 420,
      isMirrored: true, // Center fold mirror
      desc: 'Center front bodice on fold with princess contour'
    },
    {
      label: '+ Back Bodice',
      layerName: 'Back Bodice Panel',
      sheetName: 'Back Bodice Sheet',
      type: 'bodice_back',
      width: 300,
      height: 400,
      isMirrored: true,
      desc: 'Center back zipper allowance with shoulder dart'
    },
    {
      label: '+ Sleeve Panel',
      layerName: 'Fitted Sleeve',
      sheetName: 'Fitted Sleeve Sheet',
      type: 'sleeve',
      width: 280,
      height: 440,
      isMirrored: false,
      desc: 'Anatomical sleeve cap and wrist taper'
    },
    {
      label: '+ Collar / Facing',
      layerName: 'Collar & Facing',
      sheetName: 'Collar Facing Sheet',
      type: 'collar',
      width: 240,
      height: 180,
      isMirrored: true,
      desc: 'Stand collar and front neckline facing'
    },
    {
      label: '+ Side Bodice / Dart',
      layerName: 'Side Princess Panel',
      sheetName: 'Side Panel Sheet',
      type: 'side_bodice',
      width: 220,
      height: 380,
      isMirrored: false,
      desc: 'Bust apex shaping and side seam curve'
    }
  ];

  // Dynamically instantiate new layer AND customizable white cutting sheet on click
  const handleInstantiateBodiceSection = (preset) => {
    // 1. Create dynamic CAD layer
    if (addLayer) {
      addLayer(preset.layerName, preset.type);
    }

    // 2. Create customizable white rectangular cutting sheet on the active grid
    if (addSheet) {
      const offsetIndex = sheets ? sheets.length : 0;
      addSheet({
        name: preset.sheetName,
        type: preset.type,
        width: preset.width,
        height: preset.height,
        x: 80 + (offsetIndex % 3) * 50,
        y: 100 + Math.floor(offsetIndex / 3) * 50,
        opacity: 0.85,
        isLocked: false,
        isMirrored: preset.isMirrored,
        color: '#FFFFFF',
      });
    }
  };

  const handleCreateCustomLayer = (e) => {
    e.preventDefault();
    if (newLayerName.trim()) {
      if (addLayer) {
        addLayer(newLayerName.trim(), 'custom');
      }
      if (addSheet) {
        addSheet({
          name: `${newLayerName.trim()} Sheet`,
          width: 300,
          height: 360,
          opacity: 0.85,
          color: '#FFFFFF',
        });
      }
      setNewLayerName('');
      setIsAdding(false);
    }
  };

  // Panel return
  return (
    <div
      className="absolute top-16 right-4 sm:right-6 z-50 w-84 max-w-[92vw] max-h-[80vh] overflow-y-auto bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 shadow-2xl text-slate-100 ring-1 ring-white/10 select-none animate-in fade-in zoom-in-95 duration-150"
      id="studio-layer-panel"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-amber-400">
            CAD LAYER STACK
          </h3>
          <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
            {layers?.length || 0}
          </span>
        </div>

        <button
          onClick={handleClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Close Layer Panel"
          id="btn-close-layer-panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Bodice Section Buttons: Dynamically creates cutting sheet & layer on click */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Scissors className="w-3 h-3 text-amber-400" />
            <span>Add Bodice Section Sheet</span>
          </span>
          <span className="text-[9px] font-mono text-amber-400/80">DYNAMIC SPAWN</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {bodiceSectionPresets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handleInstantiateBodiceSection(preset)}
              className="py-1.5 px-2 bg-slate-800/90 hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-[10px] font-bold uppercase tracking-wide rounded-xl border border-slate-700/60 hover:border-amber-400 transition-all text-left truncate flex items-center justify-between group"
              title={preset.desc}
            >
              <span className="truncate">{preset.label}</span>
              <Plus className="w-3 h-3 opacity-60 group-hover:opacity-100 shrink-0 ml-1" />
            </button>
          ))}
        </div>
      </div>

      {/* Existing Layers List */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          <span>ACTIVE CANVAS LAYERS</span>
          <span className="text-slate-500 font-mono">
            {sheets?.length || 0} Sheets Active
          </span>
        </div>

        {layers?.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 text-xs">
            Canvas initialized empty. Click any Bodice button above to spawn custom cutting sheets.
          </div>
        ) : (
          layers?.map((layer) => {
            const isActive = activeLayerId === layer.id;
            return (
              <div
                key={layer.id}
                onClick={() => setActiveLayerId(layer.id)}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-800/95 border-amber-400/70 text-amber-300 shadow-sm ring-1 ring-amber-400/20'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isActive ? 'bg-amber-400' : 'bg-slate-600'
                    }`}
                  />
                  <span className="text-xs font-bold truncate max-w-[130px] uppercase tracking-wide">
                    {layer.name}
                  </span>
                  {isActive && (
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-sm shrink-0">
                      ACTIVE
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Visibility Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (toggleLayerVisibility) toggleLayerVisibility(layer.id);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 transition-colors"
                    title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                  >
                    {layer.visible ? (
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </button>

                  {/* Lock Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (toggleLayerLock) toggleLayerLock(layer.id);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 transition-colors"
                    title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
                  >
                    {layer.locked ? (
                      <Lock className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </button>

                  {/* Delete Layer */}
                  {deleteLayer && layers.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLayer(layer.id);
                      }}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Layer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Custom New Layer Form */}
      {isAdding ? (
        <form
          onSubmit={handleCreateCustomLayer}
          className="mb-3 pt-2 border-t border-slate-800 flex items-center gap-1.5"
        >
          <input
            type="text"
            value={newLayerName}
            onChange={(e) => setNewLayerName(e.target.value)}
            placeholder="LAYER NAME (E.G. WAISTBAND)"
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
            autoFocus
          />
          <button
            type="submit"
            className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase rounded-lg transition-colors"
          >
            ADD
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false);
              setNewLayerName('');
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full mb-3 py-1.5 px-2.5 rounded-xl border border-dashed border-slate-700 hover:border-amber-400/60 text-slate-400 hover:text-amber-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors bg-slate-900/40"
          id="btn-add-new-layer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>NEW CUSTOM LAYER</span>
        </button>
      )}

      {/* Requirement 3: Conditional Mirror Tool in Object Editing Panel */}
      {isPatternOrDraftActive && (
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 mb-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wide">
            <span>LAYER INSPECTOR</span>
            <span className="text-amber-400 font-mono text-[10px] truncate max-w-[120px]">
              {activeLayer?.name || 'Pattern Layer'}
            </span>
          </div>
          <button
            onClick={handleMirrorActiveObject}
            className="w-full py-2 px-3 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 hover:text-amber-200 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
            title="Mirror / Horizontal Flip active pattern layer"
            id="btn-mirror-layer-panel"
          >
            <FlipHorizontal className="w-4 h-4 text-amber-400" />
            <span>Mirror Layer (Horizontal Flip)</span>
          </button>
        </div>
      )}

      {/* Requirement 7: Shift Fabric on Table Controls */}
      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 mb-3">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wide">
          <span>Shift Fabric on Table</span>
          <span className="text-[10px] text-slate-500 font-mono">20px</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 max-w-[130px] mx-auto">
          <div />
          <button
            type="button"
            onClick={() => shiftFabricOnTable && shiftFabricOnTable('up', 20)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors"
            title="Shift Fabric Up"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <div />
          <button
            type="button"
            onClick={() => shiftFabricOnTable && shiftFabricOnTable('left', 20)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors"
            title="Shift Fabric Left"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => shiftFabricOnTable && shiftFabricOnTable('down', 20)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors"
            title="Shift Fabric Down"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => shiftFabricOnTable && shiftFabricOnTable('right', 20)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors"
            title="Shift Fabric Right"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Target Status */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span>CURRENT TARGET:</span>
        <span className="text-amber-400 font-mono font-bold truncate max-w-[140px]">
          {activeLayer ? activeLayer.name : 'NONE'}
        </span>
      </div>
    </div>
  );
}

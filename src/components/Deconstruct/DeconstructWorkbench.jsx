import React, { useState, useMemo } from 'react';
import ImageUploader from './ImageUploader';
import CADCanvasInteractive from './CADCanvasInteractive';
import MeasurementPanel from './MeasurementPanel';
import PatternPieceList from './PatternPieceList';
import CADToolbar from './CADToolbar';
import FabricMarkerPanel from './FabricMarkerPanel';
import Garment3DViewer from './Garment3DViewer';
import PatternGradingPanel from './PatternGradingPanel';
import { generatePatternCAD } from '../../utils/patternEngine';
import { generateNestedGrading } from '../../utils/patternEngine/gradingEngine';
import { Layers, RotateCcw, Eye, Grid } from 'lucide-react';

export default function DeconstructWorkbench() {
  const [image, setImage] = useState(null);
  const [showSeams, setShowSeams] = useState(true);
  const [opacity, setOpacity] = useState(100);
  
  // Category & Selected Pattern Piece State
  const [selectedCategory, setSelectedCategory] = useState('trouser');
  const [selectedPanels, setSelectedPanels] = useState([0, 1]);

  // Phase 6 Grading State
  const [activeSizes, setActiveSizes] = useState(['M']);

  // Master Measurement State
  const initialMeasurements = {
    waist: 32,
    hip: 40,
    crotchDepth: 10.5,
    kneeHeight: 20,
    inseam: 32,
    kneeWidth: 16,
    hemWidth: 22,
    bustChest: 38,
    neckCircumference: 15.5,
    shoulderWidth: 17,
    shirtLength: 28,
    sleeveLength: 24,
    hipDepth: 8,
    skirtLength: 26,
    chest: 40,
    jacketLength: 30,
    bust: 36,
    shoulderToWaist: 16.5,
    fullGownLength: 58,
  };

  const [measurements, setMeasurements] = useState(initialMeasurements);

  const [parameters, setParameters] = useState({
    seamAllowance: 0.5,
    isShorts: false,
    shortsInseam: 8,
    style: 'a_line',
    flareExtension: 3.5,
    lapelWidth: 3.25,
    wearingEase: 3.5,
    silhouette: 'mermaid',
    hemSweep: 28,
  });

  // Overridden node coordinates for interactive Phase 4 edits
  const [customNodeOverrides, setCustomNodeOverrides] = useState({});

  // Calculate Base Pattern Geometry using Mathematical CAD Engine
  const baseCadData = useMemo(() => {
    try {
      const data = generatePatternCAD(selectedCategory, measurements, parameters);
      
      // Apply any interactive point dragging overrides
      if (Object.keys(customNodeOverrides).length > 0) {
        data.pieces = data.pieces.map((piece) => {
          if (customNodeOverrides[piece.id]) {
            const updatedPoints = [...piece.points];
            Object.entries(customNodeOverrides[piece.id]).forEach(([pIdx, coords]) => {
              updatedPoints[pIdx] = coords;
            });

            const pathStr = updatedPoints.reduce((acc, pt, idx) => {
              return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
            }, '') + ' Z';

            return { ...piece, points: updatedPoints, path: pathStr };
          }
          return piece;
        });
      }

      return data;
    } catch (err) {
      console.error('CAD Engine Calculation Error:', err);
      return { pieces: [] };
    }
  }, [selectedCategory, measurements, parameters, customNodeOverrides]);

  // Compute Multi-Size Grading Layer
  const gradedCadData = useMemo(() => {
    return generateNestedGrading(baseCadData, activeSizes);
  }, [baseCadData, activeSizes]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSelectedPanels([0, 1]);
    setCustomNodeOverrides({});
  };

  const togglePanel = (index) => {
    if (selectedPanels.includes(index)) {
      setSelectedPanels(selectedPanels.filter((i) => i !== index));
    } else {
      setSelectedPanels([...selectedPanels, index]);
    }
  };

  const handleReset = () => {
    setMeasurements(initialMeasurements);
    setSelectedPanels([0, 1]);
    setCustomNodeOverrides({});
  };

  const handleNodeUpdate = (pieceId, pointIndex, coords) => {
    setCustomNodeOverrides((prev) => ({
      ...prev,
      [pieceId]: {
        ...(prev[pieceId] || {}),
        [pointIndex]: coords,
      },
    }));
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 text-slate-100 p-3 sm:p-6 flex flex-col overflow-y-auto font-mono">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col gap-4">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base sm:text-xl font-bold text-white flex items-center gap-2 tracking-wide">
              <Layers className="w-5 h-5 text-amber-400" />
              TAILORIX CAD // PARAMETRIC PATTERN WORKBENCH
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Interactive 2D vector drafting, node manipulation, 3D digital twin preview, and grading suite.
            </p>
          </div>
          {image && (
            <button 
              onClick={() => setImage(null)} 
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 text-slate-300 rounded-xl hover:text-amber-400 transition-all font-mono"
            >
              <RotateCcw className="w-3.5 h-3.5" /> RESET IMAGE
            </button>
          )}
        </div>

        {/* Global CAD Actions Toolbar */}
        <CADToolbar 
          selectedCategory={selectedCategory}
          setSelectedCategory={handleCategoryChange}
          cadData={baseCadData}
          resetMeasurements={handleReset}
        />

        {!image ? (
          <ImageUploader onImageSelect={setImage} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Left Column: Reference Image & 3D Simulation */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              
              {/* Reference Image Container */}
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-3 flex flex-col relative">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Grid className="w-3.5 h-3.5 text-amber-400" /> Garment Reference
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md">
                    SPEC SOURCE
                  </span>
                </div>

                <div className="relative w-full h-[320px] flex items-center justify-center overflow-hidden rounded-xl bg-slate-950 border border-slate-800 p-2">
                  <img 
                    src={image} 
                    alt="Garment Analysis" 
                    className="max-h-full max-w-full object-contain rounded-lg transition-opacity"
                    style={{ opacity: opacity / 100 }}
                  />
                  {showSeams && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-amber-400/80 fill-none">
                      <path d="M 35% 15% L 65% 15% L 60% 90% L 40% 90% Z" strokeWidth="1.5" strokeDasharray="4,4" />
                    </svg>
                  )}
                </div>

                {/* Seams & Opacity Controls */}
                <div className="mt-3 flex items-center justify-between gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <button 
                    onClick={() => setShowSeams(!showSeams)}
                    className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all ${
                      showSeams ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {showSeams ? 'Hide Seams' : 'Show Seams'}
                  </button>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                    <span>Opacity</span>
                    <input 
                      type="range" 
                      min="30" 
                      max="100" 
                      value={opacity} 
                      onChange={(e) => setOpacity(e.target.value)}
                      className="w-20 accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Phase 5: 3D Garment Mesh & Strain Simulation */}
              <Garment3DViewer cadData={baseCadData} measurements={measurements} />

            </div>

            {/* Right Column: Interactive CAD Viewport & Parameters */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              
              {/* Phase 4: Interactive Canvas Node Manipulator */}
              <CADCanvasInteractive 
                cadData={baseCadData} 
                selectedPanels={selectedPanels} 
                seamAllowance={parameters.seamAllowance || 0.5}
                onNodeUpdate={handleNodeUpdate}
              />

              {/* Phase 6: Multi-Size Pattern Grading Matrix Controls */}
              <PatternGradingPanel 
                activeSizes={activeSizes}
                setActiveSizes={setActiveSizes}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MeasurementPanel 
                  category={selectedCategory}
                  measurements={measurements}
                  setMeasurements={setMeasurements}
                  parameters={parameters}
                  setParameters={setParameters}
                />

                <PatternPieceList 
                  pieces={baseCadData.pieces}
                  selectedPanels={selectedPanels}
                  togglePanel={togglePanel}
                />
              </div>

              {/* Phase 3: Fabric Marker & Yield Estimation */}
              <FabricMarkerPanel pieces={baseCadData.pieces} />

            </div>

          </div>
        )}

      </div>
    </div>
  );
}

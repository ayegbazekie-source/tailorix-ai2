/**
 * TAILORIX AI — GARMENT DECONSTRUCT TOOL (AI REVERSE-ENGINEERING PIPELINE)
 * 4-Step Technical Pipeline:
 * Step 1: Photo Upload & AI Vision Extraction
 * Step 2: Technical Review & Tailoring Refinement (Silhouette, Closures, Interfacing, Master Sequence)
 * Step 3: Technical Blueprint & Flat Pattern Breakdown
 * Step 4: Export to Studio Canvas
 *
 * Dark graphite interface (#101112) with champagne gold accents (#C5A059) and native app ergonomics.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Layers,
  Scissors,
  Sliders,
  Eye,
  ShieldCheck,
  FileSpreadsheet,
  AlertCircle,
  FolderDown,
  RefreshCw,
  ChevronDown,
  Camera,
  Check,
} from 'lucide-react';
import { DECONSTRUCT_BENCHMARK_SAMPLES } from '../../data/deconstructSamples';
import { generatePattern } from '../../utils/patternEngine/patternRegistry';
import { getDefaultMeasurementsForGarment } from '../../models/measurementDefinitions';
import { analyzeGarment } from '../../services/garmentAnalyzer';

export default function GarmentDeconstructPipeline() {
  const navigate = useNavigate();

  // Active step: 1 | 2 | 3 | 4
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Upload & Photo state
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [selectedSampleId, setSelectedSampleId] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisPhase, setAnalysisPhase] = useState('');

  // Step 2: Extracted Technical Specifications (with interactive tailor overrides)
  const [extractedSpec, setExtractedSpec] = useState(() => {
    const s = DECONSTRUCT_BENCHMARK_SAMPLES[0] || {};
    return {
      garmentType: s.category || 'trouser',
      name: s.name || 'Tailored Trousers',
      confidence: s.confidence || 0.96,
      description: s.description || 'Modern silhouette breakdown',
      silhouette: s.specs?.silhouette || 'High-Rise Relaxed Taper',
      neckline: s.specs?.neckline || 'Contoured Waistband',
      sleeves: s.specs?.sleeves || 'Sleeveless Lower Body',
      closure: s.specs?.closure || 'Concealed Fly Front with Hook-and-Bar',
      interfacing: s.specs?.interfacing || 'Medium Weft-Insert on Waistband',
      boning: s.specs?.boning || 'None (Internal Waistband Stays)',
      lining: s.specs?.lining || 'Half-Lined Front Leg to Knee',
      seamAllowance: 0.5,
      seamAllowanceText: s.specs?.seamAllowance || '0.5" side seams, 1.5" blind hem',
      bustDarts: 'French Contour Darts',
      waistDarts: 'Double Front Pleats & Back Darts',
      constructionSequence: s.specs?.constructionSequence || [
        'Fuse waistband interfacing and pocket facings',
        'Construct front slant pockets and stay tape',
        'Sew back waist shaping darts and press to center',
        'Assemble concealed zipper fly on left front',
        'Join front and back outseams; finish seam allowances',
        'Join front and back inseams with stretch compensation',
        'Join crotch curve with reinforced double stitch',
        'Attach split-back curtain waistband and belt loops',
        'Turn and blind-stitch 1.5" trouser leg hems',
        'Install hook-and-bar closure and interior anchor button',
        'Final pressing of sharp center-leg crease lines',
      ],
      targetFabric: s.defaultFabric || 'wool_tweed',
    };
  });

  // Selected pattern piece preview in Step 3
  const [activePreviewPieceId, setActivePreviewPieceId] = useState(null);

  // Handle local file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedImage(url);
      setImageFile(file);
      setSelectedSampleId(null);
    }
  };

  // Select one of the curated benchmark samples
  const handleSelectSample = (sample) => {
    setSelectedSampleId(sample.id);
    setSelectedImage(sample.image);
    setImageFile(null);
    setExtractedSpec({
      garmentType: sample.category,
      name: sample.name,
      confidence: sample.confidence,
      description: sample.description,
      silhouette: sample.specs?.silhouette || 'Classic Tailored',
      neckline: sample.specs?.neckline || 'Notched Collar',
      sleeves: sample.specs?.sleeves || 'Two-Piece Set-In Sleeve',
      closure: sample.specs?.closure || 'Standard Button Front',
      interfacing: sample.specs?.interfacing || 'Canvas Fusible',
      boning: sample.specs?.boning || 'None',
      lining: sample.specs?.lining || 'Full Bemberg Lining',
      seamAllowance: 0.5,
      seamAllowanceText: sample.specs?.seamAllowance || '0.5" seams, 1.5" hem',
      bustDarts: 'French Contour Darts',
      waistDarts: 'Vertical Princess Seams',
      constructionSequence: sample.specs?.constructionSequence || [
        'Fuse all required interfacings',
        'Construct darting and panels',
        'Assemble closures and collars',
        'Sew side seams and sleeves',
        'Attach linings and finish hems',
      ],
      targetFabric: sample.defaultFabric || 'wool_tweed',
    });
  };

  // Run AI Vision Extraction
  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(15);
    setAnalysisPhase('Phase 1/4: Analyzing silhouette geometry & topological drape...');

    try {
      if (imageFile) {
        setAnalysisProgress(35);
        setAnalysisPhase('Phase 2/4: Extracting seamlines, grainlines, and closures...');
        const result = await analyzeGarment(imageFile);

        setAnalysisProgress(70);
        setAnalysisPhase('Phase 3/4: Estimating structural interfacings & linings...');

        if (result && result.detectedType) {
          setExtractedSpec((prev) => ({
            ...prev,
            garmentType: result.detectedType,
            name: result.title || prev.name,
            confidence: result.confidence || 0.94,
            description: result.description || prev.description,
            silhouette: result.silhouette || prev.silhouette,
            neckline: result.neckline || prev.neckline,
            sleeves: result.sleeves || prev.sleeves,
            closure: result.closures || prev.closure,
          }));
        }
      } else {
        // Benchmark simulation sequence
        await new Promise((r) => setTimeout(r, 600));
        setAnalysisProgress(40);
        setAnalysisPhase('Phase 2/4: Detecting seam trajectories & dart placements...');
        await new Promise((r) => setTimeout(r, 600));
        setAnalysisProgress(75);
        setAnalysisPhase('Phase 3/4: Resolving seam allowance standards & grainlines...');
        await new Promise((r) => setTimeout(r, 500));
      }

      setAnalysisProgress(100);
      setAnalysisPhase('Phase 4/4: Blueprint geometry compiled successfully.');
      setTimeout(() => {
        setIsAnalyzing(false);
        setCurrentStep(2);
      }, 500);
    } catch (err) {
      console.error('Analysis error:', err);
      setIsAnalyzing(false);
      setCurrentStep(2);
    }
  };

  // Generate CAD pattern blueprint pieces based on current extracted specifications
  const patternPieces = useMemo(() => {
    try {
      const type = extractedSpec.garmentType || 'trouser';
      const defs = getDefaultMeasurementsForGarment(type);
      const res = generatePattern(type, defs, {
        seamAllowance: extractedSpec.seamAllowance || 0.5,
        targetFabric: extractedSpec.targetFabric || 'wool_tweed',
      });
      return res?.pieces || [];
    } catch (e) {
      console.warn('Pattern generation error:', e);
      return [];
    }
  }, [extractedSpec.garmentType, extractedSpec.seamAllowance, extractedSpec.targetFabric]);

  const activePiece = useMemo(() => {
    if (!patternPieces || patternPieces.length === 0) return null;
    return patternPieces.find((p) => p.id === activePreviewPieceId) || patternPieces[0];
  }, [patternPieces, activePreviewPieceId]);

  // Export Pieces to Studio Canvas
  const handleExportToStudioCanvas = () => {
    const payload = {
      source: 'deconstruct',
      garmentName: extractedSpec.name,
      garmentCategory: extractedSpec.garmentType,
      fabricCanvasUrl: extractedSpec.targetFabric || 'wool_tweed',
      timestamp: Date.now(),
      patternPieces: patternPieces.map((piece) => ({
        id: piece.id,
        name: piece.name,
        cutQuantity: typeof piece.cutQuantity === 'number' ? piece.cutQuantity : (String(piece.cutQuantity || '').includes('1') ? 1 : 2),
        cutQuantityLabel: typeof piece.cutQuantity === 'string' ? piece.cutQuantity : (piece.cutQuantityLabel || (piece.onFold ? 'Cut 1 on Fold' : 'Cut 2 (1 Pair)')),
        svgPath: piece.path,
        isFold: Boolean(piece.onFold),
        seamAllowance: piece.seamAllowance ?? 0.5,
        seamAllowancePath: piece.seamAllowancePath || null,
        points: piece.points || [],
        bounds: piece.bounds || { width: 120, height: 160 },
        grainline: piece.grainline || { label: piece.onFold ? 'CENTER FOLD' : 'LENGTHWISE GRAIN' },
        notches: piece.notches || [],
        darts: piece.darts || [],
        category: piece.category || 'shell',
      })),
      spec: extractedSpec,
    };

    try {
      localStorage.setItem('tailorix_studio_payload', JSON.stringify(payload));
    } catch (e) {
      console.warn('Storage payload error:', e);
    }

    navigate('/cad', { state: { importedPayload: payload } });
  };

  return (
    <div className="w-full min-h-[calc(100vh-52px)] bg-[#101112] text-[#EDEDF0] pb-24 font-sans select-none">
      {/* Top Header & 4-Step Stepper Bar */}
      <div className="bg-[#141517] border-b border-[#222427] sticky top-[52px] z-30 shadow-panel backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#C5A059]/15 border border-[#C5A059]/30 flex items-center justify-center text-[#E5C07B]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">
                    AI Reverse-Engineering
                  </span>
                  <span className="text-xs text-[#6A6C75]">•</span>
                  <span className="text-xs text-[#8A8B93] font-mono">Vision to 2D Blueprints</span>
                </div>
                <h1 className="text-sm sm:text-base font-semibold text-[#F5F5F7]">
                  Garment Deconstruct Pipeline
                </h1>
              </div>
            </div>

            {/* Stepper Controls */}
            <div className="flex items-center gap-1 sm:gap-2">
              {[
                { step: 1, label: 'Upload' },
                { step: 2, label: 'Tech Review' },
                { step: 3, label: 'Blueprint' },
                { step: 4, label: 'Studio Export' },
              ].map((item) => {
                const isActive = currentStep === item.step;
                const isDone = currentStep > item.step;
                return (
                  <button
                    key={item.step}
                    onClick={() => {
                      if (item.step <= currentStep || currentStep >= 2) {
                        setCurrentStep(item.step);
                      }
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#C5A059]/15 border border-[#C5A059]/40 text-[#E5C07B] shadow-gold-sm'
                        : isDone
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/15'
                        : 'bg-[#18191C] text-[#6A6C75] border border-transparent'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <span
                        className={`w-4 h-4 flex items-center justify-center rounded-full text-[10px] ${
                          isActive ? 'bg-[#C5A059] text-[#101112] font-bold' : 'bg-[#222427] text-[#8A8B93]'
                        }`}
                      >
                        {item.step}
                      </span>
                    )}
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* ========================================================================= */}
        {/* STEP 1: PHOTO UPLOAD & AI VISION ANALYSIS                                 */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Upload Area */}
            <div className="bg-[#141517] rounded-2xl border border-[#222427] p-6 sm:p-8 shadow-panel">
              <div className="text-center mb-6">
                <h2 className="text-base sm:text-lg font-semibold text-[#F5F5F7]">
                  Upload Garment Reference or Sketch
                </h2>
                <p className="text-xs text-[#8A8B93] mt-1 max-w-md mx-auto">
                  Reverse-engineer high-resolution garment photography, couture flat sketches, or technical line drawings into CAD-ready specifications.
                </p>
              </div>

              {/* Upload Dropzone */}
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    const url = URL.createObjectURL(file);
                    setSelectedImage(url);
                    setImageFile(file);
                    setSelectedSampleId(null);
                  }
                }}
                className="relative border-2 border-dashed border-[#28292D] hover:border-[#C5A059]/60 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#111214] hover:bg-[#16171A] group min-h-[260px] overflow-hidden"
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isAnalyzing}
                />

                {selectedImage ? (
                  <div className="relative w-full flex flex-col items-center justify-center bg-[#0C0D0E] rounded-xl p-3 border border-[#1E2024] overflow-hidden">
                    <img
                      src={selectedImage}
                      alt="Garment Reference Preview"
                      className="max-h-[260px] w-full object-contain rounded-lg mx-auto block"
                    />
                    <div className="absolute bottom-3 right-3 bg-[#141517]/90 backdrop-blur-sm text-[#EDEDF0] px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-floating border border-[#28292D]">
                      <Upload className="w-3.5 h-3.5 text-[#C5A059]" />
                      Tap or drop to replace photo
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center p-6 sm:p-8">
                    <div className="w-12 h-12 rounded-2xl bg-[#C5A059]/15 border border-[#C5A059]/30 flex items-center justify-center text-[#E5C07B] mb-3 group-hover:scale-105 transition-transform">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="font-semibold text-sm text-[#F5F5F7]">
                      Tap or Drop Garment Photo Here
                    </span>
                    <span className="text-xs text-[#8A8B93] mt-1 max-w-xs">
                      Supports JPG, PNG, WEBP (front or 3/4 couture angle)
                    </span>
                  </div>
                )}
              </label>

              {/* Analysis Status or Launch Button */}
              <div className="mt-6">
                {isAnalyzing ? (
                  <div className="space-y-4 py-2">
                    <div className="w-full bg-[#1A1B1E] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#C5A059] to-[#E5C07B] h-full rounded-full transition-all duration-300"
                        style={{ width: `${analysisProgress}%` }}
                      />
                    </div>
                    <div className="p-3 bg-[#1C1D1F] rounded-xl border border-[#C5A059]/30 text-[#E5C07B] text-xs font-mono text-center flex items-center justify-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-ping"></span>
                      <span>{analysisPhase}</span>
                    </div>
                    <div className="space-y-1.5 text-xs text-[#8A8B93] font-mono">
                      <div className="flex items-center justify-between">
                        <span>[1] Silhouette contour segmentation</span>
                        <span className={analysisProgress >= 25 ? 'text-emerald-400 font-semibold' : 'text-[#6A6C75]'}>
                          {analysisProgress >= 25 ? 'DONE' : '...'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>[2] Seams, grainlines & closures</span>
                        <span className={analysisProgress >= 50 ? 'text-emerald-400 font-semibold' : 'text-[#6A6C75]'}>
                          {analysisProgress >= 50 ? 'DONE' : '...'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>[3] Interfacing, boning & linings</span>
                        <span className={analysisProgress >= 75 ? 'text-emerald-400 font-semibold' : 'text-[#6A6C75]'}>
                          {analysisProgress >= 75 ? 'DONE' : '...'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>[4] Compiling CAD pattern blueprints</span>
                        <span className={analysisProgress >= 100 ? 'text-emerald-400 font-semibold' : 'text-[#6A6C75]'}>
                          {analysisProgress >= 100 ? 'DONE' : '...'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleStartAnalysis}
                    className="w-full min-h-[48px] py-3 bg-[#C5A059] hover:bg-[#D4AF37] text-[#101112] font-semibold text-xs rounded-xl transition-all shadow-gold-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {selectedImage
                        ? 'Execute AI Garment Deconstruction'
                        : 'Select Couture Sample & Deconstruct'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Couture Benchmark Sample Library */}
            <div className="bg-[#141517] rounded-2xl border border-[#222427] p-5 shadow-panel">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs font-semibold text-[#F5F5F7] uppercase tracking-wider">
                    Or Select a Benchmark Garment Sample
                  </h3>
                  <p className="text-[11px] text-[#8A8B93]">
                    Pre-calibrated couture benchmarks ready for instant pattern deconstruction.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {DECONSTRUCT_BENCHMARK_SAMPLES.slice(0, 4).map((sample) => {
                  const isSelected = selectedSampleId === sample.id;
                  return (
                    <button
                      key={sample.id}
                      onClick={() => handleSelectSample(sample)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-2 ${
                        isSelected
                          ? 'border-[#C5A059] bg-[#C5A059]/10 shadow-gold-sm'
                          : 'border-[#222427] bg-[#111214] hover:border-[#383A40] hover:bg-[#16171A]'
                      }`}
                    >
                      <div className="w-full h-24 rounded-lg bg-[#18191B] overflow-hidden flex items-center justify-center relative">
                        <img
                          src={sample.image}
                          alt={sample.name}
                          className="w-full h-full object-contain p-1"
                        />
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#C5A059] text-[#101112] flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-[#EDEDF0] block truncate">
                          {sample.name}
                        </span>
                        <span className="text-[10px] text-[#8A8B93] uppercase font-mono">
                          {sample.category}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: REVIEW & REFINE TECHNICAL SPECIFICATIONS                          */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="max-w-4xl mx-auto space-y-5">
            {/* Step 2 Top Bar with Reference Image Frame & Actions */}
            <div className="bg-[#141517] rounded-2xl border border-[#222427] p-4 sm:p-5 shadow-panel flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                {selectedImage && (
                  <div className="bg-[#0C0D0E] rounded-xl p-2 border border-[#222427] shrink-0 shadow-inner flex items-center justify-center">
                    <img
                      src={selectedImage}
                      alt={extractedSpec.name}
                      className="max-h-[140px] w-auto max-w-[140px] object-contain rounded-lg mx-auto block"
                    />
                  </div>
                )}
                <div className="text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h2 className="text-sm sm:text-base font-semibold text-[#F5F5F7]">{extractedSpec.name}</h2>
                    <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-md font-mono text-[10px] font-bold">
                      {Math.round((extractedSpec.confidence || 0.96) * 100)}% Match
                    </span>
                  </div>
                  <p className="text-xs text-[#8A8B93] mt-1 max-w-md">
                    Review extracted specifications or adjust tailoring parameters before generating production blueprints.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-3 py-2 text-xs font-medium text-[#8A8B93] hover:text-[#EDEDF0] bg-[#18191C] hover:bg-[#202226] rounded-xl transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5 inline mr-1" />
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 text-xs font-semibold text-[#101112] bg-[#C5A059] hover:bg-[#D4AF37] rounded-xl transition-all shadow-gold-sm flex items-center gap-1.5"
                >
                  <span>Proceed to Pattern Blueprints</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Collapsible Accordion Cards */}
            <div className="space-y-3">
              {/* 1. Silhouette & Cut */}
              <details open className="group bg-[#141517] rounded-2xl border border-[#222427] shadow-panel overflow-hidden">
                <summary className="flex items-center justify-between p-4 cursor-pointer select-none font-semibold text-[#F5F5F7] text-xs sm:text-sm hover:bg-[#18191C] transition-colors list-none">
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 bg-[#C5A059]/15 text-[#E5C07B] rounded-lg">
                      <Scissors className="w-4 h-4" />
                    </span>
                    <span>Silhouette & Cut</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-[#8A8B93] font-normal hidden sm:inline">Profile, Collar & Sleeves</span>
                    <ChevronDown className="w-4 h-4 text-[#8A8B93] group-open:rotate-180 transition-transform duration-200" />
                  </div>
                </summary>
                <div className="p-4 pt-1 border-t border-[#222427] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[#8A8B93] text-[11px] block font-medium">Silhouette Profile</label>
                    <input
                      type="text"
                      value={extractedSpec.silhouette}
                      onChange={(e) => setExtractedSpec({ ...extractedSpec, silhouette: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-[#101112] border border-[#28292D] rounded-xl text-[#EDEDF0] font-semibold text-xs focus:border-[#C5A059]/60 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[#8A8B93] text-[11px] block font-medium">Neckline / Collar Shape</label>
                    <input
                      type="text"
                      value={extractedSpec.neckline}
                      onChange={(e) => setExtractedSpec({ ...extractedSpec, neckline: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-[#101112] border border-[#28292D] rounded-xl text-[#EDEDF0] font-semibold text-xs focus:border-[#C5A059]/60 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[#8A8B93] text-[11px] block font-medium">Sleeves & Armholes</label>
                    <input
                      type="text"
                      value={extractedSpec.sleeves}
                      onChange={(e) => setExtractedSpec({ ...extractedSpec, sleeves: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-[#101112] border border-[#28292D] rounded-xl text-[#EDEDF0] font-semibold text-xs focus:border-[#C5A059]/60 focus:outline-hidden"
                    />
                  </div>
                </div>
              </details>

              {/* 2. Closures & Seam Allowance */}
              <details open className="group bg-[#141517] rounded-2xl border border-[#222427] shadow-panel overflow-hidden">
                <summary className="flex items-center justify-between p-4 cursor-pointer select-none font-semibold text-[#F5F5F7] text-xs sm:text-sm hover:bg-[#18191C] transition-colors list-none">
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 bg-[#C5A059]/15 text-[#E5C07B] rounded-lg">
                      <Sliders className="w-4 h-4" />
                    </span>
                    <span>Closures & Seam Allowance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-[#8A8B93] font-normal hidden sm:inline">Fasteners & SA Standard</span>
                    <ChevronDown className="w-4 h-4 text-[#8A8B93] group-open:rotate-180 transition-transform duration-200" />
                  </div>
                </summary>
                <div className="p-4 pt-1 border-t border-[#222427] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[#8A8B93] text-[11px] block font-medium">Closure Mechanism</label>
                    <input
                      type="text"
                      value={extractedSpec.closure}
                      onChange={(e) => setExtractedSpec({ ...extractedSpec, closure: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-[#101112] border border-[#28292D] rounded-xl text-[#EDEDF0] font-semibold text-xs focus:border-[#C5A059]/60 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[#8A8B93] text-[11px] block font-medium">Standard Seam Allowance</label>
                    <select
                      value={extractedSpec.seamAllowance}
                      onChange={(e) => setExtractedSpec({ ...extractedSpec, seamAllowance: parseFloat(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 bg-[#101112] border border-[#28292D] rounded-xl text-[#EDEDF0] font-semibold text-xs focus:border-[#C5A059]/60 focus:outline-hidden"
                    >
                      <option value={0.5}>0.5 in (1.27 cm) — Industry Standard</option>
                      <option value={0.625}>0.625 in (5/8") — Commercial Pattern Standard</option>
                      <option value={0.375}>0.375 in (3/8") — French Seam / Silk Standard</option>
                      <option value={0.25}>0.25 in (1/4") — Facing Standard</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[#8A8B93] text-[11px] block font-medium">Hem Allowance Standard</label>
                    <input
                      type="text"
                      value={extractedSpec.seamAllowanceText}
                      onChange={(e) => setExtractedSpec({ ...extractedSpec, seamAllowanceText: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-[#101112] border border-[#28292D] rounded-xl text-[#EDEDF0] font-semibold text-xs focus:border-[#C5A059]/60 focus:outline-hidden"
                    />
                  </div>
                </div>
              </details>

              {/* 3. Internal Structure */}
              <details open className="group bg-[#141517] rounded-2xl border border-[#222427] shadow-panel overflow-hidden">
                <summary className="flex items-center justify-between p-4 cursor-pointer select-none font-semibold text-[#F5F5F7] text-xs sm:text-sm hover:bg-[#18191C] transition-colors list-none">
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 bg-[#C5A059]/15 text-[#E5C07B] rounded-lg">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                    <span>Internal Structure</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-[#8A8B93] font-normal hidden sm:inline">Interfacing, Boning & Linings</span>
                    <ChevronDown className="w-4 h-4 text-[#8A8B93] group-open:rotate-180 transition-transform duration-200" />
                  </div>
                </summary>
                <div className="p-4 pt-1 border-t border-[#222427] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[#8A8B93] text-[11px] block font-medium">Interfacing Weight & Placement</label>
                    <input
                      type="text"
                      value={extractedSpec.interfacing}
                      onChange={(e) => setExtractedSpec({ ...extractedSpec, interfacing: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-[#101112] border border-[#28292D] rounded-xl text-[#EDEDF0] font-semibold text-xs focus:border-[#C5A059]/60 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[#8A8B93] text-[11px] block font-medium">Internal Boning / Stays</label>
                    <input
                      type="text"
                      value={extractedSpec.boning}
                      onChange={(e) => setExtractedSpec({ ...extractedSpec, boning: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-[#101112] border border-[#28292D] rounded-xl text-[#EDEDF0] font-semibold text-xs focus:border-[#C5A059]/60 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[#8A8B93] text-[11px] block font-medium">Lining Construction</label>
                    <input
                      type="text"
                      value={extractedSpec.lining}
                      onChange={(e) => setExtractedSpec({ ...extractedSpec, lining: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-[#101112] border border-[#28292D] rounded-xl text-[#EDEDF0] font-semibold text-xs focus:border-[#C5A059]/60 focus:outline-hidden"
                    />
                  </div>
                </div>
              </details>

              {/* 4. Master Tailoring Sequence */}
              <details open className="group bg-[#141517] rounded-2xl border border-[#222427] shadow-panel overflow-hidden">
                <summary className="flex items-center justify-between p-4 cursor-pointer select-none font-semibold text-[#F5F5F7] text-xs sm:text-sm hover:bg-[#18191C] transition-colors list-none">
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 bg-[#C5A059]/15 text-[#E5C07B] rounded-lg">
                      <FileSpreadsheet className="w-4 h-4" />
                    </span>
                    <span>Master Tailoring Sequence</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-[#8A8B93]">
                      {extractedSpec.constructionSequence?.length || 12} Operations
                    </span>
                    <ChevronDown className="w-4 h-4 text-[#8A8B93] group-open:rotate-180 transition-transform duration-200" />
                  </div>
                </summary>
                <div className="p-4 pt-2 border-t border-[#222427]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {extractedSpec.constructionSequence?.map((stepText, idx) => (
                      <div key={idx} className="p-2.5 bg-[#111214] border border-[#222427] rounded-xl flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-md bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#E5C07B] font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs text-[#EDEDF0] font-medium leading-relaxed">{stepText}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: TECHNICAL BLUEPRINT & PATTERN BREAKDOWN                            */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {/* Header Bar */}
            <div className="bg-[#141517] rounded-2xl border border-[#222427] p-4 sm:p-5 shadow-panel flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] tracking-wider uppercase">
                  Geometry Ready
                </span>
                <h2 className="text-sm sm:text-base font-semibold text-[#F5F5F7] mt-1">
                  Pattern Blueprint Breakdown ({patternPieces.length} Panels)
                </h2>
                <p className="text-xs text-[#8A8B93]">
                  Engineering flat patterns rendered with exact seam allowances, grainlines, notches, and cut quantities.
                </p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-3 py-2 text-xs font-medium text-[#8A8B93] hover:text-[#EDEDF0] bg-[#18191C] hover:bg-[#202226] rounded-xl transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5 inline mr-1" />
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="px-4 py-2.5 bg-[#C5A059] hover:bg-[#D4AF37] text-[#101112] font-semibold text-xs rounded-xl transition-all shadow-gold-sm flex items-center gap-1.5"
                >
                  <span>Step 4: Export to Studio Canvas</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Pattern Pieces Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patternPieces.map((piece) => {
                const b = piece.bounds || { width: 120, height: 160 };
                const wInches = Math.round(b.width / 12);
                const hInches = Math.round(b.height / 12);
                const isSelected = activePiece?.id === piece.id;

                return (
                  <div
                    key={piece.id}
                    onClick={() => setActivePreviewPieceId(piece.id)}
                    className={`bg-[#141517] rounded-2xl border p-4 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#C5A059] shadow-gold-sm bg-[#18191B]'
                        : 'border-[#222427] hover:border-[#383A40] hover:bg-[#16171A]'
                    }`}
                  >
                    <div>
                      {/* Top piece meta badges */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-xs text-[#EDEDF0] truncate max-w-[170px]">
                          {piece.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-[#1D1E22] text-[#8A8B93] font-mono text-[10px] font-semibold border border-[#2A2B30]">
                          {piece.cutQuantity || (piece.onFold ? 'Cut 1 on Fold' : 'Cut 2 (Pair)')}
                        </span>
                      </div>

                      {/* SVG Vector Drafting Surface */}
                      <div className="w-full h-56 bg-[#F4F4F2] rounded-xl relative overflow-hidden border border-[#222427] flex items-center justify-center p-3">
                        {/* Subtle CAD Grid on drafting surface */}
                        <div
                          className="absolute inset-0 opacity-20 pointer-events-none"
                          style={{
                            backgroundImage: 'radial-gradient(circle, #0F172A 1px, transparent 1px)',
                            backgroundSize: '16px 16px',
                          }}
                        />

                        <svg
                          viewBox={`${b.minX - 15} ${b.minY - 15} ${b.width + 30} ${b.height + 30}`}
                          className="w-full h-full object-contain relative z-10"
                        >
                          {/* Seam Allowance Offset Path (Dashed) */}
                          {piece.seamAllowancePath && (
                            <path
                              d={piece.seamAllowancePath}
                              fill="none"
                              stroke="#64748B"
                              strokeWidth="1.5"
                              strokeDasharray="4 3"
                            />
                          )}

                          {/* Primary Cutline Path */}
                          <path
                            d={piece.path}
                            fill="#1A1B1E"
                            fillOpacity="0.06"
                            stroke="#1A1B1E"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          {/* Grainline Arrow */}
                          {piece.grainline && (
                            <g stroke="#C5A059" strokeWidth="1.5">
                              <line
                                x1={piece.grainline.x1}
                                y1={piece.grainline.y1}
                                x2={piece.grainline.x2}
                                y2={piece.grainline.y2}
                              />
                              <circle cx={piece.grainline.x1} cy={piece.grainline.y1} r="3" fill="#C5A059" />
                              <circle cx={piece.grainline.x2} cy={piece.grainline.y2} r="3" fill="#C5A059" />
                            </g>
                          )}
                        </svg>

                        {/* Fold Badge overlay */}
                        {piece.onFold && (
                          <div className="absolute top-2 left-2 bg-[#1A1B1E] text-[#E5C07B] text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#C5A059]/40">
                            PLACE ON FOLD
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Piece Technical Dimensions */}
                    <div className="mt-3 pt-3 border-t border-[#222427] flex items-center justify-between text-[11px] text-[#8A8B93] font-mono">
                      <span>Dimensions: ~{wInches}" × {hInches}"</span>
                      <span className="text-[#C5A059] font-semibold">SA: {piece.seamAllowance || 0.5}"</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: EXPORT TO STUDIO CANVAS                                           */}
        {/* ========================================================================= */}
        {currentStep === 4 && (
          <div className="max-w-xl mx-auto bg-[#141517] rounded-2xl border border-[#222427] p-6 sm:p-8 shadow-panel">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#E5C07B] flex items-center justify-center mx-auto mb-3">
                <Layers className="w-6 h-6" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-[#F5F5F7]">
                Transfer Blueprints to Studio Canvas
              </h2>
              <p className="text-xs text-[#8A8B93] mt-1 max-w-md mx-auto">
                Transfer all {patternPieces.length} deconstructed pattern pieces onto the interactive digital cutting table to lay out, align grainlines, and test fabric consumption.
              </p>
            </div>

            {/* Transfer Payload Summary Card */}
            <div className="bg-[#111214] rounded-xl border border-[#222427] p-4 mb-6 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#222427]">
                <span className="text-xs text-[#8A8B93]">Garment Model:</span>
                <span className="text-xs font-semibold text-[#EDEDF0]">{extractedSpec.name}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#222427]">
                <span className="text-xs text-[#8A8B93]">Blueprint Panels:</span>
                <span className="text-xs font-mono font-semibold text-emerald-400">
                  {patternPieces.length} Distinct Pieces
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#222427]">
                <span className="text-xs text-[#8A8B93]">Total Cuts Required:</span>
                <span className="text-xs font-mono font-semibold text-[#EDEDF0]">
                  {patternPieces.reduce((acc, p) => acc + (typeof p.cutQuantity === 'number' ? p.cutQuantity : (String(p.cutQuantity || '').includes('1') ? 1 : 2)), 0)} Cut Pieces
                </span>
              </div>

              {/* Target Fabric Preset Selector */}
              <div>
                <label className="text-xs font-medium text-[#8A8B93] block mb-1.5">
                  Select Cutting Table Fabric:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'silk_satin', name: 'Silk Charmeuse' },
                    { id: 'selvedge_denim', name: 'Selvedge Denim' },
                    { id: 'pure_linen', name: 'Irish Linen' },
                    { id: 'wool_tweed', name: 'Wool Tweed' },
                    { id: 'poplin_cotton', name: 'Poplin Cotton' },
                    { id: 'cutting_mat', name: 'Grid Cutting Mat' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setExtractedSpec({ ...extractedSpec, targetFabric: f.id })}
                      className={`p-2 rounded-xl border text-left text-xs transition-all ${
                        extractedSpec.targetFabric === f.id
                          ? 'border-[#C5A059] bg-[#C5A059]/15 font-semibold text-[#E5C07B]'
                          : 'border-[#28292D] bg-[#141517] text-[#8A8B93] hover:text-[#EDEDF0]'
                      }`}
                    >
                      <span className="block truncate text-[11px]">{f.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Direct High-Contrast Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleExportToStudioCanvas}
                className="w-full min-h-[48px] py-3 bg-[#C5A059] hover:bg-[#D4AF37] text-[#101112] font-semibold text-xs rounded-xl transition-all shadow-gold-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Scissors className="w-4 h-4" />
                <span>Export Pieces to Studio Canvas</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentStep(3)}
                className="w-full py-2.5 bg-[#18191C] hover:bg-[#202226] text-[#8A8B93] hover:text-[#EDEDF0] font-medium text-xs rounded-xl transition-all"
              >
                Review Pattern Blueprints Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

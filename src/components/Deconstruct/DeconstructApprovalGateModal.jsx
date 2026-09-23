/**
 * TAILORIX AI — DECONSTRUCT APPROVAL GATE & HUMAN MAPPING MODAL
 * 
 * Sits directly between AI Perceptual Extraction and CAD Pattern Generation.
 * 
 * Capabilities:
 * 1. Displays extracted GarmentSpecification with confidence scores.
 * 2. Highlights ambiguities, low confidence values, and uncertainties.
 * 3. Human Mapping: Allows tailoring overrides on Garment Type, Silhouette, Sleeve, Collar, etc.
 * 4. Applies Design Transformations (Raglan conversion, Ease adjustment, Pocket additions).
 * 5. Validates structural integrity before granting approval.
 * 6. "Approve & Generate CAD Pattern" acts as the definitive approval gate.
 */

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sliders,
  Scissors,
  Layers,
  Wand2,
  X,
  Check,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { GARMENT_TYPES } from '../../models/garmentTaxonomy';
import { validateGarmentSpecification } from '../../services/deconstruct/garmentValidation';
import { resolvePatternEngine } from '../../services/deconstruct/constructionResolver';
import { applyGarmentTransformation } from '../../services/deconstruct/garmentTransformations';
import { CONFIDENCE_STATES, SPEC_STATUS, createConfidenceValue } from '../../models/garmentSpecification';

export default function DeconstructApprovalGateModal({
  isOpen,
  onClose,
  initialSpec,
  onApproveAndGenerate,
  referenceImage,
  onUploadNewImage,
  isAnalyzing = false,
}) {
  const [workingSpec, setWorkingSpec] = useState(() => initialSpec || {});
  const [activeTab, setActiveTab] = useState('components'); // 'components' | 'mapping' | 'transformations'

  // Sync workingSpec when initialSpec updates
  React.useEffect(() => {
    if (initialSpec) {
      setWorkingSpec(initialSpec);
    }
  }, [initialSpec]);

  // Real-time level 1 validation and construction resolution
  const validation = useMemo(() => {
    return validateGarmentSpecification(workingSpec);
  }, [workingSpec]);

  const resolution = useMemo(() => {
    return resolvePatternEngine(workingSpec);
  }, [workingSpec]);

  // Overall confidence metric
  const overallConfidence = useMemo(() => {
    if (typeof workingSpec.confidence === 'number') return workingSpec.confidence;
    if (typeof workingSpec.confidence?.overall === 'number') return workingSpec.confidence.overall;
    return 0.9;
  }, [workingSpec]);

  // Check if approval can proceed
  const canApprove = validation.valid && resolution.status === 'resolved';

  // Handle manual human overrides on specific fields
  const handleFieldOverride = (fieldPath, newValue) => {
    setWorkingSpec((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));

      switch (fieldPath) {
        case 'garmentType': {
          updated.garmentType = newValue;
          updated.identity = updated.identity || {};
          updated.identity.garmentType = newValue;
          const gTax = Object.values(GARMENT_TYPES).find((t) => t.id === newValue);
          if (gTax) {
            updated.identity.category = gTax.family;
            updated.garmentFamily = gTax.family;
            updated.name = gTax.name;
          }
          updated.uncertainties = (updated.uncertainties || []).filter((u) => u.field !== 'identity.garmentType');
          break;
        }

        case 'silhouette': {
          updated.silhouette = updated.silhouette || {};
          updated.silhouette.primary = newValue;
          break;
        }

        case 'sleeve.type': {
          updated.sleeve = updated.sleeve || {};
          updated.sleeve.type = newValue;
          updated.sleeve.construction = newValue === 'raglan' ? 'raglan_split' : newValue === 'two-piece' ? 'two-piece' : 'one-piece';
          updated.sleeve.confidence = createConfidenceValue(newValue, 1.0, CONFIDENCE_STATES.CONFIRMED, 'human_correction');
          break;
        }

        case 'collar.type': {
          updated.collar = updated.collar || {};
          updated.collar.type = newValue;
          updated.collar.confidence = createConfidenceValue(newValue, 1.0, CONFIDENCE_STATES.CONFIRMED, 'human_correction');
          break;
        }

        case 'neckline.type': {
          updated.neckline = updated.neckline || {};
          updated.neckline.type = newValue;
          updated.neckline.confidence = createConfidenceValue(newValue, 1.0, CONFIDENCE_STATES.CONFIRMED, 'human_correction');
          break;
        }

        case 'fit.ease': {
          updated.fit = updated.fit || {};
          updated.fit.ease = parseFloat(newValue) || 4.0;
          break;
        }

        case 'waistband.type': {
          updated.waistband = updated.waistband || {};
          updated.waistband.type = newValue;
          break;
        }

        default:
          break;
      }

      // Overriding marks status for review
      updated.status = SPEC_STATUS.NEEDS_REVIEW;
      return updated;
    });
  };

  // Handle transformation trigger
  const handleExecuteTransformation = (transType, value) => {
    const res = applyGarmentTransformation(workingSpec, { type: transType, value });
    if (res.success && res.spec) {
      setWorkingSpec(res.spec);
    }
  };

  // Final approval trigger
  const handleApprove = () => {
    if (!canApprove) return;
    const approved = {
      ...workingSpec,
      status: SPEC_STATUS.APPROVED,
      approvedAt: Date.now(),
    };
    onApproveAndGenerate(approved);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0B0C]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#141517] rounded-2xl border border-[#2D2E32] shadow-2xl max-w-3xl w-full flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#232427] flex items-center justify-between bg-[#18191C]/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#C5A059]/15 border border-[#C5A059]/30 flex items-center justify-center text-[#E5C07B]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-[#F5F5F7]">Deconstruct Intelligence Review & Approval Gate</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#C5A059]/15 text-[#E5C07B] border border-[#C5A059]/30">
                  Stage 2 AI Vision & Core
                </span>
              </div>
              <p className="text-xs text-[#8A8B93]">Verify extracted components, resolve AI inquiries, and approve before CAD geometry compile.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[#222427] flex items-center justify-center text-[#8A8B93] hover:text-[#EDEDF0] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-[#232427] bg-[#141517]">
          <button
            onClick={() => setActiveTab('components')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'components'
                ? 'border-[#C5A059] text-[#E5C07B]'
                : 'border-transparent text-[#8A8B93] hover:text-[#EDEDF0]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Extracted Components & Evidence</span>
          </button>
          <button
            onClick={() => setActiveTab('mapping')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'mapping'
                ? 'border-[#C5A059] text-[#E5C07B]'
                : 'border-transparent text-[#8A8B93] hover:text-[#EDEDF0]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Human Mapping & Overrides</span>
          </button>
          <button
            onClick={() => setActiveTab('transformations')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'transformations'
                ? 'border-[#C5A059] text-[#E5C07B]'
                : 'border-transparent text-[#8A8B93] hover:text-[#EDEDF0]'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Design Transformations</span>
          </button>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#101112]">
          
          {/* Top Status & Confidence Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-[#18191B] rounded-xl border border-[#28292D] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center text-[#E5C07B] text-xs font-bold">
                {Math.round(overallConfidence * 100)}%
              </div>
              <div>
                <div className="text-[11px] text-[#8A8B93] uppercase font-mono">Confidence Level</div>
                <div className="text-xs font-semibold text-[#EDEDF0]">
                  {overallConfidence >= 0.85 ? 'High Confidence' : overallConfidence >= 0.6 ? 'Moderate (Review Suggested)' : 'Low / Ambiguous'}
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#18191B] rounded-xl border border-[#28292D] flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                validation.valid ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}>
                {validation.valid ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-[11px] text-[#8A8B93] uppercase font-mono">Structural Validity</div>
                <div className="text-xs font-semibold text-[#EDEDF0]">
                  {validation.valid ? 'Level 1 Spec Valid' : `${validation.errors.length} Contradictions Detected`}
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#18191B] rounded-xl border border-[#28292D] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">
                <Scissors className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-[#8A8B93] uppercase font-mono">Target Engine</div>
                <div className="text-xs font-semibold text-[#EDEDF0]">
                  {resolution.engine ? resolution.engine : (resolution.status === 'needs_clarification' ? 'Clarification Required' : 'Unsupported')}
                </div>
              </div>
            </div>
          </div>

          {/* AI Clarification Inquiries & Questions for the Master Tailor */}
          {workingSpec.questionsForUser && workingSpec.questionsForUser.length > 0 && (
            <div className="p-4 bg-sky-500/10 border border-sky-500/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-sky-400">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  <span>AI Inquiries & Clarifications ({workingSpec.questionsForUser.length})</span>
                </div>
                <span className="text-[10px] font-mono text-[#8A8B93]">Select an option to confirm</span>
              </div>
              <div className="space-y-2">
                {workingSpec.questionsForUser.map((q, qIdx) => (
                  <div key={qIdx} className="p-3 bg-[#141517] rounded-lg border border-[#26272C] text-xs">
                    <div className="font-medium text-[#EDEDF0]">{q.question}</div>
                    {q.reason && <div className="text-[11px] text-[#8A8B93] mt-0.5 italic">{q.reason}</div>}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(q.options || []).map((opt) => (
                        <button
                          key={opt}
                          onClick={() => {
                            handleFieldOverride(q.field, opt);
                            setWorkingSpec((prev) => ({
                              ...prev,
                              questionsForUser: (prev.questionsForUser || []).filter((_, idx) => idx !== qIdx),
                            }));
                          }}
                          className="px-2.5 py-1 text-[11px] font-medium bg-[#1F2024] hover:bg-sky-600 hover:text-white text-[#EDEDF0] rounded border border-[#35363D] transition-colors capitalize"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clarification Alert If Garment Type is Unknown / Contradictory */}
          {resolution.status === 'needs_clarification' && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4" />
                <span>Clarification Required Before Pattern Generation</span>
              </div>
              <p className="text-xs text-[#EDEDF0]/90">
                {resolution.reason || 'Garment type could not be resolved with certainty. Tailorix AI will never guess or default to trousers.'}
              </p>
              <div className="pt-2 flex flex-wrap gap-2 items-center">
                <span className="text-[11px] text-[#A0A1A8]">Select Correct Garment Foundation:</span>
                {(resolution.candidates || ['shirt', 'trouser', 'jeans', 'jacket', 'dress', 'skirt']).map((cand) => (
                  <button
                    key={cand}
                    onClick={() => handleFieldOverride('garmentType', cand)}
                    className="px-2.5 py-1 text-xs font-medium bg-[#1F2024] hover:bg-[#C5A059] hover:text-[#101112] text-[#EDEDF0] rounded-lg border border-[#35363D] transition-all capitalize"
                  >
                    {cand}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Validation Errors If Present */}
          {!validation.valid && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-red-400 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4" />
                <span>Impossible or Contradictory Specification Detected</span>
              </div>
              <ul className="text-xs text-[#EDEDF0]/80 space-y-1 list-disc list-inside">
                {validation.errors.map((err, idx) => (
                  <li key={idx}><span className="font-mono text-red-300">{err.path}:</span> {err.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* TAB 1: Extracted Components Breakdown */}
          {activeTab === 'components' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Garment Identity */}
                <div className="p-3.5 bg-[#161719] rounded-xl border border-[#242529] space-y-2">
                  <div className="font-semibold text-[#F5F5F7] flex items-center justify-between">
                    <span>Identity & Silhouette</span>
                    <span className="text-[10px] text-[#C5A059] font-mono uppercase">{workingSpec.identity?.garmentType}</span>
                  </div>
                  <div className="text-[11px] text-[#8A8B93] space-y-1">
                    <div>Category: <span className="text-[#EDEDF0] font-medium capitalize">{workingSpec.identity?.category || 'Apparel'}</span></div>
                    <div>Silhouette: <span className="text-[#EDEDF0] font-medium capitalize">{workingSpec.silhouette?.primary || 'Classic'}</span></div>
                    <div>Fit Type: <span className="text-[#EDEDF0] font-medium capitalize">{workingSpec.fit?.fitType || 'Regular'}</span></div>
                    <div>Ease Allowance: <span className="text-[#EDEDF0] font-medium">+{workingSpec.fit?.ease ?? 4.0}&quot; Total Ease</span></div>
                  </div>
                </div>

                {/* Upper Construction: Sleeve & Collar */}
                <div className="p-3.5 bg-[#161719] rounded-xl border border-[#242529] space-y-2">
                  <div className="font-semibold text-[#F5F5F7] flex items-center justify-between">
                    <span>Sleeve & Neckline Finish</span>
                    <span className="text-[10px] text-[#A0A1A8] font-mono">{workingSpec.sleeve?.type || 'Standard'}</span>
                  </div>
                  <div className="text-[11px] text-[#8A8B93] space-y-1">
                    <div>Sleeve: <span className="text-[#EDEDF0] font-medium capitalize">{workingSpec.sleeve?.type || 'None'} ({workingSpec.sleeve?.construction || 'one-piece'})</span></div>
                    <div>Collar: <span className="text-[#EDEDF0] font-medium capitalize">{workingSpec.collar?.type || 'None'}</span></div>
                    <div>Neckline: <span className="text-[#EDEDF0] font-medium capitalize">{workingSpec.neckline?.type || 'None'}</span></div>
                    <div>Cuffs: <span className="text-[#EDEDF0] font-medium capitalize">{workingSpec.cuffs?.[0]?.type || 'Standard'}</span></div>
                  </div>
                </div>

                {/* Structural Components */}
                <div className="p-3.5 bg-[#161719] rounded-xl border border-[#242529] space-y-2">
                  <div className="font-semibold text-[#F5F5F7] flex items-center justify-between">
                    <span>Closures & Waistband</span>
                  </div>
                  <div className="text-[11px] text-[#8A8B93] space-y-1">
                    <div>Closure: <span className="text-[#EDEDF0] font-medium capitalize">{workingSpec.closures?.[0]?.type || 'Standard'}</span></div>
                    <div>Waistband: <span className="text-[#EDEDF0] font-medium capitalize">{workingSpec.waistband?.type || 'None / Standard'}</span></div>
                    <div>Pockets: <span className="text-[#EDEDF0] font-medium">{workingSpec.pockets?.length ? workingSpec.pockets.map((p) => p.type).join(', ') : 'None'}</span></div>
                    <div>Hems: <span className="text-[#EDEDF0] font-medium capitalize">{workingSpec.hems?.[0]?.type || 'Standard Topstitch'}</span></div>
                  </div>
                </div>

                {/* Structural Base vs Sculptural Separation */}
                <div className="p-3.5 bg-[#161719] rounded-xl border border-[#242529] space-y-2">
                  <div className="font-semibold text-[#F5F5F7] flex items-center justify-between">
                    <span>Structural vs Sculptural</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Separated</span>
                  </div>
                  <div className="text-[11px] text-[#8A8B93] space-y-1">
                    <div>Base Foundation: <span className="text-[#EDEDF0] font-medium capitalize">{workingSpec.structuralBase?.foundationType || workingSpec.identity?.garmentType}</span></div>
                    <div>Sculptural Components: <span className="text-[#EDEDF0] font-medium">{workingSpec.sculpturalComponents?.length ? `${workingSpec.sculpturalComponents.length} Overlays Isolated` : '0 (Anatomical Direct)'}</span></div>
                    <div>Fabric Weight: <span className="text-[#EDEDF0] font-medium capitalize">{workingSpec.material?.weight || 'Medium Woven'}</span></div>
                  </div>
                </div>
              </div>

              {/* AI Visual Evidence & Observations Citations */}
              {workingSpec.observations && workingSpec.observations.length > 0 && (
                <div className="p-4 bg-[#161719] rounded-xl border border-[#242529] space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#F5F5F7]">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#E5C07B]" />
                      <span>AI Visual Observations & Seam Evidence ({workingSpec.observations.length})</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#8A8B93]">Visual Evidence Grounding</span>
                  </div>
                  <div className="space-y-2">
                    {workingSpec.observations.map((obs, oIdx) => (
                      <div key={oIdx} className="p-2.5 bg-[#1C1D21] rounded-lg border border-[#2B2C31] text-[11px] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[#E5C07B] capitalize font-medium">{obs.field || 'Feature'}</span>
                          <div className="flex items-center gap-1.5">
                            {obs.sourceImages?.length > 0 && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#24252B] text-[#A0A1A8]">
                                {obs.sourceImages.join(', ')}
                              </span>
                            )}
                            <span className="text-[10px] font-mono text-emerald-400">
                              {Math.round((obs.confidence ?? 0.85) * 100)}%
                            </span>
                          </div>
                        </div>
                        <div className="text-[#EDEDF0]">{obs.evidence || (typeof obs.value === 'string' ? obs.value : JSON.stringify(obs.value))}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Human Mapping & Overrides */}
          {activeTab === 'mapping' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-[#18191B] rounded-xl border border-[#28292D] text-[11px] text-[#8A8B93]">
                Manually adjust any field below. Changes immediately become <span className="text-emerald-400 font-semibold font-mono">confirmed (1.0 confidence)</span> and re-run tailoring construction reasoning.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Garment Type Override */}
                <div className="space-y-1.5">
                  <label className="text-[#EDEDF0] font-medium">Garment Foundation Type</label>
                  <select
                    value={workingSpec.identity?.garmentType || 'shirt'}
                    onChange={(e) => handleFieldOverride('garmentType', e.target.value)}
                    className="w-full bg-[#1C1D21] border border-[#2D2E32] rounded-xl px-3 py-2 text-xs text-[#EDEDF0] focus:border-[#C5A059] outline-none"
                  >
                    <option value="shirt">Shirt / Dress Shirt</option>
                    <option value="trouser">Tailored Trouser</option>
                    <option value="jeans">5-Pocket Denim Jeans</option>
                    <option value="jacket">Tailored Jacket / Blazer</option>
                    <option value="dress">Fitted Dress</option>
                    <option value="gown">Column / Evening Gown</option>
                    <option value="skirt">Tailored Skirt</option>
                    <option value="polo">Knit Polo Shirt</option>
                    <option value="t_shirt">Knit T-Shirt</option>
                    <option value="shorts">Tailored Shorts</option>
                  </select>
                </div>

                {/* Silhouette Override */}
                <div className="space-y-1.5">
                  <label className="text-[#EDEDF0] font-medium">Silhouette Silhouette</label>
                  <select
                    value={workingSpec.silhouette?.primary || 'classic'}
                    onChange={(e) => handleFieldOverride('silhouette', e.target.value)}
                    className="w-full bg-[#1C1D21] border border-[#2D2E32] rounded-xl px-3 py-2 text-xs text-[#EDEDF0] focus:border-[#C5A059] outline-none"
                  >
                    <option value="classic">Classic / Balanced</option>
                    <option value="tailored_fit">Tailored Fit</option>
                    <option value="slim">Slim Fit</option>
                    <option value="relaxed">Relaxed / Casual</option>
                    <option value="wide_leg">Wide Leg</option>
                    <option value="pencil">Pencil</option>
                    <option value="column_sheath">Column Sheath</option>
                  </select>
                </div>

                {/* Sleeve Type Override */}
                <div className="space-y-1.5">
                  <label className="text-[#EDEDF0] font-medium">Sleeve Construction</label>
                  <select
                    value={workingSpec.sleeve?.type || 'set-in'}
                    onChange={(e) => handleFieldOverride('sleeve.type', e.target.value)}
                    className="w-full bg-[#1C1D21] border border-[#2D2E32] rounded-xl px-3 py-2 text-xs text-[#EDEDF0] focus:border-[#C5A059] outline-none"
                  >
                    <option value="set-in">Standard Set-In Sleeve</option>
                    <option value="raglan">Raglan Sleeve (Diagonal Scye)</option>
                    <option value="two-piece">Two-Piece Tailored Sleeve</option>
                    <option value="sleeveless">Sleeveless</option>
                    <option value="cap">Cap Sleeve</option>
                  </select>
                </div>

                {/* Collar Type Override */}
                <div className="space-y-1.5">
                  <label className="text-[#EDEDF0] font-medium">Collar Configuration</label>
                  <select
                    value={workingSpec.collar?.type || 'none'}
                    onChange={(e) => handleFieldOverride('collar.type', e.target.value)}
                    className="w-full bg-[#1C1D21] border border-[#2D2E32] rounded-xl px-3 py-2 text-xs text-[#EDEDF0] focus:border-[#C5A059] outline-none"
                  >
                    <option value="none">None (Clean Neckline)</option>
                    <option value="spread">Spread Collar with Stand</option>
                    <option value="notch_lapel">Notch Lapel (Suit / Blazer)</option>
                    <option value="peak_lapel">Peak Lapel</option>
                    <option value="band">Mandarin / Band Collar</option>
                    <option value="flat_knit">Flat-Knit Ribbed Collar</option>
                  </select>
                </div>

                {/* Neckline Override */}
                <div className="space-y-1.5">
                  <label className="text-[#EDEDF0] font-medium">Neckline Shape</label>
                  <select
                    value={workingSpec.neckline?.type || 'crew'}
                    onChange={(e) => handleFieldOverride('neckline.type', e.target.value)}
                    className="w-full bg-[#1C1D21] border border-[#2D2E32] rounded-xl px-3 py-2 text-xs text-[#EDEDF0] focus:border-[#C5A059] outline-none"
                  >
                    <option value="crew">Crew Neck</option>
                    <option value="v-neck">V-Neck</option>
                    <option value="boat">Boat Neck (Bateau)</option>
                    <option value="scoop">Scoop Neck</option>
                    <option value="sweetheart">Sweetheart</option>
                    <option value="collared">Collared Placket</option>
                  </select>
                </div>

                {/* Fit Ease Override */}
                <div className="space-y-1.5">
                  <label className="text-[#EDEDF0] font-medium">Design Ease Allowance (Total Inches)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={workingSpec.fit?.ease ?? 4.0}
                    onChange={(e) => handleFieldOverride('fit.ease', e.target.value)}
                    className="w-full bg-[#1C1D21] border border-[#2D2E32] rounded-xl px-3 py-2 text-xs text-[#EDEDF0] focus:border-[#C5A059] outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Design Transformations */}
          {activeTab === 'transformations' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#18191B] rounded-xl border border-[#28292D] text-[11px] text-[#8A8B93]">
                Quickly execute high-level design transformations on the specification. The system validates and re-resolves the construction pattern automatically.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleExecuteTransformation('CONVERT_SLEEVE_TO_RAGLAN')}
                  className="p-3 bg-[#161719] hover:bg-[#1E2024] border border-[#26272C] hover:border-[#C5A059]/40 rounded-xl text-left flex items-start gap-2.5 transition-all group"
                >
                  <Wand2 className="w-4 h-4 text-[#C5A059] mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-[#EDEDF0] group-hover:text-[#E5C07B]">Convert Sleeve to Raglan</div>
                    <div className="text-[11px] text-[#8A8B93]">Modifies scye trajectory to diagonal shoulder neckline seam.</div>
                  </div>
                </button>

                <button
                  onClick={() => handleExecuteTransformation('ADD_EASE', 2.0)}
                  className="p-3 bg-[#161719] hover:bg-[#1E2024] border border-[#26272C] hover:border-[#C5A059]/40 rounded-xl text-left flex items-start gap-2.5 transition-all group"
                >
                  <Sliders className="w-4 h-4 text-[#C5A059] mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-[#EDEDF0] group-hover:text-[#E5C07B]">Add 2.0&quot; Chest/Waist Ease</div>
                    <div className="text-[11px] text-[#8A8B93]">Relaxes silhouette ease for extra drape and movement.</div>
                  </div>
                </button>

                <button
                  onClick={() => handleExecuteTransformation('CONVERT_DART_TO_PRINCESS_SEAM')}
                  className="p-3 bg-[#161719] hover:bg-[#1E2024] border border-[#26272C] hover:border-[#C5A059]/40 rounded-xl text-left flex items-start gap-2.5 transition-all group"
                >
                  <Scissors className="w-4 h-4 text-[#C5A059] mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-[#EDEDF0] group-hover:text-[#E5C07B]">Absorb Darts to Princess Seams</div>
                    <div className="text-[11px] text-[#8A8B93]">Converts bust/waist darts into continuous side-front panels.</div>
                  </div>
                </button>

                <button
                  onClick={() => handleExecuteTransformation('ADD_POCKET', 'slant')}
                  className="p-3 bg-[#161719] hover:bg-[#1E2024] border border-[#26272C] hover:border-[#C5A059]/40 rounded-xl text-left flex items-start gap-2.5 transition-all group"
                >
                  <Layers className="w-4 h-4 text-[#C5A059] mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-[#EDEDF0] group-hover:text-[#E5C07B]">Add Slant Front Pockets</div>
                    <div className="text-[11px] text-[#8A8B93]">Inserts quarter-top slant pockets with stay tape.</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#232427] flex items-center justify-between bg-[#161719]">
          <div className="text-xs text-[#8A8B93]">
            {canApprove ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ready for CAD Generation ({resolution.engine})</span>
              </span>
            ) : (
              <span className="text-amber-400 font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Correction required before pattern compile</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#8A8B93] hover:text-[#EDEDF0] hover:bg-[#222427] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={!canApprove}
              className="px-5 py-2 text-xs font-semibold bg-[#C5A059] hover:bg-[#D4AF37] disabled:opacity-30 disabled:cursor-not-allowed text-[#101112] rounded-xl shadow-md flex items-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Approve & Generate CAD Pattern</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

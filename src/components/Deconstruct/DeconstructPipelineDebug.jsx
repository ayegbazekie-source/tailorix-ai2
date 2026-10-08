/**
 * TAILORIX AI — DECONSTRUCT PIPELINE DEBUG INSPECTOR
 * 
 * Forensic inspection panel verifying:
 * - Last Request Payload (image count, roles, prompt mode)
 * - Last AI Raw Response (provider, model, status, raw JSON)
 * - Normalized GarmentSpecification
 * - Resolved Pattern Engine
 * - Selected Pattern Pieces Generated
 * - Validation Results
 */

import React, { useState, useEffect } from 'react';
import { deconstructDebugStore } from '../../services/ai/deconstructDebugStore';
import { Bug, ChevronDown, ChevronUp, RefreshCw, CheckCircle, AlertTriangle, XCircle, Code, Layers, Cpu } from 'lucide-react';

export default function DeconstructPipelineDebug({ className = '' }) {
  const [debugData, setDebugData] = useState(() => deconstructDebugStore.getState());
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('payload'); // 'payload' | 'response' | 'spec' | 'routing' | 'pieces'

  useEffect(() => {
    setDebugData(deconstructDebugStore.getState());
    const unsubscribe = deconstructDebugStore.subscribe((state) => {
      setDebugData({ ...state });
    });
    return unsubscribe;
  }, []);

  const hasData = Boolean(
    debugData.lastRequest ||
    debugData.lastAiResponse ||
    debugData.normalizedSpec ||
    debugData.resolvedEngine
  );

  return (
    <div className={`border border-amber-500/30 bg-[#121316] rounded-xl overflow-hidden shadow-2xl ${className}`}>
      {/* Header Bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-amber-950/20 hover:bg-amber-950/30 transition-colors border-b border-amber-500/20 text-left"
      >
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono font-bold tracking-wider text-amber-400 uppercase">
            Deconstruct Pipeline Forensic Inspector
          </span>
          {debugData.lastAiResponse && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                debugData.lastAiResponse.success && debugData.lastAiResponse.responseSource === 'gemini'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : debugData.lastAiResponse.isDevMock || debugData.lastAiResponse.fallbackUsed
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {debugData.lastAiResponse.provider?.toUpperCase()} • {
                debugData.lastAiResponse.success && debugData.lastAiResponse.responseSource === 'gemini'
                  ? '200_OK'
                  : debugData.lastAiResponse.isDevMock || debugData.lastAiResponse.fallbackUsed
                  ? 'DEV_MOCK'
                  : debugData.lastAiResponse.status || 'ERR'
              }
            </span>
          )}
          {debugData.resolvedEngine && (
            <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Engine: {debugData.resolvedEngine.selectedEngine || 'none'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {debugData.updatedAt && (
            <span className="text-[10px] text-zinc-400 font-mono">
              {new Date(debugData.updatedAt).toLocaleTimeString()}
            </span>
          )}
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-zinc-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="p-4 space-y-3">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-zinc-800 pb-2">
            {[
              { id: 'payload', label: '1. Request Payload', icon: Code },
              { id: 'response', label: '2. Raw AI Response', icon: Cpu },
              { id: 'spec', label: '3. GarmentSpec', icon: Layers },
              { id: 'routing', label: '4. Engine Routing', icon: RefreshCw },
              { id: 'pieces', label: `5. Pieces (${debugData.patternPieces?.length || 0})`, icon: Layers },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab 1: Request Payload */}
          {activeTab === 'payload' && (
            <div className="space-y-2 text-xs font-mono text-zinc-300 bg-black/40 p-3 rounded-lg border border-zinc-800">
              {debugData.lastRequest ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-2 border-b border-zinc-800/60">
                    <div>
                      <span className="text-zinc-400 block text-[10px]">PROVIDER</span>
                      <span className="text-amber-400 font-bold">{debugData.lastRequest.provider}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px]">TASK</span>
                      <span className="text-zinc-200">{debugData.lastRequest.task}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px]">IMAGE COUNT</span>
                      <span className="text-emerald-400 font-bold">{debugData.lastRequest.imageCount}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px]">IMAGE ROLES</span>
                      <span className="text-zinc-200">{debugData.lastRequest.imageRoles?.join(', ') || 'none'}</span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <span className="text-zinc-400 block text-[10px] mb-1">PROMPT MODE</span>
                    <span className="text-zinc-200">{debugData.lastRequest.mode || 'full'}</span>
                  </div>
                  <div className="pt-1">
                    <span className="text-zinc-400 block text-[10px] mb-1">REQUEST ID</span>
                    <span className="text-zinc-400 text-[11px]">{debugData.lastRequest.requestId}</span>
                  </div>
                </>
              ) : (
                <div className="text-zinc-400 py-4 text-center">No AI request dispatched yet. Upload an image to trigger.</div>
              )}
            </div>
          )}

          {/* Tab 2: Raw AI Response */}
          {activeTab === 'response' && (
            <div className="space-y-2 text-xs font-mono bg-black/40 p-3 rounded-lg border border-zinc-800">
              {debugData.lastAiResponse ? (
                <>
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400 text-[10px]">MODEL:</span>
                      <span className="text-amber-300 font-bold">{debugData.lastAiResponse.model || 'none'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400 text-[10px]">STATUS:</span>
                      <span className={debugData.lastAiResponse.success && debugData.lastAiResponse.responseSource === 'gemini' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {debugData.lastAiResponse.status}
                      </span>
                    </div>
                  </div>
                  {/* Forensic Telemetry Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2 border-b border-zinc-800/40 text-[10px]">
                    <div className="bg-zinc-900/60 p-1.5 rounded">
                      <span className="text-zinc-400 block">PROVIDER:</span>
                      <span className="text-amber-300 font-semibold">{debugData.lastAiResponse.provider || 'gemini'}</span>
                    </div>
                    <div className="bg-zinc-900/60 p-1.5 rounded">
                      <span className="text-zinc-400 block">SOURCE:</span>
                      <span className={debugData.lastAiResponse.responseSource === 'gemini' ? 'text-emerald-300 font-semibold' : 'text-amber-400 font-semibold'}>
                        {debugData.lastAiResponse.responseSource || (debugData.lastAiResponse.success ? 'gemini' : 'none')}
                      </span>
                    </div>
                    <div className="bg-zinc-900/60 p-1.5 rounded">
                      <span className="text-zinc-400 block">FALLBACK:</span>
                      <span className={debugData.lastAiResponse.fallbackUsed ? 'text-rose-300 font-semibold' : 'text-emerald-300 font-semibold'}>
                        {debugData.lastAiResponse.fallbackUsed ? 'YES' : 'NONE (false)'}
                      </span>
                    </div>
                    <div className="bg-zinc-900/60 p-1.5 rounded">
                      <span className="text-zinc-400 block">HTTP STATUS:</span>
                      <span className={debugData.lastAiResponse.httpStatus === 200 ? 'text-emerald-300 font-semibold' : 'text-rose-400 font-semibold'}>
                        {debugData.lastAiResponse.httpStatus || (debugData.lastAiResponse.success ? 200 : 503)}
                      </span>
                    </div>
                  </div>
                  {debugData.lastAiResponse.error && (
                    <div className="p-2 rounded bg-rose-950/30 border border-rose-500/30 text-rose-300">
                      Error: {debugData.lastAiResponse.error}
                    </div>
                  )}
                  <div className="max-h-60 overflow-y-auto pt-1">
                    <pre className="text-[11px] text-zinc-300 whitespace-pre-wrap">
                      {JSON.stringify(debugData.lastAiResponse.raw || debugData.lastAiResponse, null, 2)}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="text-zinc-400 py-4 text-center">No AI response received yet.</div>
              )}
            </div>
          )}

          {/* Tab 3: Normalized GarmentSpecification */}
          {activeTab === 'spec' && (
            <div className="space-y-2 text-xs font-mono bg-black/40 p-3 rounded-lg border border-zinc-800">
              {debugData.normalizedSpec ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-2 border-b border-zinc-800/60">
                    <div>
                      <span className="text-zinc-400 block text-[10px]">GARMENT TYPE</span>
                      <span className="text-amber-400 font-bold">
                        {debugData.normalizedSpec.identity?.garmentType || debugData.normalizedSpec.garmentType}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px]">SILHOUETTE</span>
                      <span className="text-zinc-200">
                        {debugData.normalizedSpec.silhouette?.primary || debugData.normalizedSpec.silhouette || 'default'}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px]">CONFIDENCE</span>
                      <span className="text-emerald-400 font-bold">
                        {((debugData.normalizedSpec.confidence?.overall ?? 0.95) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px]">UNCERTAINTIES</span>
                      <span className="text-zinc-200">
                        {debugData.normalizedSpec.uncertainties?.length || 0}
                      </span>
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto pt-1">
                    <pre className="text-[11px] text-zinc-300 whitespace-pre-wrap">
                      {JSON.stringify(debugData.normalizedSpec, null, 2)}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="text-zinc-400 py-4 text-center">No GarmentSpecification normalized yet.</div>
              )}
            </div>
          )}

          {/* Tab 4: Engine Routing */}
          {activeTab === 'routing' && (
            <div className="space-y-2 text-xs font-mono bg-black/40 p-3 rounded-lg border border-zinc-800">
              {debugData.resolvedEngine ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pb-2 border-b border-zinc-800/60">
                    <div>
                      <span className="text-zinc-400 block text-[10px]">RESOLVED GARMENT TYPE</span>
                      <span className="text-amber-400 font-bold">
                        {debugData.resolvedEngine.resolvedGarmentType}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px]">SELECTED PATTERN ENGINE</span>
                      <span className="text-blue-400 font-bold">
                        {debugData.resolvedEngine.selectedEngine}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px]">CONSTRUCTION METHOD</span>
                      <span className="text-emerald-400">
                        {debugData.resolvedEngine.construction}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] mb-1">ENGINE PARAMETERS:</span>
                    <pre className="text-[11px] text-zinc-300 bg-black/60 p-2 rounded max-h-40 overflow-y-auto">
                      {JSON.stringify(debugData.resolvedEngine.parameters, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-zinc-400 py-4 text-center">No pattern engine routing recorded yet.</div>
              )}
            </div>
          )}

          {/* Tab 5: Pattern Pieces & Validation */}
          {activeTab === 'pieces' && (
            <div className="space-y-3 text-xs font-mono bg-black/40 p-3 rounded-lg border border-zinc-800">
              {debugData.patternPieces && debugData.patternPieces.length > 0 ? (
                <>
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                    <span className="text-zinc-300 font-bold">
                      GENERATED PIECES: {debugData.patternPieces.length}
                    </span>
                    {debugData.validationResults && (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          debugData.validationResults.summary?.status === 'PASS'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        Validation: {debugData.validationResults.summary?.status || 'VALID'}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto">
                    {debugData.patternPieces.map((p, idx) => (
                      <div
                        key={p.id || idx}
                        className="flex items-center justify-between p-2 rounded bg-zinc-900/60 border border-zinc-800"
                      >
                        <div>
                          <span className="text-amber-300 font-bold block">{p.name || p.id}</span>
                          <span className="text-[10px] text-zinc-400">ID: {p.id}</span>
                        </div>
                        <div className="text-right text-[11px]">
                          <span className="text-zinc-300 block">{p.pointCount} points</span>
                          {p.bounds && (
                            <span className="text-[10px] text-zinc-400">
                              {((p.bounds.width || 0) / 12).toFixed(1)}" × {((p.bounds.height || 0) / 12).toFixed(1)}"
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-zinc-400 py-4 text-center">No pattern pieces generated yet.</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

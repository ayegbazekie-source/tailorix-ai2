/**
 * TAILORIX AI — 3D GARMENT SIMULATION & DIGITAL TWIN VIEW
 * Visualizes 3D drape mesh, strain maps, and virtual mannequin fit.
 * Dark graphite interface with champagne accents and technical tension gauges.
 */

import React, { useState } from 'react';
import { Box, Activity, Layers, ShieldCheck, Eye } from 'lucide-react';

export default function Garment3DSimulationView({ pieces = [], garmentType = 'trouser', measurements = {} }) {
  const [simulationMode, setSimulationMode] = useState('drape'); // 'drape' | 'strain' | 'wireframe'

  return (
    <div className="w-full h-full bg-[#101112] p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto select-none">
      {/* Simulation Header */}
      <div className="bg-[#141517] p-4 rounded-2xl border border-[#222427] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-[#F5F5F7]">3D Digital Twin & Fit Simulation</h2>
          <p className="text-xs text-[#8A8B93] mt-0.5">
            Real-time cloth drape simulation and tension analysis based on parametric body measurements.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex bg-[#1A1B1E] p-1 rounded-xl border border-[#282A2E] gap-1 text-xs font-semibold">
          <button
            onClick={() => setSimulationMode('drape')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              simulationMode === 'drape'
                ? 'bg-[#C5A059]/15 border border-[#C5A059]/40 text-[#E5C07B] shadow-gold-sm'
                : 'text-[#8A8B93] hover:text-[#EDEDF0]'
            }`}
          >
            Fabric Drape
          </button>
          <button
            onClick={() => setSimulationMode('strain')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              simulationMode === 'strain'
                ? 'bg-[#C5A059]/15 border border-[#C5A059]/40 text-[#E5C07B] shadow-gold-sm'
                : 'text-[#8A8B93] hover:text-[#EDEDF0]'
            }`}
          >
            Tension Map
          </button>
          <button
            onClick={() => setSimulationMode('wireframe')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              simulationMode === 'wireframe'
                ? 'bg-[#C5A059]/15 border border-[#C5A059]/40 text-[#E5C07B] shadow-gold-sm'
                : 'text-[#8A8B93] hover:text-[#EDEDF0]'
            }`}
          >
            CAD Wireframe
          </button>
        </div>
      </div>

      {/* Main 3D Viewport Simulation Container */}
      <div className="flex-1 bg-[#141517] rounded-2xl border border-[#222427] shadow-panel p-6 flex flex-col relative overflow-hidden min-h-[460px]">
        <div className="flex items-center justify-between pb-3 border-b border-[#222427] text-xs text-[#8A8B93]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-[#EDEDF0] uppercase tracking-wider">
              {garmentType} FIT FORM (38 REGULAR)
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#C5A059]">SOLVER: EXPLICIT FEM TENSION</span>
        </div>

        {/* 3D Mannequin & Garment Vector Illustration */}
        <div className="flex-1 flex items-center justify-center relative min-h-[400px]">
          <svg viewBox="0 0 500 600" className="w-full h-full max-h-[480px]">
            {/* Soft Ambient Shadow */}
            <ellipse cx="250" cy="560" rx="140" ry="20" fill="#0A0B0C" opacity="0.7" />

            {/* Mannequin Form Contour */}
            <g opacity="0.3" stroke="#6B6D75" strokeWidth="1.5" fill="none">
              {/* Head & Neck */}
              <ellipse cx="250" cy="80" rx="22" ry="28" />
              <line x1="242" y1="108" x2="242" y2="135" />
              <line x1="258" y1="108" x2="258" y2="135" />
              {/* Shoulders & Torso */}
              <path d="M 180 145 C 220 135, 280 135, 320 145" />
              <path d="M 180 145 L 195 240 L 205 320" />
              <path d="M 320 145 L 305 240 L 295 320" />
              {/* Legs */}
              <line x1="210" y1="320" x2="215" y2="540" />
              <line x1="290" y1="320" x2="285" y2="540" />
            </g>

            {/* Simulating Garment Vector Geometry */}
            {simulationMode === 'strain' ? (
              <g>
                <defs>
                  <linearGradient id="strain-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                    <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.85" />
                    <stop offset="60%" stopColor="#10b981" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
                <path
                  d="M 205 220 C 230 225, 270 225, 295 220 L 315 310 C 310 330, 270 330, 255 330 C 240 330, 200 330, 185 310 Z"
                  fill="url(#strain-grad)"
                  stroke="#C5A059"
                  strokeWidth="2"
                />
                <path
                  d="M 185 310 L 200 520 L 235 520 L 245 330 Z"
                  fill="#10b981"
                  fillOpacity="0.65"
                  stroke="#C5A059"
                  strokeWidth="2"
                />
                <path
                  d="M 315 310 L 300 520 L 265 520 L 255 330 Z"
                  fill="#10b981"
                  fillOpacity="0.65"
                  stroke="#C5A059"
                  strokeWidth="2"
                />
              </g>
            ) : simulationMode === 'wireframe' ? (
              <g stroke="#38BDF8" strokeWidth="1" fill="none" opacity="0.85">
                <polygon points="205,220 250,225 250,260 200,250" />
                <polygon points="250,225 295,220 300,250 250,260" />
                <polygon points="200,250 250,260 250,300 190,290" />
                <polygon points="250,260 300,250 310,290 250,300" />
                <polygon points="190,290 250,300 245,340 185,320" />
                <polygon points="250,300 310,290 315,320 255,340" />
                <polygon points="185,320 245,340 240,430 195,430" />
                <polygon points="315,320 255,340 260,430 305,430" />
                <polygon points="195,430 240,430 235,520 200,520" />
                <polygon points="305,430 260,430 265,520 300,520" />
              </g>
            ) : (
              <g>
                <path
                  d="M 205 220 C 230 225, 270 225, 295 220 L 315 310 C 280 340, 220 340, 185 310 Z"
                  fill="#1E2024"
                  stroke="#C5A059"
                  strokeWidth="2"
                />
                <path
                  d="M 185 310 L 200 520 L 235 520 L 245 330 Z"
                  fill="#222429"
                  stroke="#C5A059"
                  strokeWidth="2"
                />
                <path
                  d="M 315 310 L 300 520 L 265 520 L 255 330 Z"
                  fill="#222429"
                  stroke="#C5A059"
                  strokeWidth="2"
                />
                {/* Crease & Stitch Accents */}
                <line x1="218" y1="310" x2="218" y2="515" stroke="#C5A059" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />
                <line x1="282" y1="310" x2="282" y2="515" stroke="#C5A059" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />
              </g>
            )}
          </svg>

          {/* Strain Legend */}
          {simulationMode === 'strain' && (
            <div className="absolute bottom-4 left-4 bg-[#18191B]/95 backdrop-blur-md p-3.5 rounded-2xl border border-[#28292D] text-xs shadow-floating space-y-1.5">
              <div className="font-semibold text-[#EDEDF0]">Tension Distribution</div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span className="text-[#8A8B93]">Optimal Fit (0–5% Stretch)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span className="text-[#8A8B93]">Moderate Pull (5–12% Strain)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span className="text-[#8A8B93]">Tight / Strain (&gt;12%)</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

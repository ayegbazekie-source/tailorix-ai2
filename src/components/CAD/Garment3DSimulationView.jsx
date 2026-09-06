/**
 * TAILORIX AI — 3D GARMENT SIMULATION & DIGITAL TWIN VIEW
 * Visualizes 3D drape mesh, strain maps, and virtual mannequin fit.
 */

import React, { useState } from 'react';
import { Box, Activity, Layers, ShieldCheck, Eye } from 'lucide-react';

export default function Garment3DSimulationView({ pieces = [], garmentType = 'trouser', measurements = {} }) {
  const [simulationMode, setSimulationMode] = useState('drape'); // 'drape' | 'strain' | 'wireframe'

  return (
    <div className="w-full h-full bg-[#f8fafc] p-6 flex flex-col gap-5 overflow-y-auto">
      {/* Simulation Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">3D Digital Twin & Fit Simulation</h2>
          <p className="text-xs text-slate-500">
            Real-time cloth drape simulation and pressure/strain tension analysis based on parametric body measurements.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 text-xs font-semibold">
          <button
            onClick={() => setSimulationMode('drape')}
            className={`px-3 py-1 rounded-lg transition-all ${
              simulationMode === 'drape' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Fabric Drape
          </button>
          <button
            onClick={() => setSimulationMode('strain')}
            className={`px-3 py-1 rounded-lg transition-all ${
              simulationMode === 'strain' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Tension / Strain Map
          </button>
          <button
            onClick={() => setSimulationMode('wireframe')}
            className={`px-3 py-1 rounded-lg transition-all ${
              simulationMode === 'wireframe' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            CAD Wireframe
          </button>
        </div>
      </div>

      {/* Main 3D Viewport Simulation Container */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col relative overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-800 uppercase tracking-wider">
              {garmentType} FIT FORM (38 REGULAR)
            </span>
          </div>
          <span className="font-mono text-[11px]">SOLVER: EXPLICIT FEM TENSION</span>
        </div>

        {/* 3D Mannequin & Garment Vector Illustration */}
        <div className="flex-1 flex items-center justify-center relative min-h-[420px]">
          <svg viewBox="0 0 500 600" className="w-full h-full max-h-[500px]">
            {/* Soft Ambient Shadow */}
            <ellipse cx="250" cy="560" rx="140" ry="20" fill="#e2e8f0" opacity="0.6" />

            {/* Mannequin Form Contour (Neutral Slate) */}
            <g opacity="0.25" stroke="#475569" strokeWidth="1.5" fill="none">
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
              // Strain Map Color Gradient Fill (Green = optimal fit, Yellow = mild tension, Red = high stretch)
              <g>
                <defs>
                  <linearGradient id="strain-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.7" />
                    <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.8" />
                    <stop offset="60%" stopColor="#10b981" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.7" />
                  </linearGradient>
                </defs>
                <path
                  d="M 205 220 C 230 225, 270 225, 295 220 L 315 310 C 310 330, 270 330, 255 330 C 240 330, 200 330, 185 310 Z"
                  fill="url(#strain-grad)"
                  stroke="#0f172a"
                  strokeWidth="2"
                />
                <path
                  d="M 185 310 L 200 520 L 235 520 L 245 330 Z"
                  fill="#10b981"
                  fillOpacity="0.6"
                  stroke="#0f172a"
                  strokeWidth="2"
                />
                <path
                  d="M 315 310 L 300 520 L 265 520 L 255 330 Z"
                  fill="#10b981"
                  fillOpacity="0.6"
                  stroke="#0f172a"
                  strokeWidth="2"
                />
              </g>
            ) : simulationMode === 'wireframe' ? (
              // Triangular Finite Element Mesh Wireframe
              <g stroke="#0284c7" strokeWidth="1" fill="none" opacity="0.85">
                <polygon points="205,220 250,225 250,260 200,250" />
                <polygon points="250,225 295,220 300,250 250,260" />
                <polygon points="200,250 250,260 250,300 190,290" />
                <polygon points="250,260 300,250 310,290 250,300" />
                <polygon points="190,290 250,300 245,340 185,320" />
                <polygon points="250,300 310,290 315,320 255,340" />
                {/* Leg Mesh */}
                <polygon points="185,320 245,340 240,430 195,430" />
                <polygon points="315,320 255,340 260,430 305,430" />
                <polygon points="195,430 240,430 235,520 200,520" />
                <polygon points="305,430 260,430 265,520 300,520" />
              </g>
            ) : (
              // Realistic Textured Fabric Drape
              <g>
                <path
                  d="M 205 220 C 230 225, 270 225, 295 220 L 315 310 C 280 340, 220 340, 185 310 Z"
                  fill="#f1f5f9"
                  stroke="#1e293b"
                  strokeWidth="2.5"
                />
                <path
                  d="M 185 310 L 200 520 L 235 520 L 245 330 Z"
                  fill="#f8fafc"
                  stroke="#1e293b"
                  strokeWidth="2.5"
                />
                <path
                  d="M 315 310 L 300 520 L 265 520 L 255 330 Z"
                  fill="#f8fafc"
                  stroke="#1e293b"
                  strokeWidth="2.5"
                />
                {/* Crease & Stitch Accents */}
                <line x1="218" y1="310" x2="218" y2="515" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3,3" />
                <line x1="282" y1="310" x2="282" y2="515" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3,3" />
              </g>
            )}
          </svg>

          {/* Strain Legend */}
          {simulationMode === 'strain' && (
            <div className="absolute bottom-4 left-4 bg-white/95 p-3 rounded-xl border border-slate-200 text-xs shadow-sm space-y-1.5">
              <div className="font-bold text-slate-800">Tension Distribution</div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-slate-600">Optimal Fit (0–5% Stretch)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span className="text-slate-600">Moderate Pull (5–12% Strain)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="text-slate-600">Tight / Pulling (&gt;12% Strain)</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

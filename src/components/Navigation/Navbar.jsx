/**
 * TAILORIX AI — PRIMARY NAVIGATION HEADER
 * Clean, professional workspace navigation with refined typography and restrained technical accents.
 */

import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Scissors, User, ScanLine, Palette, Bot, BookOpen, Folder, ChevronDown, PenTool } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { isSubscribed } = useAuth();
  const location = useLocation();
  const [showDraftingMenu, setShowDraftingMenu] = useState(false);
  const dropdownRef = useRef(null);

  const isDraftingActive = location.pathname === '/cad' || location.pathname === '/studio';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDraftingMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const standardNavLinks = [
    { to: '/deconstruct', label: 'Deconstruct', icon: ScanLine },
    { to: '/templates', label: 'Templates', icon: BookOpen },
    { to: '/projects', label: 'Projects', icon: Folder },
    { to: '/tutor', label: 'Master Tailor AI', icon: Bot },
  ];

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between text-slate-900 sticky top-0 z-40">
      <div className="flex items-center gap-6">
        <NavLink to="/cad" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-black text-slate-950 text-sm shadow-xs">
            TX
          </div>
          <span className="font-extrabold text-base tracking-tight text-slate-900">
            TAILORIX <span className="text-amber-600 font-semibold">CAD</span>
          </span>
        </NavLink>

        <nav className="hidden md:flex items-center gap-1">
          {/* Unified Drafting Board Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDraftingMenu(!showDraftingMenu)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isDraftingActive
                  ? 'bg-slate-100 text-slate-900 font-bold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title="Drafting Board Tools"
            >
              <Scissors className="w-3.5 h-3.5 text-amber-600" />
              <span>Drafting Board</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showDraftingMenu ? 'rotate-180' : ''}`} />
            </button>

            {showDraftingMenu && (
              <div className="absolute left-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  DRAFTING WORKSPACES
                </div>
                
                <NavLink
                  to="/cad"
                  onClick={() => setShowDraftingMenu(false)}
                  className={({ isActive }) =>
                    `flex items-start gap-2.5 px-3 py-2.5 transition-colors ${
                      isActive ? 'bg-amber-50/80 text-amber-950 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <PenTool className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Pattern Drafting Board</div>
                    <div className="text-[11px] text-slate-500 leading-tight">
                      Vector CAD drafting, sketchbook instruments, dart markers & DXF exports
                    </div>
                  </div>
                </NavLink>

                <NavLink
                  to="/studio"
                  onClick={() => setShowDraftingMenu(false)}
                  className={({ isActive }) =>
                    `flex items-start gap-2.5 px-3 py-2.5 transition-colors ${
                      isActive ? 'bg-amber-50/80 text-amber-950 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Scissors className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Cutting Table</div>
                    <div className="text-[11px] text-slate-500 leading-tight">
                      Fabric canvas, bodice pattern overlay, chalk tracing & scissors cutting
                    </div>
                  </div>
                </NavLink>
              </div>
            )}
          </div>

          {standardNavLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-bold'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>ENGINE: DETERMINISTIC CAD</span>
        </div>

        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
          <User className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
}

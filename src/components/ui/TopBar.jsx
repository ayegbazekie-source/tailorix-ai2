import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Scissors,
  ScanLine,
  BookOpen,
  Folder,
  Sparkles,
  Palette,
  PenTool,
  Users,
  User,
  Plus,
  ChevronDown,
  Settings,
  Sliders,
  Check,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showDraftingMenu, setShowDraftingMenu] = useState(false);
  const profileRef = useRef(null);
  const draftingRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      if (draftingRef.current && !draftingRef.current.contains(e.target)) {
        setShowDraftingMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isDraftingActive = location.pathname === '/cad' || location.pathname === '/studio';

  const otherNavItems = [
    { to: '/deconstruct', label: 'Photo to Pattern', icon: ScanLine },
    { to: '/templates', label: 'Ready-Made Outlines', icon: BookOpen },
    { to: '/projects', label: 'Projects', icon: Folder },
    { to: '/tutor', label: 'AI Atelier', icon: Sparkles },
    { to: '/community', label: 'Community', icon: Users },
  ];

  return (
    <header className="h-13 bg-[#121315] border-b border-[#222427] px-3 sm:px-5 flex items-center justify-between z-40 shrink-0 select-none">
      {/* Brand Identity */}
      <div className="flex items-center gap-6">
        <NavLink to="/cad" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#E2BF72] via-[#C5A059] to-[#9C7933] flex items-center justify-center text-[#101112] shadow-gold-sm transition-transform group-hover:scale-105">
            <Scissors className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-wide text-[#F5F5F7]">
                TAILORIX
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-widest text-[#C5A059] px-1.5 py-0.2 rounded bg-[#C5A059]/12 border border-[#C5A059]/25">
                CAD
              </span>
            </div>
          </div>
        </NavLink>

        {/* Desktop Workspace Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {/* Unified Drafting Board Dropdown */}
          <div className="relative" ref={draftingRef}>
            <button
              onClick={() => setShowDraftingMenu(!showDraftingMenu)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                isDraftingActive
                  ? 'bg-[#C5A059]/12 text-[#E5C07B] border border-[#C5A059]/30 font-semibold shadow-gold-sm'
                  : 'text-[#9E9EA7] hover:text-[#F5F5F7] hover:bg-[#1A1B1E] border border-transparent'
              }`}
            >
              <Scissors className={`w-3.5 h-3.5 ${isDraftingActive ? 'text-[#E5C07B]' : 'text-[#8A8B93]'}`} />
              <span>Drafting Board</span>
              <ChevronDown className={`w-3 h-3 text-[#8A8B93] transition-transform ${showDraftingMenu ? 'rotate-180' : ''}`} />
            </button>

            {showDraftingMenu && (
              <div className="absolute left-0 mt-1.5 w-72 bg-[#161719] border border-[#2D2E32] rounded-xl shadow-floating py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1 border-b border-[#232427] text-[10px] font-bold uppercase tracking-wider text-[#8A8B93]">
                  DRAFTING WORKSPACES
                </div>

                <NavLink
                  to="/cad"
                  onClick={() => setShowDraftingMenu(false)}
                  className={({ isActive }) =>
                    `flex items-start gap-2.5 px-3 py-2.5 transition-colors ${
                      isActive ? 'bg-[#C5A059]/15 text-[#F5F5F7]' : 'text-[#D0D0D5] hover:bg-[#1D1F22]'
                    }`
                  }
                >
                  <div className="w-7 h-7 rounded-lg bg-[#C5A059]/20 text-[#E5C07B] flex items-center justify-center shrink-0 mt-0.5 border border-[#C5A059]/30">
                    <PenTool className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#F5F5F7]">Pattern Drafting Board</div>
                    <div className="text-[11px] text-[#8A8B93] leading-tight">
                      Vector CAD drafting, sketchbook instruments, dart markers & DXF exports
                    </div>
                  </div>
                </NavLink>

                <NavLink
                  to="/studio"
                  onClick={() => setShowDraftingMenu(false)}
                  className={({ isActive }) =>
                    `flex items-start gap-2.5 px-3 py-2.5 transition-colors ${
                      isActive ? 'bg-[#C5A059]/15 text-[#F5F5F7]' : 'text-[#D0D0D5] hover:bg-[#1D1F22]'
                    }`
                  }
                >
                  <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0 mt-0.5 border border-rose-500/30">
                    <Scissors className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#F5F5F7]">Cutting Table</div>
                    <div className="text-[11px] text-[#8A8B93] leading-tight">
                      Fabric canvas, bodice pattern overlay, chalk tracing & scissors cutting
                    </div>
                  </div>
                </NavLink>
              </div>
            )}
          </div>

          {otherNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#C5A059]/12 text-[#E5C07B] border border-[#C5A059]/30 font-semibold shadow-gold-sm'
                    : 'text-[#9E9EA7] hover:text-[#F5F5F7] hover:bg-[#1A1B1E] border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#E5C07B]' : 'text-[#8A8B93]'}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Contextual Actions & User Profile */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => navigate('/deconstruct')}
          className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#1D1F22] hover:bg-[#25282C] border border-[#2D2F33] text-xs font-medium text-[#EDEDF0] transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
          <span>Photo to Pattern</span>
        </button>

        {/* User Account / Atelier Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 h-8 px-2 rounded-xl hover:bg-[#1C1E21] border border-transparent hover:border-[#2A2C30] transition-all"
            aria-label="User Profile"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#25272B] to-[#363940] border border-[#40434A] flex items-center justify-center text-[#C5A059] text-xs font-semibold">
              T
            </div>
            <ChevronDown className="w-3 h-3 text-[#8A8B93]" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-[#161719] border border-[#2D2E32] rounded-2xl shadow-floating py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2.5 border-b border-[#232427]">
                <p className="text-xs font-semibold text-[#F5F5F7]">Tailorix Atelier</p>
                <p className="text-[11px] text-[#9E9EA7] truncate">
                  {user?.email || 'master.tailor@tailorix.ai'}
                </p>
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#C5A059]/10 text-[#E5C07B] text-[10px] font-medium border border-[#C5A059]/20">
                  <span>Bespoke Professional Tier</span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    navigate('/projects');
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-[#EDEDF0] hover:bg-[#1E2023] flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Folder className="w-3.5 h-3.5 text-[#8A8B93]" />
                    Saved Projects
                  </span>
                  <span className="text-[10px] font-mono text-[#8A8B93]">Gallery</span>
                </button>
                <button
                  onClick={() => {
                    navigate('/templates');
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-[#EDEDF0] hover:bg-[#1E2023] flex items-center gap-2"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#8A8B93]" />
                  Ready-Made Outlines
                </button>
                <button
                  onClick={() => {
                    navigate('/tutor');
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-[#EDEDF0] hover:bg-[#1E2023] flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                  Master Tailor AI Tutor
                </button>
              </div>

              <div className="pt-1 border-t border-[#232427] px-4 py-2">
                <div className="flex items-center justify-between text-[11px] text-[#7A7C85]">
                  <span>Tailorix CAD Suite</span>
                  <span className="font-mono text-[10px]">v2.4.0</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

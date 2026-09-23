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
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showDraftingMenu, setShowDraftingMenu] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const profileRef = useRef(null);
  const draftingRef = useRef(null);
  const mobileNavRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      if (draftingRef.current && !draftingRef.current.contains(e.target)) {
        setShowDraftingMenu(false);
      }
      if (mobileNavRef.current && !mobileNavRef.current.contains(e.target) && !e.target.closest('#mobile-nav-trigger-btn')) {
        setShowMobileNav(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState(() => {
    return location.pathname === '/studio' ? 'cutting' : 'drafting';
  });

  useEffect(() => {
    if (location.pathname === '/studio') {
      setActiveWorkspaceTab('cutting');
    } else if (location.pathname === '/cad') {
      setActiveWorkspaceTab('drafting');
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleTabChange = (e) => {
      if (e.detail?.tab) {
        setActiveWorkspaceTab(e.detail.tab);
      }
    };
    window.addEventListener('tailorix-workspace-tab-changed', handleTabChange);
    return () => window.removeEventListener('tailorix-workspace-tab-changed', handleTabChange);
  }, []);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('tailorix-mobile-nav-toggle', { detail: { isOpen: showMobileNav } })
    );
  }, [showMobileNav]);

  const handleSelectWorkspace = (tab) => {
    setActiveWorkspaceTab(tab);
    if (location.pathname === '/cad' || location.pathname === '/studio') {
      window.dispatchEvent(new CustomEvent('tailorix-switch-workspace-tab', { detail: { tab } }));
      window.history.replaceState(null, '', tab === 'cutting' ? '/studio' : '/cad');
    } else {
      navigate(tab === 'cutting' ? '/studio' : '/cad');
    }
  };

  const isDraftingActive = location.pathname === '/cad' || location.pathname === '/studio';

  const otherNavItems = [
    { to: '/deconstruct', label: 'Photo to Pattern', icon: ScanLine },
    { to: '/templates', label: 'Ready-Made Outlines', icon: BookOpen },
    { to: '/projects', label: 'Projects', icon: Folder },
    { to: '/tutor', label: 'AI Atelier', icon: Sparkles },
    { to: '/community', label: 'Community', icon: Users },
  ];

  return (
    <header className={`h-13 bg-[#121315] border-b border-[#222427] px-3 sm:px-5 flex items-center justify-between ${showMobileNav ? 'z-[100]' : 'z-40'} shrink-0 select-none`}>
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

        {/* Desktop Workspace Navigation: Pattern Drafting Board & Cutting Table */}
        <nav className="hidden md:flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-[#16171a] p-0.5 rounded-xl border border-[#26282d]">
            {/* Pattern Drafting Board Tab */}
            <button
              onClick={() => handleSelectWorkspace('drafting')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isDraftingActive && activeWorkspaceTab === 'drafting'
                  ? 'bg-[#C5A059]/18 text-[#E5C07B] border border-[#C5A059]/40 shadow-gold-sm'
                  : 'text-[#9E9EA7] hover:text-[#F5F5F7] hover:bg-[#1E2024] border border-transparent'
              }`}
              title="Pattern Drafting Board: Vector CAD drafting, bodice sheets & instruments"
            >
              <PenTool className={`w-3.5 h-3.5 ${isDraftingActive && activeWorkspaceTab === 'drafting' ? 'text-[#E5C07B]' : 'text-[#8A8B93]'}`} />
              <span>Pattern Drafting Board</span>
            </button>

            {/* Cutting Table Tab */}
            <button
              onClick={() => handleSelectWorkspace('cutting')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isDraftingActive && activeWorkspaceTab === 'cutting'
                  ? 'bg-[#C5A059]/18 text-[#E5C07B] border border-[#C5A059]/40 shadow-gold-sm'
                  : 'text-[#9E9EA7] hover:text-[#F5F5F7] hover:bg-[#1E2024] border border-transparent'
              }`}
              title="Cutting Table: Fabric canvas, bodice overlay & scissors cutting"
            >
              <Scissors className={`w-3.5 h-3.5 ${isDraftingActive && activeWorkspaceTab === 'cutting' ? 'text-[#E5C07B]' : 'text-[#8A8B93]'}`} />
              <span>Cutting Table</span>
            </button>
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

        {/* Mobile Navigation Menu Button */}
        <button
          id="mobile-nav-trigger-btn"
          onClick={() => setShowMobileNav(!showMobileNav)}
          className="md:hidden flex items-center justify-center w-8 h-8 rounded-xl bg-[#18191c] hover:bg-[#222428] border border-[#2c2e33] text-[#EDEDF0] transition-colors"
          aria-label="Toggle App Navigation"
        >
          {showMobileNav ? <X className="w-4 h-4 text-[#C5A059]" /> : <Menu className="w-4 h-4 text-[#EDEDF0]" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {showMobileNav && (
        <div
          ref={mobileNavRef}
          className="md:hidden absolute top-13 left-0 right-0 bg-[#141517] border-b border-[#2D2E32] shadow-2xl z-[100] flex flex-col gap-2 animate-in fade-in duration-150"
          style={{
            paddingBottom: '16px',
            paddingRight: '13px',
            paddingLeft: '16px',
            paddingTop: '180px',
          }}
        >
          <div className="text-[11px] font-mono uppercase text-[#C5A059] tracking-wider mb-1">
            Workspaces & Modules
          </div>
          <button
            onClick={() => {
              handleSelectWorkspace('drafting');
              setShowMobileNav(false);
            }}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
              isDraftingActive && activeWorkspaceTab === 'drafting'
                ? 'bg-[#C5A059]/18 text-[#E5C07B] border border-[#C5A059]/40 shadow-gold-sm'
                : 'bg-[#1a1c20] text-[#D2D3D8] hover:bg-[#24262b]'
            }`}
          >
            <PenTool className="w-4 h-4 text-[#C5A059]" />
            <div className="flex flex-col">
              <span>Pattern Drafting Board</span>
              <span className="text-[10px] text-[#8A8B93] font-normal">Vector CAD canvas, bodice sheets & tools</span>
            </div>
          </button>

          <button
            onClick={() => {
              handleSelectWorkspace('cutting');
              setShowMobileNav(false);
            }}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
              isDraftingActive && activeWorkspaceTab === 'cutting'
                ? 'bg-[#C5A059]/18 text-[#E5C07B] border border-[#C5A059]/40 shadow-gold-sm'
                : 'bg-[#1a1c20] text-[#D2D3D8] hover:bg-[#24262b]'
            }`}
          >
            <Scissors className="w-4 h-4 text-[#C5A059]" />
            <div className="flex flex-col">
              <span>Cutting Table</span>
              <span className="text-[10px] text-[#8A8B93] font-normal">Industrial green rack, fabric nesting & cutting</span>
            </div>
          </button>

          <div className="h-px bg-[#26282d] my-1" />

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                navigate('/deconstruct');
                setShowMobileNav(false);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1a1c20] hover:bg-[#24262b] text-xs font-medium text-[#D2D3D8]"
            >
              <ScanLine className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Photo to Pattern</span>
            </button>
            <button
              onClick={() => {
                navigate('/templates');
                setShowMobileNav(false);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1a1c20] hover:bg-[#24262b] text-xs font-medium text-[#D2D3D8]"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#8A8B93]" />
              <span>Ready Outlines</span>
            </button>
            <button
              onClick={() => {
                navigate('/projects');
                setShowMobileNav(false);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1a1c20] hover:bg-[#24262b] text-xs font-medium text-[#D2D3D8]"
            >
              <Folder className="w-3.5 h-3.5 text-[#8A8B93]" />
              <span>Projects Gallery</span>
            </button>
            <button
              onClick={() => {
                navigate('/tutor');
                setShowMobileNav(false);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1a1c20] hover:bg-[#24262b] text-xs font-medium text-[#D2D3D8]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>AI Atelier</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

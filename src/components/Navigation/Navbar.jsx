/**
 * TAILORIX AI — PRIMARY NAVIGATION HEADER
 * Clean, professional workspace navigation with refined typography and restrained technical accents.
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Scissors, User, ScanLine, Palette, Bot, Users, BookOpen, Folder, Sliders } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { isSubscribed } = useAuth();

  const navLinks = [
    { to: '/deconstruct', label: 'Deconstruct', icon: ScanLine },
    { to: '/studio', label: 'SketchBook CAD', icon: Palette },
    { to: '/templates', label: 'Templates', icon: BookOpen },
    { to: '/projects', label: 'Projects', icon: Folder },
    { to: '/tutor', label: 'Master Tailor AI', icon: Bot },
  ];

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between text-slate-900 sticky top-0 z-40">
      <div className="flex items-center gap-6">
        <NavLink to="/deconstruct" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-black text-slate-950 text-sm shadow-xs">
            TX
          </div>
          <span className="font-extrabold text-base tracking-tight text-slate-900">
            TAILORIX <span className="text-amber-600 font-semibold">CAD</span>
          </span>
        </NavLink>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((item) => {
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

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Scissors, ScanLine, BookOpen, Folder, Sparkles } from 'lucide-react';

export function BottomNav() {
  const navItems = [
    { to: '/cad', label: 'Drafting', icon: Scissors },
    { to: '/deconstruct', label: 'Breakdown', icon: ScanLine },
    { to: '/templates', label: 'Outlines', icon: BookOpen },
    { to: '/projects', label: 'Projects', icon: Folder },
    { to: '/tutor', label: 'AI Atelier', icon: Sparkles },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#131416]/95 backdrop-blur-lg border-t border-[#222427] flex items-center justify-around z-50 px-2 sm:hidden shadow-floating select-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full py-1 text-xs transition-all tap-active ${
                isActive
                  ? 'text-[#E5C07B] font-semibold'
                  : 'text-[#82848D] hover:text-[#EDEDF0]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`w-9 h-7 rounded-xl flex items-center justify-center transition-all ${
                    isActive ? 'bg-[#C5A059]/15 border border-[#C5A059]/30 shadow-gold-sm' : ''
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#E5C07B]' : 'text-[#82848D]'}`} />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

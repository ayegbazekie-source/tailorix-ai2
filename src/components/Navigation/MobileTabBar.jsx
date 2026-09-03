import React from 'react';
import { NavLink } from 'react-router-dom';
import { ScanLine, Palette, Bot, Users } from 'lucide-react';

export default function MobileTabBar() {
  const navItems = [
    { to: '/deconstruct', label: 'Deconstruct', icon: ScanLine },
    { to: '/studio', label: 'Studio Canvas', icon: Palette },
    { to: '/tutor', label: 'AI Tutor', icon: Bot },
    { to: '/community', label: 'Community', icon: Users },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-around z-50 px-2 sm:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors ${
                isActive ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <Icon className="w-5 h-5 mb-1" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

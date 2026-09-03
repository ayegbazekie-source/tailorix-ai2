import React from 'react';
import { Scissors, Sparkles, User, Crown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { isSubscribed } = useAuth();

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between text-white sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
          <Scissors className="w-5 h-5 rotate-90" />
        </div>
        <span className="font-bold text-lg tracking-wide bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
          Tailorix AI
        </span>
      </div>

      <div className="flex items-center gap-3">
        {!isSubscribed ? (
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-full transition-all shadow-md shadow-amber-500/20">
            <Crown className="w-3.5 h-3.5" />
            <span>Upgrade $5/mo</span>
          </button>
        ) : (
          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Pro
          </span>
        )}

        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
          <User className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
}

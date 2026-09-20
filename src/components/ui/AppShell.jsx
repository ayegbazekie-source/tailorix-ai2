import React from 'react';
import { useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';

export function AppShell({ children }) {
  const location = useLocation();
  const isDraftingWorkspace = location.pathname === '/cad' || location.pathname === '/studio';

  return (
    <div className="h-screen max-h-screen bg-[#101112] text-slate-100 antialiased selection:bg-[#C5A059]/30 flex flex-col font-sans overflow-hidden">
      <TopBar />
      <main
        className={`flex-1 flex flex-col min-h-0 ${
          isDraftingWorkspace
            ? 'overflow-hidden pb-0'
            : 'overflow-y-auto pb-16 sm:pb-0'
        }`}
      >
        {children}
      </main>
      {!isDraftingWorkspace && <BottomNav />}
    </div>
  );
}


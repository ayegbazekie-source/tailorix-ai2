import React from 'react';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';

export function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-[#101112] text-slate-100 antialiased selection:bg-[#C5A059]/30 flex flex-col font-sans">
      <TopBar />
      <main className="flex-1 flex flex-col min-h-0 overflow-y-auto pb-16 sm:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

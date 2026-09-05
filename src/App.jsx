import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navigation/Navbar';
import MobileTabBar from './components/Navigation/MobileTabBar';

import DeconstructPage from './pages/DeconstructPage';
import StudioCanvasPage from './pages/StudioCanvasPage';
import MasterTailorPage from './pages/MasterTailorPage';
import CommunityPage from './pages/CommunityPage';

// Safe Inline Standalone Fallbacks to Prevent Blank Screens
const SafeTemplatesPage = () => (
  <div className="p-6 text-slate-100 font-mono min-h-screen bg-slate-950">
    <h1 className="text-xl font-bold text-amber-400 mb-2">TEMPLATE & CROQUI LIBRARY</h1>
    <p className="text-xs text-slate-400 mb-6">Select a sloper or croqui to load into the workbench.</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
        <h3 className="font-bold text-white mb-1">Standard Female Bodice</h3>
        <p className="text-xs text-slate-400 mb-3">Master block for pattern development.</p>
        <a href="/deconstruct" className="inline-block px-3 py-1.5 bg-amber-500 text-slate-950 text-xs font-bold rounded-lg">Load in Workbench</a>
      </div>
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
        <h3 className="font-bold text-white mb-1">Classic Trouser Sloper</h3>
        <p className="text-xs text-slate-400 mb-3">Straight leg foundation block.</p>
        <a href="/deconstruct" className="inline-block px-3 py-1.5 bg-amber-500 text-slate-950 text-xs font-bold rounded-lg">Load in Workbench</a>
      </div>
    </div>
  </div>
);

const SafeProjectsPage = () => (
  <div className="p-6 text-slate-100 font-mono min-h-screen bg-slate-950">
    <h1 className="text-xl font-bold text-amber-400 mb-2">SAVED PROJECTS GALLERY</h1>
    <p className="text-xs text-slate-400 mb-6">Manage your saved CAD patterns and drafts.</p>
    <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 text-center">
      <p className="text-xs text-slate-400 mb-4">No saved pattern drafts found in storage.</p>
      <a href="/deconstruct" className="inline-block px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-lg">Create New Draft</a>
    </div>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
          <Navbar />
          <main className="flex-1 pb-16 sm:pb-0 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/studio" replace />} />
              <Route path="/deconstruct" element={<DeconstructPage />} />
              <Route path="/studio" element={<StudioCanvasPage />} />
              <Route path="/tutor" element={<MasterTailorPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/templates" element={<SafeTemplatesPage />} />
              <Route path="/projects" element={<SafeProjectsPage />} />
              <Route path="*" element={<Navigate to="/studio" replace />} />
            </Routes>
          </main>
          <MobileTabBar />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

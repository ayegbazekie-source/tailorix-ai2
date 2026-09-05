import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navigation/Navbar';
import MobileTabBar from './components/Navigation/MobileTabBar';

import DeconstructPage from './pages/DeconstructPage';
import StudioCanvasPage from './pages/StudioCanvasPage';
import MasterTailorPage from './pages/MasterTailorPage';
import CommunityPage from './pages/CommunityPage';
import TemplatesPage from './pages/TemplatesPage';
import ProjectsPage from './pages/ProjectsPage';

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
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
            </Routes>
          </main>
          <MobileTabBar />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

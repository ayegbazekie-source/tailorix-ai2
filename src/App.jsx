import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import { AppShell } from './components/ui/AppShell';

import DeconstructPage from './pages/DeconstructPage';
import StudioCanvasPage from './pages/StudioCanvasPage';
import CADWorkbenchPage from './pages/CADWorkbenchPage';
import MasterTailorPage from './pages/MasterTailorPage';
import CommunityPage from './pages/CommunityPage';
import TemplatesPage from './pages/TemplatesPage';
import ProjectsPage from './pages/ProjectsPage';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppShell>
            <Routes>
              <Route path="/" element={<Navigate to="/cad" replace />} />
              <Route path="/cad" element={<CADWorkbenchPage />} />
              <Route path="/deconstruct" element={<DeconstructPage />} />
              <Route path="/studio" element={<StudioCanvasPage />} />
              <Route path="/tutor" element={<MasterTailorPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="*" element={<Navigate to="/cad" replace />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

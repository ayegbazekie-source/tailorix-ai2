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

// Inline Error Boundary to catch production-only execution errors
class ProductionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App Crash Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: '#f87171', backgroundColor: '#020617', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h2>Runtime Error Detected</h2>
          <p style={{ fontSize: '12px', color: '#94a3b8' }}>
            {this.state.error?.toString()}
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            style={{ marginTop: '10px', padding: '8px 16px', background: '#f59e0b', color: '#000', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
          >
            Return to Studio
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ProductionErrorBoundary>
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
                <Route path="*" element={<Navigate to="/studio" replace />} />
              </Routes>
            </main>
            <MobileTabBar />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ProductionErrorBoundary>
  );
}

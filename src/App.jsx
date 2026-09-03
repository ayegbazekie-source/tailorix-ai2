import React, { Component } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import StudioCanvas from './components/StudioCanvas/CanvasWorkspace';
import Toolbar from './components/StudioCanvas/Toolbar';
import { CanvasProvider } from './context/CanvasContext';

// Safe Error Boundary to prevent blank screens
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("App Crash:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center justify-center text-center">
          <h1 className="text-xl font-bold text-amber-500 mb-2">Tailorix AI Studio Notice</h1>
          <p className="text-sm text-slate-400 mb-4 max-w-md">
            {this.state.error?.toString() || "A component error occurred while rendering."}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-amber-500 text-slate-950 font-semibold rounded-xl text-sm"
          >
            Reload Studio
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <CanvasProvider>
        <Router>
          <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
            <Toolbar />
            <Routes>
              <Route path="/" element={<StudioCanvas />} />
              <Route path="*" element={<StudioCanvas />} />
            </Routes>
          </div>
        </Router>
      </CanvasProvider>
    </ErrorBoundary>
  );
}

import React, { Component } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import StudioCanvas from './components/StudioCanvas/CanvasWorkspace';
import Toolbar from './components/StudioCanvas/Toolbar';
import { CanvasProvider } from './context/CanvasContext';
import { Sparkles, Layers, Layout, Settings, FolderOpen } from 'lucide-react';

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
          <h1 className="text-xl font-bold text-amber-400 mb-2">Tailorix AI Studio Notice</h1>
          <p className="text-sm text-slate-400 mb-4 max-w-md">
            {this.state.error?.toString() || "A component error occurred while rendering."}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20"
          >
            Reload Studio
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function HeaderNav() {
  const location = useLocation();

  const navItems = [
    { name: 'Studio', path: '/', icon: Sparkles },
    { name: 'Deconstruct', path: '/deconstruct', icon: Layers },
    { name: 'Templates', path: '/templates', icon: Layout },
    { name: 'Projects', path: '/projects', icon: FolderOpen },
  ];

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between z-40 relative">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Sparkles className="w-5 h-5 text-slate-950 fill-slate-950" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-wide text-white leading-tight">TAILORIX <span className="text-amber-400">AI</span></h1>
          <p className="text-[10px] text-slate-400 tracking-wider uppercase font-medium">Digital Pattern Workbench</p>
        </div>
      </div>

      <nav className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/60">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive 
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <CanvasProvider>
        <Router>
          <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
            <HeaderNav />
            <div className="flex-1 relative overflow-hidden">
              <Toolbar />
              <Routes>
                <Route path="/" element={<StudioCanvas />} />
                <Route path="/deconstruct" element={<div className="p-8 text-center text-slate-400">Deconstruction Workbench Engine (Coming Next)</div>} />
                <Route path="/templates" element={<div className="p-8 text-center text-slate-400">Pattern & Croqui Templates Library (Coming Next)</div>} />
                <Route path="/projects" element={<div className="p-8 text-center text-slate-400">Saved Projects Gallery (Coming Next)</div>} />
                <Route path="*" element={<StudioCanvas />} />
              </Routes>
            </div>
          </div>
        </Router>
      </CanvasProvider>
    </ErrorBoundary>
  );
}

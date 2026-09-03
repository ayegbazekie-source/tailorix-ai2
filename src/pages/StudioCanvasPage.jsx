import React, { useState } from 'react';
import { CanvasProvider } from '../context/CanvasContext';
import CanvasWorkspace from '../components/StudioCanvas/CanvasWorkspace';
import Toolbar from '../components/StudioCanvas/Toolbar';
import LayerPanel from '../components/StudioCanvas/LayerPanel';

export default function StudioCanvasPage() {
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(false);

  return (
    <CanvasProvider>
      <div className="relative w-full h-full bg-slate-950 overflow-hidden">
        <Toolbar 
          onOpenLayers={() => setIsLayerPanelOpen(!isLayerPanelOpen)}
          onOpenFabricSettings={() => {}}
        />
        
        <CanvasWorkspace />

        <LayerPanel 
          isOpen={isLayerPanelOpen} 
          onClose={() => setIsLayerPanelOpen(false)} 
        />
      </div>
    </CanvasProvider>
  );
}

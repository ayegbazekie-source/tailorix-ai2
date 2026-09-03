import React, { useEffect, useRef, useState } from 'react';
import { useCanvas } from '../../context/CanvasContext';

export default function CanvasWorkspace() {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  const { 
    activeTool, 
    brushColor, 
    brushWidth, 
    cutSheetColor 
  } = useCanvas();

  useEffect(() => {
    let canvasInstance = null;

    // Dynamically import fabric to safely support Vite production builds
    import('fabric').then((fabricModule) => {
      const Fabric = fabricModule.fabric || fabricModule;
      if (!canvasRef.current || !Fabric?.Canvas) return;

      canvasInstance = new Fabric.Canvas(canvasRef.current, {
        width: window.innerWidth,
        height: window.innerHeight - 120,
        backgroundColor: cutSheetColor || '#1E293B',
        isDrawingMode: activeTool === 'chalk',
      });

      fabricCanvasRef.current = canvasInstance;
      setIsReady(true);

      if (canvasInstance.freeDrawingBrush) {
        canvasInstance.freeDrawingBrush.color = brushColor || '#FFFFFF';
        canvasInstance.freeDrawingBrush.width = brushWidth || 3;
      }
    }).catch((err) => {
      console.warn('Fabric.js loading issue:', err);
    });

    const handleResize = () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.setWidth(window.innerWidth);
        fabricCanvasRef.current.setHeight(window.innerHeight - 120);
        fabricCanvasRef.current.renderAll();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (canvasInstance) {
        canvasInstance.dispose();
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[calc(100vh-80px)] bg-slate-950 overflow-hidden select-none flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full touch-none" />
      {!isReady && (
        <div className="absolute text-slate-500 text-sm">
          Loading Canvas Engine...
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { useCanvas } from '../../context/CanvasContext';
import Toolbar from './Toolbar';

export default function CanvasWorkspace() {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  // Undo / Redo stacks
  const historyRef = useRef([]);
  const historyStepRef = useRef(-1);
  const isUpdatingRef = useRef(false);

  const { 
    activeTool, 
    brushColor, 
    brushWidth, 
    cutSheetColor 
  } = useCanvas();

  const saveState = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || isUpdatingRef.current) return;

    const json = JSON.stringify(canvas.toJSON());

    // Truncate future states if saved mid-history
    if (historyStepRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyStepRef.current + 1);
    }

    historyRef.current.push(json);
    historyStepRef.current = historyRef.current.length - 1;
  };

  const handleUndo = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || historyStepRef.current <= 0) return;

    isUpdatingRef.current = true;
    historyStepRef.current -= 1;
    const previousState = historyRef.current[historyStepRef.current];

    canvas.loadFromJSON(previousState, () => {
      canvas.renderAll();
      isUpdatingRef.current = false;
    });
  };

  const handleRedo = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || historyStepRef.current >= historyRef.current.length - 1) return;

    isUpdatingRef.current = true;
    historyStepRef.current += 1;
    const nextState = historyRef.current[historyStepRef.current];

    canvas.loadFromJSON(nextState, () => {
      canvas.renderAll();
      isUpdatingRef.current = false;
    });
  };

  const handleClear = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    canvas.clear();
    canvas.setBackgroundColor(cutSheetColor || '#1E293B', canvas.renderAll.bind(canvas));
    saveState();
  };

  useEffect(() => {
    let canvasInstance = null;

    import('fabric').then((fabricModule) => {
      const Fabric = fabricModule.fabric || fabricModule;
      if (!canvasRef.current || !Fabric?.Canvas) return;

      canvasInstance = new Fabric.Canvas(canvasRef.current, {
        width: window.innerWidth,
        height: window.innerHeight - 64,
        backgroundColor: cutSheetColor || '#1E293B',
        isDrawingMode: true,
      });

      fabricCanvasRef.current = canvasInstance;

      if (canvasInstance.freeDrawingBrush) {
        canvasInstance.freeDrawingBrush.color = brushColor || '#FFFFFF';
        canvasInstance.freeDrawingBrush.width = brushWidth || 3;
      }

      // Record initial blank state
      saveState();

      // Listen for object additions/modifications to record undo steps
      canvasInstance.on('object:added', () => saveState());
      canvasInstance.on('object:modified', () => saveState());

      setIsReady(true);
    }).catch((err) => {
      console.warn('Fabric.js loading error:', err);
    });

    const handleResize = () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.setWidth(window.innerWidth);
        fabricCanvasRef.current.setHeight(window.innerHeight - 64);
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

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = activeTool === 'chalk' || activeTool === 'straight_ruler' || activeTool === 'french_curve';

    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushWidth;
    }
  }, [activeTool, brushColor, brushWidth]);

  return (
    <div className="relative w-full h-[calc(100vh-64px)] bg-slate-950 overflow-hidden select-none flex items-center justify-center">
      <Toolbar onUndo={handleUndo} onRedo={handleRedo} onClear={handleClear} />
      <canvas ref={canvasRef} className="w-full h-full touch-none" />
      {!isReady && (
        <div className="absolute text-slate-400 text-xs font-medium tracking-wide bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800/80 shadow-xl">
          Initializing Tailorix Engine...
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { useCanvas } from '../../context/CanvasContext';

export default function CanvasWorkspace() {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const { 
    activeTool, 
    brushColor, 
    brushWidth, 
    cutSheetColor, 
    foldStyle,
    layers 
  } = useCanvas();

  useEffect(() => {
    // Initialize Fabric Canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight - 120,
      backgroundColor: cutSheetColor,
      isDrawingMode: activeTool === 'chalk',
    });

    fabricCanvasRef.current = canvas;

    // Set brush options
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushWidth;
    }

    const handleResize = () => {
      canvas.setWidth(window.innerWidth);
      canvas.setHeight(window.innerHeight - 120);
      canvas.renderAll();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, []);

  // Update canvas state on tool/color changes
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = activeTool === 'chalk';
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushWidth;
    }

    canvas.setBackgroundColor(cutSheetColor, canvas.renderAll.bind(canvas));
  }, [activeTool, brushColor, brushWidth, cutSheetColor]);

  return (
    <div className="relative w-full h-[calc(100vh-80px)] bg-slate-950 overflow-hidden select-none">
      <canvas ref={canvasRef} className="w-full h-full touch-none" />
    </div>
  );
}

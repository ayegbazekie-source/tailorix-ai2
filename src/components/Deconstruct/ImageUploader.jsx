import React, { useRef, useState } from 'react';
import { Upload, Sparkles, Loader2 } from 'lucide-react';

export default function ImageUploader({ onImageSelect, onAnalyze, isLoading = false }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (onImageSelect) onImageSelect(url);
    if (onAnalyze) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onAnalyze(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div 
      onClick={() => fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed bg-slate-900/40 hover:bg-slate-900/80 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all group max-w-lg mx-auto my-6 ${
        isDragging ? 'border-amber-400 bg-amber-500/10 scale-[1.01]' : 'border-slate-800 hover:border-amber-500/50'
      }`}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        {isLoading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <Upload className="w-6 h-6" />
        )}
      </div>
      <h3 className="text-base font-semibold text-white mb-1">
        {isLoading ? 'Analyzing Garment Structure...' : 'Upload or Drag Garment Photo'}
      </h3>
      <p className="text-xs text-slate-400 max-w-xs mb-4">
        Select or drag a photo of a denim jacket, trouser, gown, or shirt to analyze and extract pattern blocks.
      </p>
      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-semibold text-xs shadow-md shadow-amber-500/20">
        <Sparkles className="w-3.5 h-3.5" />
        <span>{isLoading ? 'Processing...' : 'Select or Drop Image'}</span>
      </span>
    </div>
  );
}

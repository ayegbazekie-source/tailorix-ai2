import React, { useRef } from 'react';
import { Upload, Image as ImageIcon, Sparkles } from 'lucide-react';

export default function ImageUploader({ onImageSelect }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onImageSelect(url);
    }
  };

  return (
    <div 
      onClick={() => fileInputRef.current?.click()}
      className="border-2 border-dashed border-slate-800 hover:border-amber-500/50 bg-slate-900/40 hover:bg-slate-900/80 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all group max-w-lg mx-auto my-8"
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Upload className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-white mb-1">Upload Garment Photo</h3>
      <p className="text-xs text-slate-400 max-w-xs mb-4">
        Select a photo of a denim jacket, trouser, or custom garment to analyze and deconstruct into pattern blocks.
      </p>
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-semibold text-xs shadow-md shadow-amber-500/20">
        <Sparkles className="w-3.5 h-3.5" /> Select Image
      </span>
    </div>
  );
}

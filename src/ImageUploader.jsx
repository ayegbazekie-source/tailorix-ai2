import React, { useState } from 'react';
import { Upload, Camera, Image as ImageIcon, Sparkles } from 'lucide-react';

export default function ImageUploader({ onAnalyze, isLoading }) {
  const [selectedImage, setSelectedImage] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartAnalysis = () => {
    if (selectedImage && !isLoading) {
      onAnalyze(selectedImage);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
      {!selectedImage ? (
        <label className="border-2 border-dashed border-slate-700 hover:border-amber-500/50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-950/50">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-full mb-3">
            <Upload className="w-6 h-6" />
          </div>
          <span className="text-slate-200 font-semibold text-sm mb-1">
            Upload Garment Photo or Sketch
          </span>
          <span className="text-slate-500 text-xs">PNG, JPG, WEBP up to 10MB</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      ) : (
        <div className="space-y-4">
          <div className="relative max-h-80 overflow-hidden rounded-xl border border-slate-800">
            <img
              src={selectedImage}
              alt="Garment Preview"
              className="w-full object-contain max-h-80 mx-auto"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 px-2.5 py-1 bg-slate-950/80 hover:bg-slate-900 text-slate-300 text-xs rounded-lg border border-slate-700"
            >
              Change Photo
            </button>
          </div>

          <button
            onClick={handleStartAnalysis}
            disabled={isLoading}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isLoading ? 'Deconstructing Structure...' : 'Analyze Pattern Structure'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

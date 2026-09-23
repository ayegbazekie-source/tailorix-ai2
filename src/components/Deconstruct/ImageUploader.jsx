import React, { useRef, useState } from 'react';
import { Upload, Sparkles, Loader2, Plus, X, Tag } from 'lucide-react';
import { SUPPORTED_ROLES } from '../../utils/imagePreparation';

export default function ImageUploader({ onImageSelect, onAnalyze, isLoading = false }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const processFileList = (files) => {
    if (!files || files.length === 0) return;

    const newEntries = [];
    const readers = [];

    Array.from(files).forEach((file, idx) => {
      const p = new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          let role = 'detail';
          if (selectedFiles.length === 0 && idx === 0) role = 'front';
          else if (selectedFiles.length === 1 && idx === 0) role = 'back';
          else if (idx === 1) role = 'back';

          resolve({
            id: `upload_${Date.now()}_${idx}`,
            name: file.name,
            role,
            data: reader.result,
          });
        };
        reader.readAsDataURL(file);
      });
      readers.push(p);
    });

    Promise.all(readers).then((results) => {
      setSelectedFiles((prev) => [...prev, ...results]);
      if (onImageSelect && results[0]) {
        onImageSelect(results[0].data);
      }
    });
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFileList(files);
    }
  };

  const handleRoleChange = (id, newRole) => {
    setSelectedFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, role: newRole } : item))
    );
  };

  const handleRemoveFile = (id, e) => {
    e.stopPropagation();
    setSelectedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const handleTriggerAnalysis = (e) => {
    if (e) e.stopPropagation();
    if (selectedFiles.length === 0) return;
    if (onAnalyze) {
      // If 1 image, can pass as single or array
      onAnalyze(selectedFiles.length === 1 ? selectedFiles[0].data : selectedFiles);
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
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFileList(files);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-4 space-y-3">
      <div 
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed bg-[#131417]/80 hover:bg-[#18191D] rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group ${
          isDragging ? 'border-[#C5A059] bg-[#C5A059]/10 scale-[1.01]' : 'border-[#28292E] hover:border-[#C5A059]/50'
        }`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          multiple
          className="hidden" 
        />
        <div className="w-12 h-12 rounded-xl bg-[#C5A059]/10 text-[#E5C07B] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Upload className="w-6 h-6" />
          )}
        </div>
        <h3 className="text-sm font-semibold text-[#EDEDF0] mb-1">
          {isLoading ? 'AI Deconstructing Garment Architecture...' : 'Upload Garment Reference Photo(s)'}
        </h3>
        <p className="text-[11px] text-[#8A8B93] max-w-sm mb-3">
          Upload single photo or multi-angle photos (Front, Back, Closeups) for collective AI reasoning.
        </p>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C5A059] hover:bg-[#D4AF37] text-slate-950 font-semibold text-xs shadow-md shadow-[#C5A059]/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isLoading ? 'Deconstructing...' : 'Choose or Drop Photos'}</span>
        </span>
      </div>

      {/* Multi-image Queue & Role Assignment */}
      {selectedFiles.length > 0 && (
        <div className="p-3 bg-[#16171A] rounded-xl border border-[#27282D] space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#EDEDF0]">
            <span>Uploaded Reference Gallery ({selectedFiles.length})</span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 text-[11px] text-[#C5A059] hover:underline"
            >
              <Plus className="w-3 h-3" /> Add Angle
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {selectedFiles.map((file) => (
              <div key={file.id} className="relative p-2 bg-[#1C1D21] rounded-lg border border-[#2C2D32] flex flex-col gap-1.5">
                <div className="relative aspect-square w-full rounded overflow-hidden bg-black/40">
                  <img src={file.data} alt={file.name} className="w-full h-full object-cover" />
                  <button
                    onClick={(e) => handleRemoveFile(file.id, e)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-1 text-[10px]">
                  <span className="text-[#8A8B93] truncate">{file.name}</span>
                  <select
                    value={file.role}
                    onChange={(e) => handleRoleChange(file.id, e.target.value)}
                    className="bg-[#24252A] text-[#EDEDF0] rounded px-1.5 py-0.5 border border-[#35363D] text-[10px] outline-none capitalize"
                  >
                    {SUPPORTED_ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              disabled={isLoading}
              onClick={handleTriggerAnalysis}
              className="px-4 py-2 bg-[#C5A059] hover:bg-[#D4AF37] disabled:opacity-50 text-slate-950 font-semibold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Start Collective AI Deconstruction</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

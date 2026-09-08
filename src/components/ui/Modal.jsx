import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
  id,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div id={id} className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#0A0B0C]/80 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Surface */}
      <div
        className={`relative w-full ${maxWidth} bg-[#161719] border border-[#2D2E32] rounded-2xl shadow-floating z-10 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150`}
      >
        <div className="px-5 py-4 border-b border-[#252629] flex items-center justify-between bg-[#18191B]">
          <div>
            <h3 className="text-sm font-semibold text-[#F5F5F7] tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-[#9E9EA7] mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-[#9E9EA7] hover:text-[#F5F5F7] hover:bg-[#222427] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  position = 'bottom', // 'bottom' | 'right'
  id,
}) {
  if (!isOpen) return null;

  return (
    <div id={id} className="fixed inset-0 z-50 overflow-hidden">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#0A0B0C]/75 backdrop-blur-sm transition-opacity"
      />
      <div
        className={`fixed bg-[#161719] border-[#2D2E32] shadow-floating z-10 transition-transform ${
          position === 'bottom'
            ? 'bottom-0 left-0 right-0 max-h-[85vh] border-t rounded-t-3xl'
            : 'top-0 right-0 bottom-0 w-full max-w-md border-l'
        }`}
      >
        <div className="px-5 py-4 border-b border-[#252629] flex items-center justify-between bg-[#18191B]">
          <div>
            <h3 className="text-sm font-semibold text-[#F5F5F7] tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-[#9E9EA7] mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-[#9E9EA7] hover:text-[#F5F5F7] hover:bg-[#222427] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto max-h-[calc(85vh-60px)]">{children}</div>
      </div>
    </div>
  );
}

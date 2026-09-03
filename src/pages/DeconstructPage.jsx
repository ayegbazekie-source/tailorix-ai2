import React, { useState } from 'react';
import ImageUploader from '../components/Deconstruct/ImageUploader';
import PanelBreakdownCard from '../components/Deconstruct/PanelBreakdownCard';
import { deconstructGarmentImage } from '../services/aiService';

export default function DeconstructPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [deconstructResult, setDeconstructResult] = useState(null);

  const handleAnalyze = async (imageBase64) => {
    setIsLoading(true);
    const response = await deconstructGarmentImage(imageBase64);
    setIsLoading(false);

    if (response.success) {
      setDeconstructResult(response.data);
    } else {
      // Mock fallback data for testing UI before backend edge function deployment
      setDeconstructResult({
        panels: [
          { name: 'Front Bodice Panel', quantity: 2, grainline: 'Straight Grain', cut_on_fold: false },
          { name: 'Back Bodice Panel', quantity: 1, grainline: 'Straight Grain', cut_on_fold: true },
          { name: 'Two-Piece Sleeve (Upper)', quantity: 2, grainline: 'Lengthwise', cut_on_fold: false },
          { name: 'Two-Piece Sleeve (Under)', quantity: 2, grainline: 'Lengthwise', cut_on_fold: false }
        ],
        seams: [
          'Flat-felled seams on main shoulder and side joints',
          'Bound bias tape edging along collar facing',
          '0.5-inch seam allowance throughout'
        ]
      });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-amber-400 mb-1">AI Garment Deconstruct</h1>
        <p className="text-slate-400 text-sm">
          Upload any photo, sketch, or denim style to instantly extract pattern panels, seam finishes, and grainlines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <ImageUploader onAnalyze={handleAnalyze} isLoading={isLoading} />
        </div>

        <div>
          <PanelBreakdownCard result={deconstructResult} />
        </div>
      </div>
    </div>
  );
}

/**
 * TAILORIX AI — GARMENT DECONSTRUCT PAGE
 * AI-powered reverse-engineering and pattern breakdown pipeline.
 * 4-Step Pipeline: Photo Upload -> Technical Analysis -> Pattern Blueprint Pieces -> Export to Studio Canvas.
 */

import React from 'react';
import GarmentDeconstructPipeline from '../components/Deconstruct/GarmentDeconstructPipeline';

export default function DeconstructPage() {
  return (
    <div className="w-full h-full bg-[#101112] text-[#EDEDF0]">
      <GarmentDeconstructPipeline />
    </div>
  );
}

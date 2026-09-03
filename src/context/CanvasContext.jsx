import React, { createContext, useContext, useState } from 'react';

const CanvasContext = createContext();

export const CanvasProvider = ({ children }) => {
  // Tool State: 'select', 'chalk', 'pen', 'straight_ruler', 'french_curve', 'hip_curve', 'measuring_tape', 'shears'
  const [activeTool, setActiveTool] = useState('chalk');
  const [brushColor, setBrushColor] = useState('#FFFFFF'); // White chalk default
  const [brushWidth, setBrushWidth] = useState(3);
  
  // Fabric & Cut-Sheet Settings
  const [fabricWidth, setFabricWidth] = useState(58); // Inches
  const [fabricLength, setFabricLength] = useState(2.5); // Yards
  const [cutSheetColor, setCutSheetColor] = useState('#1E293B'); // Slate base theme
  const [foldStyle, setFoldStyle] = useState('lengthwise_fold'); // 'open_width', 'lengthwise_fold', 'crosswise_fold', 'bias_fold'

  // Ruler & Shear Guides
  const [rulerActive, setRulerActive] = useState(false);
  const [activeRulerType, setActiveRulerType] = useState(null); // 'straight', 'french_curve', 'hip_curve'
  const [infraredGuideActive, setInfraredGuideActive] = useState(true);

  // Layer Management (Includes Eye Visibility Toggle)
  const [layers, setLayers] = useState([
    { id: 'layer_fabric', name: 'Fabric Base & Fold', visible: true, locked: true, type: 'fabric' },
    { id: 'layer_chalk', name: 'Chalk & Cutting Lines', visible: true, locked: false, type: 'drawing' },
    { id: 'layer_annotations', name: 'Text & Measurements', visible: true, locked: false, type: 'text' }
  ]);
  const [activeLayerId, setActiveLayerId] = useState('layer_chalk');

  // Toggle Layer Eye Visibility (Autodesk SketchBook Style)
  const toggleLayerVisibility = (layerId) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      )
    );
  };

  const toggleLayerLock = (layerId) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
      )
    );
  };

  return (
    <CanvasContext.Provider
      value={{
        activeTool, setActiveTool,
        brushColor, setBrushColor,
        brushWidth, setBrushWidth,
        fabricWidth, setFabricWidth,
        fabricLength, setFabricLength,
        cutSheetColor, setCutSheetColor,
        foldStyle, setFoldStyle,
        rulerActive, setRulerActive,
        activeRulerType, setActiveRulerType,
        infraredGuideActive, setInfraredGuideActive,
        layers, setLayers,
        activeLayerId, setActiveLayerId,
        toggleLayerVisibility, toggleLayerLock
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
};

export const useCanvas = () => useContext(CanvasContext);

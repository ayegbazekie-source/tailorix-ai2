/**
 * Utility to export pattern geometry as SVG or standard R12 DXF format.
 */

export function exportToSVG(cadData, category = 'garment') {
  const svgElement = document.getElementById('cad-pattern-svg');
  if (!svgElement) return;

  const svgData = new XMLSerializer().serializeToString(svgElement);
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `tailorix-${category.toLowerCase()}-pattern.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToDXF(cadData, category = 'garment') {
  if (!cadData || !cadData.pieces) return;

  let dxfString = `0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n`;

  cadData.pieces.forEach((piece) => {
    // Generate DXF LWPOLYLINE entity for pattern outline
    dxfString += `0\nLWPOLYLINE\n8\n${piece.id}\n90\n4\n70\n1\n`;
    
    // Extract SVG path coordinates (simplified representation for DXF line strings)
    const points = parseSvgPathToPoints(piece.path);
    points.forEach((pt) => {
      dxfString += `10\n${pt.x}\n20\n${pt.y}\n`;
    });

    // Add grainline as a separate layer line
    if (piece.grainline) {
      dxfString += `0\nLINE\n8\n${piece.id}_GRAINLINE\n`;
      dxfString += `10\n${piece.grainline.x1}\n20\n${piece.grainline.y1}\n`;
      dxfString += `11\n${piece.grainline.x2}\n21\n${piece.grainline.y2}\n`;
    }
  });

  dxfString += `0\nENDSEC\n0\nEOF\n`;

  const blob = new Blob([dxfString], { type: 'application/dxf;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `tailorix-${category.toLowerCase()}-pattern.dxf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function parseSvgPathToPoints(pathString) {
  // Extract coordinate pairs from SVG path string for CAD conversion
  const matches = pathString.match(/[-+]?[0-9]*\.?[0-9]+/g);
  const points = [];
  if (!matches) return points;

  for (let i = 0; i < matches.length - 1; i += 2) {
    points.push({ x: parseFloat(matches[i]), y: parseFloat(matches[i + 1]) });
  }
  return points;
}

import { generatePatternCAD } from '../patternEngine';
import { generateSeamAllowancePath } from '../patternEngine/seamOffset';
import { calculateFabricMarker } from '../markerEngine';

describe('TAILORIX CAD Engine Core Tests', () => {
  const baseMeasurements = {
    waist: 32,
    hip: 40,
    crotchDepth: 10.5,
    kneeHeight: 20,
    inseam: 32,
    kneeWidth: 16,
    hemWidth: 22,
  };

  const defaultParams = { seamAllowance: 0.5 };

  test('Generates valid trouser pattern pieces without crashing', () => {
    const cad = generatePatternCAD('trouser', baseMeasurements, defaultParams);
    expect(cad).toHaveProperty('pieces');
    expect(cad.pieces.length).toBeGreaterThan(0);
    expect(cad.pieces[0]).toHaveProperty('path');
    expect(cad.pieces[0].points.length).toBeGreaterThan(2);
  });

  test('Offset calculation handles edge case seam allowances correctly', () => {
    const testPoints = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    const path05 = generateSeamAllowancePath(testPoints, 0.5);
    const path10 = generateSeamAllowancePath(testPoints, 1.0);

    expect(typeof path05).toBe('string');
    expect(path05.startsWith('M')).toBe(true);
    expect(path05).not.toEqual(path10);
  });

  test('Fabric yield calculator returns accurate metrics', () => {
    const mockPieces = [
      { id: 'p1', name: 'Front', points: [{ x: 0, y: 0 }, { x: 10, y: 10 }] },
      { id: 'p2', name: 'Back', points: [{ x: 0, y: 0 }, { x: 10, y: 10 }] },
    ];
    const result = calculateFabricMarker(mockPieces, 60);

    expect(result).toHaveProperty('requiredYards');
    expect(result).toHaveProperty('efficiency');
    expect(Number(result.efficiency)).toBeGreaterThanOrEqual(0);
  });
});

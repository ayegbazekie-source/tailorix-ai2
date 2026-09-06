/**
 * TAILORIX AI — PATTERN ENGINE ENTRY POINT
 */

import { generatePattern } from './patternRegistry';

export { generatePattern };

/**
 * Backwards compatibility wrapper for generatePatternCAD.
 */
export function generatePatternCAD(category = 'trouser', measurements = {}, parameters = {}) {
  return generatePattern({ garmentType: category }, measurements, parameters);
}

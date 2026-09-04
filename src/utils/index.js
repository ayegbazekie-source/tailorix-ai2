import { draftTrouserPattern } from './trouserEngine';
import { draftShirtPattern } from './shirtEngine';
import { draftSkirtPattern } from './skirtEngine';
import { draftJacketPattern } from './jacketEngine';
import { draftGownPattern } from './gownEngine';

export function generatePatternCAD(category, measurements, parameters) {
  switch (category.toLowerCase()) {
    case 'trouser':
    case 'trousers':
    case 'shorts':
      return draftTrouserPattern(measurements, parameters);

    case 'shirt':
    case 'blouse':
    case 'shirts':
    case 'blouses':
      return draftShirtPattern(measurements, parameters);

    case 'skirt':
    case 'skirts':
      return draftSkirtPattern(measurements, parameters);

    case 'jacket':
    case 'jackets':
      return draftJacketPattern(measurements, parameters);

    case 'gown':
    case 'gowns':
    case 'dress':
      return draftGownPattern(measurements, parameters);

    default:
      throw new Error(`Unsupported garment category: ${category}`);
  }
}

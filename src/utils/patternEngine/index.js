import { draftTrouserPattern } from './trouserEngine';
import { draftShirtPattern } from './shirtEngine';
import { draftSkirtPattern } from './skirtEngine';
import { draftJacketPattern } from './jacketEngine';
import { draftGownPattern } from './gownEngine';

export function generatePatternCAD(category = 'trouser', measurements = {}, parameters = {}) {
  const cat = category.toLowerCase();

  switch (cat) {
    case 'trouser':
    case 'trousers':
    case 'shorts':
      return draftTrouserPattern(measurements, parameters);

    case 'shirt':
    case 'blouse':
    case 'shirts':
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
      return draftTrouserPattern(measurements, parameters);
  }
}

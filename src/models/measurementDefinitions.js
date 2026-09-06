/**
 * TAILORIX AI — DYNAMIC MEASUREMENT DEFINITIONS & GLOBAL UNIT SYSTEM
 * Canonical internal unit: INCHES.
 * Converts seamlessly to Centimeters (cm) and Millimeters (mm).
 */

export const UNIT_SYSTEMS = {
  INCHES: 'in',
  CENTIMETERS: 'cm',
  MILLIMETERS: 'mm',
};

export const CONVERSION_FACTORS = {
  in_to_cm: 2.54,
  cm_to_in: 1 / 2.54,
  in_to_mm: 25.4,
  mm_to_in: 1 / 25.4,
};

/**
 * Converts value from canonical inches to target unit.
 */
export function fromCanonical(inches, targetUnit = 'in') {
  if (typeof inches !== 'number' || isNaN(inches)) return 0;
  if (targetUnit === 'cm') return Number((inches * CONVERSION_FACTORS.in_to_cm).toFixed(2));
  if (targetUnit === 'mm') return Number((inches * CONVERSION_FACTORS.in_to_mm).toFixed(1));
  return Number(inches.toFixed(2));
}

/**
 * Converts value from user input in target unit to canonical inches.
 */
export function toCanonical(value, sourceUnit = 'in') {
  const num = Number(value);
  if (isNaN(num)) return 0;
  if (sourceUnit === 'cm') return Number((num * CONVERSION_FACTORS.cm_to_in).toFixed(4));
  if (sourceUnit === 'mm') return Number((num * CONVERSION_FACTORS.mm_to_in).toFixed(4));
  return Number(num.toFixed(4));
}

/**
 * Formats a measurement for display with its unit symbol.
 */
export function formatMeasurement(valueInCanonicalInches, unit = 'in') {
  const val = fromCanonical(valueInCanonicalInches, unit);
  return `${val} ${unit}`;
}

/**
 * Measurement schemas defined per garment family.
 * Values are stored in CANONICAL INCHES.
 */
export const MEASUREMENT_SCHEMAS = {
  bottoms: [
    {
      id: 'waist',
      label: 'Natural Waist',
      description: 'Circumference around the narrowest point of the torso above the navel.',
      defaultVal: 32,
      min: 22,
      max: 60,
      required: true,
      category: 'Primary Circumferences',
    },
    {
      id: 'hip',
      label: 'Full Hip / Seat',
      description: 'Circumference around the fullest part of the buttocks.',
      defaultVal: 40,
      min: 28,
      max: 70,
      required: true,
      category: 'Primary Circumferences',
    },
    {
      id: 'crotchDepth',
      label: 'Crotch Rise / Depth',
      description: 'Vertical distance from waistband to chair surface while seated upright.',
      defaultVal: 10.5,
      min: 7,
      max: 16,
      required: true,
      category: 'Vertical Lengths',
    },
    {
      id: 'inseam',
      label: 'Inseam Length',
      description: 'Distance from the crotch fork down along the inside leg to the desired hem.',
      defaultVal: 32,
      min: 15,
      max: 42,
      required: true,
      category: 'Vertical Lengths',
    },
    {
      id: 'kneeHeight',
      label: 'Waist to Knee',
      description: 'Vertical distance from natural waistline to the knee pivot center.',
      defaultVal: 20,
      min: 14,
      max: 28,
      required: false,
      category: 'Vertical Lengths',
    },
    {
      id: 'kneeWidth',
      label: 'Knee Circumference',
      description: 'Circumference around the leg at the knee line.',
      defaultVal: 16,
      min: 12,
      max: 26,
      required: false,
      category: 'Widths & Flares',
    },
    {
      id: 'hemWidth',
      label: 'Hem Opening',
      description: 'Total trouser leg bottom opening circumference.',
      defaultVal: 18,
      min: 10,
      max: 32,
      required: false,
      category: 'Widths & Flares',
    },
  ],

  tops: [
    {
      id: 'bustChest',
      label: 'Chest / Bust',
      description: 'Circumference around the fullest part of the chest under armpits.',
      defaultVal: 38,
      min: 28,
      max: 65,
      required: true,
      category: 'Torso Circumferences',
    },
    {
      id: 'neckCircumference',
      label: 'Neck Base',
      description: 'Circumference around the base of the neck where collar rests.',
      defaultVal: 15.5,
      min: 12,
      max: 24,
      required: true,
      category: 'Torso Circumferences',
    },
    {
      id: 'shoulderWidth',
      label: 'Shoulder Across',
      description: 'Across the back from shoulder bone tip to shoulder bone tip.',
      defaultVal: 17.5,
      min: 13,
      max: 26,
      required: true,
      category: 'Torso Dimensions',
    },
    {
      id: 'shirtLength',
      label: 'Shirt / Body Length',
      description: 'Length from high shoulder point beside neck down to bottom hem.',
      defaultVal: 29,
      min: 20,
      max: 40,
      required: true,
      category: 'Torso Dimensions',
    },
    {
      id: 'sleeveLength',
      label: 'Sleeve Length',
      description: 'From shoulder bone tip down along bent elbow to wrist bone.',
      defaultVal: 24.5,
      min: 16,
      max: 32,
      required: true,
      category: 'Sleeve & Arm',
    },
    {
      id: 'bicepWidth',
      label: 'Bicep Circumference',
      description: 'Circumference around the fullest part of the upper arm.',
      defaultVal: 14,
      min: 9,
      max: 24,
      required: false,
      category: 'Sleeve & Arm',
    },
    {
      id: 'wristCircumference',
      label: 'Wrist / Cuff',
      description: 'Circumference around wrist bone for cuff calculation.',
      defaultVal: 7.5,
      min: 5,
      max: 12,
      required: false,
      category: 'Sleeve & Arm',
    },
  ],

  outerwear: [
    {
      id: 'bustChest',
      label: 'Chest Circumference',
      description: 'Full chest circumference with outerwear allowance.',
      defaultVal: 40,
      min: 30,
      max: 66,
      required: true,
      category: 'Torso Circumferences',
    },
    {
      id: 'waist',
      label: 'Jacket Waist',
      description: 'Circumference at buttoning point.',
      defaultVal: 35,
      min: 26,
      max: 62,
      required: true,
      category: 'Torso Circumferences',
    },
    {
      id: 'shoulderWidth',
      label: 'Cross Shoulder',
      description: 'Shoulder point to shoulder point including pad allowance.',
      defaultVal: 18.5,
      min: 14,
      max: 26,
      required: true,
      category: 'Torso Dimensions',
    },
    {
      id: 'jacketLength',
      label: 'Jacket Back Length',
      description: 'Center back from collar seam down to hem.',
      defaultVal: 30,
      min: 22,
      max: 46,
      required: true,
      category: 'Torso Dimensions',
    },
    {
      id: 'sleeveLength',
      label: 'Sleeve Length',
      description: 'Crown of sleeve to cuff edge.',
      defaultVal: 25,
      min: 18,
      max: 32,
      required: true,
      category: 'Sleeve Dimensions',
    },
    {
      id: 'lapelWidth',
      label: 'Lapel Width',
      description: 'Width of jacket lapel at the widest point.',
      defaultVal: 3.25,
      min: 1.5,
      max: 6.0,
      required: false,
      category: 'Style Parameters',
    },
  ],

  dresses_skirts: [
    {
      id: 'waist',
      label: 'Waist',
      description: 'Natural waist circumference where waistband sits.',
      defaultVal: 28,
      min: 20,
      max: 56,
      required: true,
      category: 'Circumferences',
    },
    {
      id: 'hip',
      label: 'Hip Circumference',
      description: 'Fullest hip circumference.',
      defaultVal: 38,
      min: 26,
      max: 66,
      required: true,
      category: 'Circumferences',
    },
    {
      id: 'skirtLength',
      label: 'Skirt / Garment Length',
      description: 'From waistline down to desired hemline.',
      defaultVal: 26,
      min: 12,
      max: 60,
      required: true,
      category: 'Lengths',
    },
    {
      id: 'hipDepth',
      label: 'Waist to Hip Depth',
      description: 'Vertical drop from waistline to fullest hip level.',
      defaultVal: 8,
      min: 6,
      max: 12,
      required: false,
      category: 'Lengths',
    },
    {
      id: 'bustChest',
      label: 'Bust (For Gowns/Dresses)',
      description: 'Full bust apex circumference.',
      defaultVal: 36,
      min: 28,
      max: 60,
      required: false,
      category: 'Circumferences',
    },
  ],
};

/**
 * Retrieves the applicable measurement fields for any garment type or family.
 */
export function getMeasurementsForGarment(garmentFamilyOrType) {
  const key = String(garmentFamilyOrType).toLowerCase();
  if (['trouser', 'trousers', 'jeans', 'shorts', 'bottoms'].includes(key)) {
    return MEASUREMENT_SCHEMAS.bottoms;
  }
  if (['shirt', 'blouse', 'polo', 't_shirt', 'tops'].includes(key)) {
    return MEASUREMENT_SCHEMAS.tops;
  }
  if (['jacket', 'blazer', 'coat', 'vest', 'outerwear'].includes(key)) {
    return MEASUREMENT_SCHEMAS.outerwear;
  }
  if (['skirt', 'dress', 'gown', 'dresses_skirts'].includes(key)) {
    return MEASUREMENT_SCHEMAS.dresses_skirts;
  }
  return MEASUREMENT_SCHEMAS.bottoms;
}

/**
 * Initializes default measurements in canonical inches for a given garment family.
 */
export function getDefaultMeasurements(garmentFamilyOrType) {
  const schema = getMeasurementsForGarment(garmentFamilyOrType);
  const defaults = {};
  schema.forEach((field) => {
    defaults[field.id] = field.defaultVal;
  });
  return defaults;
}

export const getDefaultMeasurementsForGarment = getDefaultMeasurements;

/**
 * Validates a measurement object against schema constraints.
 */
export function validateMeasurements(measurements, garmentFamilyOrType) {
  const schema = getMeasurementsForGarment(garmentFamilyOrType);
  const errors = [];

  schema.forEach((field) => {
    const val = measurements[field.id];
    if (field.required && (val === undefined || val === null || val <= 0)) {
      errors.push(`${field.label} is required.`);
    } else if (val !== undefined && val !== null) {
      if (val < field.min) {
        errors.push(`${field.label} (${val}") is below minimum realistic value (${field.min}").`);
      } else if (val > field.max) {
        errors.push(`${field.label} (${val}") exceeds maximum realistic value (${field.max}").`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

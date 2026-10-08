/**
 * TAILORIX AI — IMAGE PREPARATION & NORMALIZATION UTILITY
 * 
 * Prepares reference imagery for multi-modal vision analysis:
 * - Validates MIME type and integrity
 * - Resizes oversized images to optimal resolution preserving fine seam/stitch details
 * - Normalizes role tagging and assigns stable reference IDs
 * - Supports multi-image deconstruction pipelines
 */

export const SUPPORTED_ROLES = [
  'front',
  'back',
  'side',
  'detail',
  'closeup',
  'sleeve',
  'pocket',
  'collar',
  'construction',
  'fabric',
  'concept',
  'unknown',
];

export const MAX_ANALYSIS_DIMENSION = 1200; // 1200px max dimension provides optimal fidelity for seam detection while preventing 503 payload spikes
export const TARGET_JPEG_QUALITY = 0.82;

/**
 * Converts any File, Blob, or blob: URL into a base64 Data URI.
 */
export async function convertToDataUri(source) {
  if (!source) return '';
  if (typeof source === 'string') {
    if (source.startsWith('data:image/')) return source;
    if (source.startsWith('blob:') && typeof fetch !== 'undefined') {
      try {
        const resp = await fetch(source);
        const blob = await resp.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        console.warn('[Tailorix ImagePrep] Failed to resolve blob URL to base64:', err);
        return source;
      }
    }
    return source;
  }
  if (typeof Blob !== 'undefined' && (source instanceof Blob || (typeof File !== 'undefined' && source instanceof File))) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(source);
    });
  }
  return '';
}

/**
 * Normalizes a single or multiple image inputs into an array of structured image items.
 */
export async function prepareImageForAnalysis(input, defaultRole = 'front') {
  if (!input) return [];

  const rawList = Array.isArray(input) ? input : [input];
  const preparedImages = [];

  const roleCounters = {};

  for (let i = 0; i < rawList.length; i++) {
    const item = rawList[i];
    if (!item) continue;

    let rawSource = '';
    let role = defaultRole;
    let explicitId = null;

    if (typeof item === 'string') {
      rawSource = item;
      role = i === 0 ? defaultRole : 'detail';
    } else if (typeof item === 'object') {
      if (typeof Blob !== 'undefined' && (item instanceof Blob || (typeof File !== 'undefined' && item instanceof File))) {
        rawSource = item;
        role = defaultRole;
      } else {
        rawSource = item.data || item.url || item.base64 || item.src || item.file || '';
        role = item.role && SUPPORTED_ROLES.includes(item.role) ? item.role : defaultRole;
        explicitId = item.id || null;
      }
    }

    const dataUri = await convertToDataUri(rawSource);
    if (!dataUri || typeof dataUri !== 'string') continue;

    // Increment counter for role
    roleCounters[role] = (roleCounters[role] || 0) + 1;
    const stableId = explicitId || `img_${role}_${String(roleCounters[role]).padStart(2, '0')}`;

    // Extract MIME type
    let mimeType = 'image/jpeg';
    if (dataUri.startsWith('data:')) {
      const match = dataUri.match(/^data:([^;]+);base64,/);
      if (match) {
        mimeType = match[1];
      }
    }

    // Resize or optimize if in browser environment and image is large
    let optimizedData = dataUri;
    try {
      if (typeof window !== 'undefined' && typeof document !== 'undefined' && dataUri.startsWith('data:image/')) {
        optimizedData = await optimizeImageDimensions(dataUri, MAX_ANALYSIS_DIMENSION, TARGET_JPEG_QUALITY);
      }
    } catch (optErr) {
      console.warn('[Tailorix ImagePrep] Optimization skipped, using original payload:', optErr);
    }

    preparedImages.push({
      id: stableId,
      role,
      mimeType,
      data: optimizedData,
      sourceIndex: i,
    });
  }

  return preparedImages;
}

/**
 * Resizes an image data URI if its width or height exceeds maxDimension.
 */
function optimizeImageDimensions(dataUri, maxDimension, quality) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let { width, height } = img;
      if (width <= maxDimension && height <= maxDimension) {
        resolve(dataUri);
        return;
      }

      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUri);
        return;
      }

      // High quality smoothing for stitch and texture preservation
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = () => {
      resolve(dataUri);
    };

    img.src = dataUri;
  });
}

/**
 * Alias for multi-image payload preparation.
 */
export const prepareMultiImagePayload = prepareImageForAnalysis;

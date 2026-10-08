/**
 * TAILORIX AI — DECONSTRUCT PROJECT MODEL & PERSISTENCE
 * Standardized data contract connecting Deconstruct -> Project Gallery -> Drafting Board.
 * 
 * Data Contract:
 * DeconstructProject {
 *   id,
 *   title,
 *   name,
 *   category,
 *   isDeconstructProject: true,
 *   isReadOnlyReference: true,
 *   sourceImages,
 *   garmentTaxonomy,
 *   analysis,
 *   reconstruction,
 *   patternBlueprint,
 *   patternPieces,
 *   confidence,
 *   userCorrections,
 *   version,
 *   date,
 *   timestamp,
 *   fabricName
 * }
 */

export const DECONSTRUCT_PROJECT_VERSION = '2.0.0';
export const SAVED_PROJECTS_STORAGE_KEY = 'tailorix_saved_projects';
export const ACTIVE_DECONSTRUCT_KEY = 'tailorix_active_deconstruct_project';

/**
 * Creates a complete, standardized DeconstructProject object.
 */
export function createDeconstructProject(params = {}) {
  const timestamp = params.timestamp || Date.now();
  const id = params.id || `proj_deconstruct_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;
  const garmentType = params.garmentTaxonomy?.garmentType || params.garmentType || 'trouser';
  const silhouette = params.garmentTaxonomy?.silhouette || params.silhouette || 'classic';
  const title = params.title || params.name || `${silhouette.charAt(0).toUpperCase() + silhouette.slice(1)} ${garmentType.charAt(0).toUpperCase() + garmentType.slice(1)}`;

  return {
    id,
    title,
    name: title,
    category: 'Deconstruct Pattern',
    garmentCategory: garmentType,
    isDeconstructProject: true,
    isReadOnlyReference: params.isReadOnlyReference ?? true,
    version: DECONSTRUCT_PROJECT_VERSION,
    timestamp,
    date: params.date || new Date(timestamp).toLocaleDateString(),
    sourceImages: Array.isArray(params.sourceImages) ? params.sourceImages : (params.sourceImage ? [{ id: 'primary', role: 'front', data: params.sourceImage, name: 'Reference Photo' }] : []),
    garmentTaxonomy: {
      garmentType,
      silhouette,
      garmentFamily: params.garmentTaxonomy?.garmentFamily || (['trouser', 'jeans', 'shorts', 'skirt'].includes(garmentType) ? 'bottoms' : 'tops'),
      confidence: params.garmentTaxonomy?.confidence ?? (params.confidence ?? 0.95),
      allowedAttributes: params.garmentTaxonomy?.allowedAttributes || [],
      disallowedAttributes: params.garmentTaxonomy?.disallowedAttributes || [],
    },
    analysis: {
      provider: params.analysis?.provider || 'gemini',
      diagnostics: params.analysis?.diagnostics || {},
      observations: params.analysis?.observations || [],
      uncertainties: params.analysis?.uncertainties || [],
      questionsForUser: params.analysis?.questionsForUser || [],
      imageDescription: params.analysis?.imageDescription || '',
    },
    reconstruction: params.reconstruction || null,
    patternBlueprint: params.patternBlueprint || null,
    patternPieces: Array.isArray(params.patternPieces) ? params.patternPieces : [],
    confidence: params.confidence ?? 0.95,
    userCorrections: params.userCorrections || {},
    fabricName: params.fabricName || 'selvedge_denim',
    tags: ['Deconstruct Pattern', garmentType, silhouette],
  };
}

/**
 * Persists a DeconstructProject into the user's Saved Projects Gallery.
 * Survives reload and navigation without altering other saved items.
 */
export function saveDeconstructProject(project) {
  if (!project || !project.id) return false;
  try {
    const raw = localStorage.getItem(SAVED_PROJECTS_STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const index = existing.findIndex((p) => p.id === project.id);
    let updated;
    if (index >= 0) {
      updated = [...existing];
      updated[index] = { ...updated[index], ...project, timestamp: Date.now() };
    } else {
      updated = [project, ...existing];
    }
    localStorage.setItem(SAVED_PROJECTS_STORAGE_KEY, JSON.stringify(updated));
    // Also save as active project for immediate handoff
    localStorage.setItem(ACTIVE_DECONSTRUCT_KEY, JSON.stringify(project));
    return true;
  } catch (err) {
    console.error('Error saving DeconstructProject to storage:', err);
    return false;
  }
}

/**
 * Retrieves a saved project by ID from Project Gallery.
 */
export function getSavedProjectById(id) {
  if (!id) return null;
  try {
    const raw = localStorage.getItem(SAVED_PROJECTS_STORAGE_KEY);
    if (!raw) return null;
    const existing = JSON.parse(raw);
    return existing.find((p) => p.id === id) || null;
  } catch {
    return null;
  }
}

/**
 * Creates an independent Editable Copy from a Read-Only Deconstruct Project.
 * Preserves the original project unchanged in storage.
 */
export function createEditableCopyFromProject(sourceProject) {
  if (!sourceProject) return null;
  const timestamp = Date.now();
  const copyId = `proj_editable_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;
  const title = `${sourceProject.title || sourceProject.name || 'Pattern'} (Editable Copy)`;

  const editableCopy = {
    ...JSON.parse(JSON.stringify(sourceProject)),
    id: copyId,
    title,
    name: title,
    isReadOnlyReference: false,
    isEditableCopy: true,
    originalProjectId: sourceProject.id,
    timestamp,
    date: new Date(timestamp).toLocaleDateString(),
    tags: [...(sourceProject.tags || []), 'Editable Copy'],
  };

  // Save the editable copy as a distinct new project in Project Gallery
  saveDeconstructProject(editableCopy);
  return editableCopy;
}

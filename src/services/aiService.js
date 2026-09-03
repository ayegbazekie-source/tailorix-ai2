import { supabase } from './supabaseClient';

export async function deconstructGarmentImage(imageBase64) {
  try {
    const { data, error } = await supabase.functions.invoke('deconstruct-garment', {
      body: { image: imageBase64 },
    });

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Error deconstructing garment:', err);
    return { success: false, error: err.message || 'Failed to analyze garment' };
  }
}

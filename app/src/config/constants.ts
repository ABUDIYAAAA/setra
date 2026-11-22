export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const SERVER_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

export interface ExerciseImageItem {
  key: string;
  label: string;
  url: string;
}

/**
 * Returns a fully-qualified URL for an exercise image, or null if not available.
 */
export function getExerciseImageUrl(images: any): string | null {
  if (!images) return null;
  if (typeof images === 'string') {
    return `${SERVER_ORIGIN}/${images.replace(/^\//, '')}`;
  }
  const relativePath =
    images.flat?.start ||
    images.flat?.main ||
    images.flat?.peak ||
    images.start ||
    images.main ||
    images.peak;

  if (relativePath) {
    return `${SERVER_ORIGIN}/${relativePath.replace(/^\//, '')}`;
  }
  return null;
}

/**
 * Returns all available image variants (start, peak, main) with friendly labels.
 */
export function getAllExerciseImages(images: any): ExerciseImageItem[] {
  if (!images) return [];
  const results: ExerciseImageItem[] = [];

  if (images.flat) {
    if (images.flat.start) {
      results.push({
        key: 'start',
        label: 'Start Position',
        url: `${SERVER_ORIGIN}/${images.flat.start.replace(/^\//, '')}`,
      });
    }
    if (images.flat.peak) {
      results.push({
        key: 'peak',
        label: 'Peak Contraction',
        url: `${SERVER_ORIGIN}/${images.flat.peak.replace(/^\//, '')}`,
      });
    }
    if (images.flat.main && results.length === 0) {
      results.push({
        key: 'main',
        label: 'Overview',
        url: `${SERVER_ORIGIN}/${images.flat.main.replace(/^\//, '')}`,
      });
    }
  } else if (typeof images === 'string') {
    results.push({
      key: 'main',
      label: 'Overview',
      url: `${SERVER_ORIGIN}/${images.replace(/^\//, '')}`,
    });
  }

  return results;
}

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'setra_access_token',
  REFRESH_TOKEN: 'setra_refresh_token',
  CACHED_USER: 'setra_cached_user',
};

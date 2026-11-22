import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';

export interface UserProfile {
  id: string;
  googleId?: string | null;
  name: string;
  email: string;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Retrieve cached user profile for instant optimistic hydration on boot.
 */
export async function getCachedUser(): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Cache user profile aggressively.
 */
export async function setCachedUser(user: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CACHED_USER, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to cache user profile:', e);
  }
}

/**
 * Remove cached profile.
 */
export async function clearCachedUser(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.CACHED_USER);
  } catch (e) {
    console.error('Failed to clear cached user:', e);
  }
}

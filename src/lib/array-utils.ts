/**
 * Utility functions for safe array operations
 */

/**
 * Safely get array length, returns 0 if array is undefined/null
 */
export function safeLength<T>(array: T[] | undefined | null): number {
  return array?.length || 0;
}

/**
 * Safely map over array, returns empty array if input is undefined/null
 */
export function safeMap<T, U>(array: T[] | undefined | null, callback: (item: T, index: number, array: T[]) => U): U[] {
  return (array || []).map(callback);
}

/**
 * Safely filter array, returns empty array if input is undefined/null
 */
export function safeFilter<T>(array: T[] | undefined | null, callback: (item: T, index: number, array: T[]) => boolean): T[] {
  return (array || []).filter(callback);
}

/**
 * Safely iterate over array, does nothing if array is undefined/null
 */
export function safeForEach<T>(array: T[] | undefined | null, callback: (item: T, index: number, array: T[]) => void): void {
  (array || []).forEach(callback);
}

/**
 * Safely find item in array, returns undefined if array is undefined/null
 */
export function safeFind<T>(array: T[] | undefined | null, callback: (item: T, index: number, array: T[]) => boolean): T | undefined {
  return (array || []).find(callback);
}

/**
 * Safely ensure array is not undefined, returns empty array as fallback
 */
export function ensureArray<T>(array: T[] | undefined | null): T[] {
  return array || [];
}
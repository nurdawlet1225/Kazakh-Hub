/**
 * Converts Firebase UID (alphanumeric) to numeric ID (12 digits)
 * Uses the same logic as backend to ensure consistency
 */
export function convertToNumericId(firebaseUid: string): string {
  if (!firebaseUid) return '';
  
  // If already numeric, return as-is
  if (/^\d+$/.test(firebaseUid)) {
    return firebaseUid;
  }
  
  // Simple hash function (similar to Python's hash)
  // This ensures consistent conversion across frontend and backend
  let hash = 0;
  for (let i = 0; i < firebaseUid.length; i++) {
    const char = firebaseUid.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  const hashValue = Math.abs(hash);
  // Convert to 12-digit number (same as backend)
  const numericId = String(hashValue % (10 ** 12)).padStart(12, '0');
  
  return numericId;
}

/**
 * Checks if an ID is numeric (only digits)
 */
export function isNumericId(id: string): boolean {
  return /^\d+$/.test(id);
}

/**
 * Ensures an ID is numeric, converting if necessary
 */
export function ensureNumericId(id: string): string {
  if (!id) return '';
  if (isNumericId(id)) {
    return id;
  }
  return convertToNumericId(id);
}












